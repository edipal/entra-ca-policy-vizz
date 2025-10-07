import { Policy } from "@/types/Policy"
import { ConditionalAccessPolicyState, ClientAppType, DevicePlatform, RiskLevel, BuiltInGrantControl, PersistentBrowserMode, CloudAppSecurityType, SignInFrequencyType, SignInFrequencyAuthenticationType, SignInFrequencyInterval, GuestOrExternalUserType, ContinuousAccessEvaluationType, Operator, UserActionType, FilterModeType } from "@/types/Policy"

// The Entra (MS Graph) raw policy shape (subset) we care about. We keep it loose to avoid exhaustive typing now
// Minimal Graph policy representation (we only type the parts we access)
export interface GraphConditionalAccessPolicy {
  id?: string
  displayName?: string
  createdDateTime?: string
  modifiedDateTime?: string
  state?: string
  description?: string
  conditions?: {
    applications?: Record<string, unknown>
    clientApplications?: Record<string, unknown>
    users?: Record<string, unknown>
    platforms?: Record<string, unknown>
    locations?: Record<string, unknown>
    devices?: Record<string, unknown>
    servicePrincipalRiskLevels?: string[]
    signInRiskLevels?: string[]
    userRiskLevels?: string[]
    insiderRiskLevels?: string[]
    clientAppTypes?: string[]
    authenticationFlows?: Record<string, unknown>
  }
  grantControls?: Record<string, unknown>
  sessionControls?: Record<string, unknown>
}

