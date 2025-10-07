import { PublicClientApplication, type AuthenticationResult, type Configuration } from "@azure/msal-browser"
import { fromGraphPolicy, type GraphConditionalAccessPolicy, type IdTranslatorHelpers } from "@/builders/EntraPolicyBuilder"
import type { Policy } from "@/types/Policy"

// Scopes for Conditional Access policies (requires Policy.Read.All). For delegated auth, admin consent required.
const GRAPH_SCOPES = ["Policy.Read.All", "Directory.Read.All"]

export interface EntraAuthConfig {
  clientId: string
  tenantId: string
}

let pcaCache: PublicClientApplication | null = null
let pcaInitPromise: Promise<void> | null = null
let pcaInitialized = false

function getPCA(cfg: EntraAuthConfig): PublicClientApplication {
  if (pcaCache) return pcaCache
  const config: Configuration = {
    auth: {
      clientId: cfg.clientId,
      authority: `https://login.microsoftonline.com/${cfg.tenantId}`,
  // Use exact origin; avoid adding a trailing slash to prevent mismatch with registered redirect URI
  redirectUri: (typeof window !== 'undefined' ? window.location.origin : '/'),
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
  }
  pcaCache = new PublicClientApplication(config)
  return pcaCache
}

async function ensurePCAInitialized(cfg: EntraAuthConfig): Promise<PublicClientApplication> {
  const pca = getPCA(cfg)
  if (pcaInitialized) return pca
  if (!pcaInitPromise) {
    pcaInitPromise = pca.initialize().then(() => { pcaInitialized = true })
  }
  await pcaInitPromise
  return pca
}

export async function login(cfg: EntraAuthConfig): Promise<AuthenticationResult> {
  const pca = await ensurePCAInitialized(cfg)
  // Use popup to keep SPA simple
  const result = await pca.loginPopup({ scopes: GRAPH_SCOPES })
  return result
}

async function acquireToken(cfg: EntraAuthConfig): Promise<string> {
  const pca = await ensurePCAInitialized(cfg)
  const accounts = pca.getAllAccounts()
  if (accounts.length === 0) {
    await login(cfg)
  }
  const account = pca.getAllAccounts()[0]
  const result = await pca.acquireTokenSilent({ scopes: GRAPH_SCOPES, account }).catch(async () => {
    return pca.acquireTokenPopup({ scopes: GRAPH_SCOPES })
  })
  return result.accessToken
}

interface GraphErrorBody { error?: { code?: string; message?: string; innerError?: Record<string, unknown> } }

async function graphGet<T>(token: string, url: string): Promise<T> {
  if (!token) throw new Error('Missing auth token for Graph request')
  if (!url) throw new Error('Missing URL for Graph request')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    let bodyText = ''
    let graphError: GraphErrorBody | undefined
    try {
      bodyText = await res.text()
      try { graphError = JSON.parse(bodyText) } catch { /* ignore */ }
    } catch { /* ignore */ }
    // Avoid logging complex/iterable objects directly which may throw in some environments
    const safeBody = typeof bodyText === 'string' ? bodyText : '(unreadable body)'
    const safeGraphError = graphError ? { error: graphError.error } : undefined
    console.error('[Graph] Request failed', { url, status: res.status, body: safeBody || '(empty)', graphError: safeGraphError })
    const errMsg = graphError?.error?.message || `Graph request failed: ${res.status}`
    const err = new Error(errMsg)
    ;(err as any).status = res.status
    ;(err as any).graph = graphError
    throw err
  }
  try {
    const json = await res.json()
    return json as T
  } catch (e) {
    console.error('[Graph] Failed to parse JSON', { url, error: e })
    throw e
  }
}