export function fromGraphPolicy(raw: GraphConditionalAccessPolicy, helpers: IdTranslatorHelpers): Policy {
  const displayName = raw.displayName
  const codeFromDisplay = displayName?.match(/CA\d{3,5}/)?.[0]
  const code = codeFromDisplay || displayName || raw.id

  const conditions = raw.conditions || {}
  const applications = (conditions.applications || {}) as Record<string, unknown>
  const clientApplications = (conditions.clientApplications || {}) as Record<string, unknown>
  const users = (conditions.users || {}) as Record<string, unknown>
  const platforms = (conditions.platforms || {}) as Record<string, unknown>
  const locations = (conditions.locations || {}) as Record<string, unknown>
  const devices = (conditions.devices || {}) as Record<string, unknown>
  const servicePrincipalRiskLevels = (conditions.servicePrincipalRiskLevels || []) as string[]
  const signInRiskLevels = (conditions.signInRiskLevels || []) as string[]
  const userRiskLevels = (conditions.userRiskLevels || []) as string[]
  const insiderRiskLevels = (conditions.insiderRiskLevels || []) as string[]
  const authenticationFlows = (conditions.authenticationFlows || {}) as Record<string, unknown>

  type UnknownRecord = Record<string, unknown>
  const grantControls = (raw.grantControls || {}) as UnknownRecord
  const sessionControls = (raw.sessionControls || {}) as UnknownRecord

  // Safe access helpers
  const getObj = (o: UnknownRecord, key: string): UnknownRecord | undefined => (o && typeof o[key] === 'object' && o[key] !== null ? o[key] as UnknownRecord : undefined)
  const getArray = (o: UnknownRecord, key: string): string[] => Array.isArray(o[key]) ? o[key] as string[] : []
  const getStr = (o: UnknownRecord | undefined, key: string): string | undefined => (o && typeof o[key] === 'string' ? o[key] as string : undefined)
  const getBool = (o: UnknownRecord | undefined, key: string): boolean | undefined => (o && typeof o[key] === 'boolean' ? o[key] as boolean : undefined)
  const getNumber = (o: UnknownRecord | undefined, key: string): number | undefined => (o && typeof o[key] === 'number' ? o[key] as number : undefined)

  const policy: Policy = {
    id: raw.id,
    displayName,
    code,
    description: raw.description,
    createdDateTime: raw.createdDateTime,
    modifiedDateTime: raw.modifiedDateTime,
    state: mapEnum(raw.state, ConditionalAccessPolicyState),
    conditions: {
      applications: {
        includeApplications: resolveIds(applications["includeApplications"], helpers.appDisplayName) || [],
        excludeApplications: resolveIds(applications["excludeApplications"], helpers.appDisplayName) || [],
        includeUserActions: filterEnumArray(applications["includeUserActions"], UserActionType),
        //check check check
        includeAuthenticationContextClassReferences: getArray(applications, "includeAuthenticationContextClassReferences"),
        applicationFilter: {
          mode: mapEnum(getStr(getObj(applications, "applicationFilter"), "mode"), FilterModeType),
          rule: getStr(getObj(applications, "applicationFilter"), "rule"),
        }
      },
      authenticationFlows: getArray(authenticationFlows, "transferMethods"),
      clientApplications: {
        includeServicePrincipals: resolveIds(clientApplications["includeServicePrincipals"], helpers.spDisplayName) || [],
        excludeServicePrincipals: resolveIds(clientApplications["excludeServicePrincipals"], helpers.spDisplayName) || [],
        servicePrincipalFilter: {
          mode: mapEnum(getStr(getObj(clientApplications, "servicePrincipalFilter"), "mode"), FilterModeType),
          rule: getStr(getObj(clientApplications, "servicePrincipalFilter"), "rule"),
        }
      },
      clientAppTypes: filterEnumArray(conditions.clientAppTypes, ClientAppType),
      devices: {
        deviceFilter: {
          mode: mapEnum(getStr(getObj(devices, "deviceFilter"), "mode"), FilterModeType),
          rule: getStr(getObj(devices, "deviceFilter"), "rule"),
        }
      },
      locations: {
        includeLocations: resolveIds(locations["includeLocations"], helpers.namedLocationDisplayName) || [],
        excludeLocations: resolveIds(locations["excludeLocations"], helpers.namedLocationDisplayName) || [],
      },
      platforms: {
        includePlatforms: filterEnumArray(platforms["includePlatforms"], DevicePlatform),
        excludePlatforms: filterEnumArray(platforms["excludePlatforms"], DevicePlatform),
      },
      servicePrincipalRiskLevels: filterEnumArray(servicePrincipalRiskLevels, RiskLevel),
      signInRiskLevels: filterEnumArray(signInRiskLevels, RiskLevel),
      userRiskLevels: filterEnumArray(userRiskLevels, RiskLevel),
      users: {
        includeUsers: resolveIds(users["includeUsers"], helpers.userDisplayName) || [],
        excludeUsers: resolveIds(users["excludeUsers"], helpers.userDisplayName) || [],
        includeGroups: resolveIds(users["includeGroups"], helpers.groupDisplayName) || [],
        excludeGroups: resolveIds(users["excludeGroups"], helpers.groupDisplayName) || [],
        includeRoles: resolveIds(users["includeRoles"], helpers.directoryRoleDisplayName) || [],
        excludeRoles: resolveIds(users["excludeRoles"], helpers.directoryRoleDisplayName) || [],
        includeGuestsOrExternalUsers: {
          externalTenants: (() => {
            const inc = getObj(users, "includeGuestsOrExternalUsers")
            const tenants = inc && getObj(inc, "externalTenants")
            const rawMembers = tenants && (tenants as { members?: unknown }).members
            return Array.isArray(rawMembers) ? rawMembers.filter(m => typeof m === 'string') as string[] : []
          })(),
          guestOrExternalUserTypes: filterEnumArray(getObj(users, "includeGuestsOrExternalUsers")?.guestOrExternalUserTypes, GuestOrExternalUserType),
        },
        excludeGuestsOrExternalUsers: {
          externalTenants: (() => {
            const exc = getObj(users, "excludeGuestsOrExternalUsers")
            const tenants = exc && getObj(exc, "externalTenants")
            const rawMembers = tenants && (tenants as { members?: unknown }).members
            return Array.isArray(rawMembers) ? rawMembers.filter(m => typeof m === 'string') as string[] : []
          })(),
            guestOrExternalUserTypes: filterEnumArray(getObj(users, "excludeGuestsOrExternalUsers")?.guestOrExternalUserTypes, GuestOrExternalUserType),
        }
      },
      // check check check
      insiderRiskLevels: insiderRiskLevels || [],
    },
    grantControls: {
      builtInControls: filterEnumArray(grantControls["builtInControls"], BuiltInGrantControl),
      customAuthenticationFactors: getArray(grantControls, "customAuthenticationFactors"),
      termsOfUse: getArray(grantControls, "termsOfUse"),
      operator: mapEnum(getStr(grantControls, "operator"), Operator),
      authenticationStrength: getStr(getObj(grantControls, "authenticationStrength"), "displayName"),
    },
    sessionControls: {
      applicationEnforcedRestrictions: getBool(getObj(grantControls, "applicationEnforcedRestrictions"), "isEnabled"),
      cloudAppSecurity: mapEnum(getStr(getObj(getObj(sessionControls, "cloudAppSecurity") || {}, "") || getObj(sessionControls, "cloudAppSecurity"), "cloudAppSecurityType"), CloudAppSecurityType),
      continuousAccessEvaluation: mapEnum(getStr(getObj(sessionControls, "continuousAccessEvaluation"), "mode"), ContinuousAccessEvaluationType),
      disableResilienceDefaults: getBool(sessionControls, "disableResilienceDefaults"),
      persistentBrowser: mapEnum(getStr(getObj(sessionControls, "persistentBrowser"), "mode"), PersistentBrowserMode),
      secureSignInSession: getBool(getObj(sessionControls, "secureSignInSession"), "isEnabled"),
      signInFrequency: {
        value: getNumber(getObj(sessionControls, "signInFrequency"), "value"),
        type: mapEnum(getStr(getObj(sessionControls, "signInFrequency"), "type"), SignInFrequencyType),
        authenticationType: mapEnum(getStr(getObj(sessionControls, "signInFrequency"), "authenticationType"), SignInFrequencyAuthenticationType),
        frequencyInterval: mapEnum(getStr(getObj(sessionControls, "signInFrequency"), "frequencyInterval"), SignInFrequencyInterval),
      },
      globalSecureAccessFilteringProfile: getStr(getObj(sessionControls, "globalSecureAccessFilteringProfile"), "id"),
    }
  }
  return policy
}

// Generic helpers
function mapEnum<T extends Record<string, string>>(value: string | undefined, enumType: T): T[keyof T] | undefined {
  if (!value) return undefined
  const vals = Object.values(enumType) as string[]
  return vals.includes(value) ? (value as T[keyof T]) : undefined
}
function filterEnumArray<T extends Record<string, string>>(arr: unknown, enumType: T): T[keyof T][] {
  if (!Array.isArray(arr)) return []
  const vals = new Set(Object.values(enumType) as string[])
  return (arr as unknown[]).filter((v): v is T[keyof T] => typeof v === "string" && vals.has(v as string))
}
function resolveIds(arr: unknown, resolver: (id: string) => string | undefined): string[] | undefined {
  if (!Array.isArray(arr)) return []
  return (arr as unknown[]).map((id) => (typeof id === 'string' ? (resolver(id) || id) : String(id)))
}

export interface IdTranslatorHelpers {
  userDisplayName: (id: string) => string | undefined
  groupDisplayName: (id: string) => string | undefined
  directoryRoleDisplayName: (id: string) => string | undefined
  appDisplayName: (id: string) => string | undefined
  spDisplayName: (id: string) => string | undefined
  namedLocationDisplayName: (id: string) => string | undefined
}