// ---------------- Targeted ID resolution (avoids broad tenant enumeration) ----------------
const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function collectReferencedIds(policies: GraphConditionalAccessPolicy[]) {
  const users = new Set<string>()
  const groups = new Set<string>()
  const roles = new Set<string>()
  const servicePrincipals = new Set<string>()
  const applications = new Set<string>()
  const namedLocations = new Set<string>()

  const addAll = (arr: unknown, set: Set<string>) => {
    if (!Array.isArray(arr)) return
    for (const v of arr) if (typeof v === 'string' && GUID_REGEX.test(v)) set.add(v)
  }

  for (const p of policies) {
    const c: any = p.conditions || {}
    const usersCond = c.users || {}
    const appsCond = c.applications || {}
    const clientAppsCond = c.clientApplications || {}
    const locationsCond = c.locations || {}

    addAll(usersCond.includeUsers, users)
    addAll(usersCond.excludeUsers, users)
    addAll(usersCond.includeGroups, groups)
    addAll(usersCond.excludeGroups, groups)
    addAll(usersCond.includeRoles, roles)
    addAll(usersCond.excludeRoles, roles)
    addAll(appsCond.includeApplications, applications)
    addAll(appsCond.excludeApplications, applications)
    addAll(clientAppsCond.includeServicePrincipals, servicePrincipals)
    addAll(clientAppsCond.excludeServicePrincipals, servicePrincipals)
    addAll(locationsCond.includeLocations, namedLocations)
    addAll(locationsCond.excludeLocations, namedLocations)
  }
  const directoryObjectIds = Array.from(new Set([
    ...users,
    ...groups,
    ...roles,
    ...servicePrincipals,
    ...applications,
  ]))
  return { users, groups, roles, servicePrincipals, applications, namedLocations, directoryObjectIds }
}

async function resolveDirectoryObjects(token: string, ids: string[], batchSize = 1000): Promise<Map<string, { id: string; displayName?: string; odataType?: string }>> {
  const map = new Map<string, { id: string; displayName?: string; odataType?: string }>()
  for (let i = 0; i < ids.length; i += batchSize) {
    const slice = ids.slice(i, i + batchSize)
    const body = { ids: slice }
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch('https://graph.microsoft.com/v1.0/directoryObjects/getByIds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        console.error('[Graph] getByIds failed', { status: resp.status, body: txt })
        continue
      }
      const json = await resp.json() as { value?: Array<{ id?: string; displayName?: string; ['@odata.type']?: string }> }
      for (const obj of json.value || []) {
        if (obj.id) map.set(obj.id, { id: obj.id, displayName: obj.displayName, odataType: obj['@odata.type'] })
      }
    } catch (e) {
      console.error('[Graph] getByIds batch error', e)
    }
  }
  return map
}

async function resolveNamedLocations(token: string, ids: Set<string>): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  for (const id of ids) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const nl = await graphGet<{ id?: string; displayName?: string }>(token, `https://graph.microsoft.com/v1.0/identity/conditionalAccess/namedLocations/${id}?$select=id,displayName`)
      if (nl.id) result.set(nl.id, nl.displayName || nl.id)
    } catch (e) {
      console.warn('[Graph] Failed to fetch named location', { id, error: e })
    }
  }
  return result
}

async function buildTranslatorsTargeted(token: string, policies: GraphConditionalAccessPolicy[]): Promise<IdTranslatorHelpers> {
  const collected = collectReferencedIds(policies)
  console.info('[EntraImport] ID summary', {
    users: collected.users.size,
    groups: collected.groups.size,
    roles: collected.roles.size,
    servicePrincipals: collected.servicePrincipals.size,
    applications: collected.applications.size,
    namedLocations: collected.namedLocations.size,
  })
  const directoryMap = await resolveDirectoryObjects(token, collected.directoryObjectIds)
  const namedLocationMap = await resolveNamedLocations(token, collected.namedLocations)
  // Roles in CA policies can reference directoryRoles OR directoryRoleTemplates. If unresolved after getByIds, try both collections.
  const unresolvedRoleIds: string[] = [...collected.roles].filter(r => !directoryMap.has(r))
  if (unresolvedRoleIds.length) {
    try {
      // Fetch active directoryRoles (usually small set)
      const rolesResp = await graphGet<{ value?: Array<{ id?: string; displayName?: string }> }>(token, 'https://graph.microsoft.com/v1.0/directoryRoles?$select=id,displayName')
      for (const r of rolesResp.value || []) {
        if (r.id && !directoryMap.has(r.id)) directoryMap.set(r.id, { id: r.id, displayName: r.displayName })
      }
      // Determine leftover after active roles
      const stillUnresolved = unresolvedRoleIds.filter(r => !directoryMap.has(r))
      if (stillUnresolved.length) {
        // Attempt directoryRoleTemplates (referenced when role not activated in tenant yet)
        const templatesResp = await graphGet<{ value?: Array<{ id?: string; displayName?: string }> }>(token, 'https://graph.microsoft.com/v1.0/directoryRoleTemplates?$select=id,displayName')
        for (const t of templatesResp.value || []) {
          if (t.id && stillUnresolved.includes(t.id) && !directoryMap.has(t.id)) {
            directoryMap.set(t.id, { id: t.id, displayName: t.displayName })
          }
        }
      }
      const unresolvedAfterAll = unresolvedRoleIds.filter(r => !directoryMap.has(r))
      if (unresolvedAfterAll.length) {
        console.warn('[EntraImport] Some role IDs unresolved; displaying raw IDs', { count: unresolvedAfterAll.length, sample: unresolvedAfterAll.slice(0, 5) })
      }
    } catch (e) {
      console.warn('[EntraImport] Role resolution fallback failed', e)
    }
  }
  const lookup = (set: Set<string>) => (id: string) => set.has(id) ? (directoryMap.get(id)?.displayName) : directoryMap.get(id)?.displayName
  return {
    userDisplayName: lookup(collected.users),
    groupDisplayName: lookup(collected.groups),
    directoryRoleDisplayName: lookup(collected.roles),
    appDisplayName: lookup(collected.applications),
    spDisplayName: lookup(collected.servicePrincipals),
    namedLocationDisplayName: (id) => namedLocationMap.get(id),
  }
}

export type FetchEntraPoliciesOptions = EntraAuthConfig

export async function fetchEntraPolicies(options: FetchEntraPoliciesOptions): Promise<Policy[]> {
  console.info('[EntraImport] Starting policy import')
  const start = performance.now()
  const token = await acquireToken(options)
  console.info('[EntraImport] Token acquired')
  // Fetch raw policies first
  console.info('[EntraImport] Fetching raw policies')
  const policiesUrl = 'https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies?$top=200'
  let json: { value: GraphConditionalAccessPolicy[] }
  try {
    json = await graphGet<{ value: GraphConditionalAccessPolicy[] }>(token, policiesUrl)
  } catch (e) {
    console.error('[EntraImport] Failed to fetch policies', e)
    throw e
  }
  if (!json.value.length) {
    console.warn('[EntraImport] No policies returned. Possible causes: missing Policy.Read.All consent, no policies exist, or tenant restrictions.')
  }
  if (!json || !Array.isArray(json.value)) {
    console.error('[EntraImport] Unexpected policies response shape', json)
    throw new Error('Unexpected policies response from Graph')
  }
  const translators = await buildTranslatorsTargeted(token, json.value)
  console.info('[EntraImport] Translators (targeted) ready')
  const policies = json.value.map((raw, idx) => {
    try {
      return fromGraphPolicy(raw, translators)
    } catch (e) {
      console.error('[EntraImport] Failed to transform policy', { index: idx, id: raw?.id, raw, error: e })
      return null
    }
  }).filter((p): p is Policy => !!p)
  policies.sort((a, b) => (a.code || '').localeCompare(b.code || ''))
  const end = performance.now()
  console.info('[EntraImport] Completed', { count: policies.length, ms: Math.round(end - start) })
  return policies
}
