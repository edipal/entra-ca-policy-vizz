import type { Policy } from "@/types/Policy"
import {
  CloudAppSecurityType,
  PersistentBrowserMode,
  type BuiltInGrantControl,
  type GuestOrExternalUserType,
} from "@/types/Policy"
import { GraphNodeName } from "@/types/Graph"

// Build a per-policy map of GraphNodeName -> Set of formatted string values
export function extractPolicyFieldValueSets(policy: Policy): Map<GraphNodeName, Set<string>> {
  const map = new Map<GraphNodeName, Set<string>>()

  const add = (name: GraphNodeName, value: string | undefined) => {
    if (!value) return
    if (!map.has(name)) map.set(name, new Set<string>())
    map.get(name)!.add(value)
  }

  // Note: do not depend on policy.code for extracting values; filters should work even without codes

  // Conditions - risks
  policy.conditions.userRiskLevels?.forEach((v) => add(GraphNodeName.ConditionsUserRiskLevels, String(v)))
  policy.conditions.signInRiskLevels?.forEach((v) => add(GraphNodeName.ConditionsSignInRiskLevels, String(v)))
  policy.conditions.servicePrincipalRiskLevels?.forEach((v) =>
    add(GraphNodeName.ConditionsServicePrincipalRiskLevels, String(v)),
  )

  // Conditions - client app types
  policy.conditions.clientAppTypes?.forEach((v) => add(GraphNodeName.ConditionsClientAppTypes, String(v)))

  // Conditions - devices.deviceFilter { mode, rule } -> "(+) rule" | "(-) rule"
  if (policy.conditions.devices?.deviceFilter) {
    const filter = policy.conditions.devices.deviceFilter
    const prefix = filter.mode === "include" ? "(+) " : filter.mode === "exclude" ? "(-) " : ""
    add(GraphNodeName.ConditionsDevicesDeviceFilter, `${prefix}${filter.rule}`)
  }

  // Conditions - applications
  policy.conditions.applications?.includeApplications?.forEach((v) =>
    add(GraphNodeName.ConditionsApplicationsIncludeApplications, v),
  )
  policy.conditions.applications?.excludeApplications?.forEach((v) =>
    add(GraphNodeName.ConditionsApplicationsExcludeApplications, v),
  )
  policy.conditions.applications?.includeUserActions?.forEach((v) =>
    add(GraphNodeName.ConditionsApplicationsIncludeUserActions, String(v)),
  )
  policy.conditions.applications?.includeAuthenticationContextClassReferences?.forEach((v) =>
    add(GraphNodeName.ConditionsApplicationsIncludeAuthenticationContextClassReferences, v),
  )
  if (policy.conditions.applications?.applicationFilter) {
    const filter = policy.conditions.applications.applicationFilter
    const prefix = filter.mode === "include" ? "(+) " : filter.mode === "exclude" ? "(-) " : ""
    add(GraphNodeName.ConditionsApplicationsApplicationFilter, `${prefix}${filter.rule}`)
  }

  // Conditions - users
  policy.conditions.users?.includeUsers?.forEach((v) => add(GraphNodeName.ConditionsUsersIncludeUsers, v))
  policy.conditions.users?.excludeUsers?.forEach((v) => add(GraphNodeName.ConditionsUsersExcludeUsers, v))
  policy.conditions.users?.includeGroups?.forEach((v) => add(GraphNodeName.ConditionsUsersIncludeGroups, v))
  policy.conditions.users?.excludeGroups?.forEach((v) => add(GraphNodeName.ConditionsUsersExcludeGroups, v))
  policy.conditions.users?.includeRoles?.forEach((v) => add(GraphNodeName.ConditionsUsersIncludeRoles, v))
  policy.conditions.users?.excludeRoles?.forEach((v) => add(GraphNodeName.ConditionsUsersExcludeRoles, v))

  // Guests/external users values can be plain type or "type - tenant"
  const includeGuests = policy.conditions.users?.includeGuestsOrExternalUsers
  if (includeGuests?.guestOrExternalUserTypes) {
    if (includeGuests.externalTenants && includeGuests.externalTenants.length > 0) {
      includeGuests.guestOrExternalUserTypes.forEach((guestType: GuestOrExternalUserType) => {
        includeGuests.externalTenants!.forEach((tenant: string) => {
          add(GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers, `${guestType} - ${tenant}`)
        })
      })
    } else {
      includeGuests.guestOrExternalUserTypes.forEach((guestType) => {
        add(GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers, String(guestType))
      })
    }
  }
  const excludeGuests = policy.conditions.users?.excludeGuestsOrExternalUsers
  if (excludeGuests?.guestOrExternalUserTypes) {
    if (excludeGuests.externalTenants && excludeGuests.externalTenants.length > 0) {
      excludeGuests.guestOrExternalUserTypes.forEach((guestType: GuestOrExternalUserType) => {
        excludeGuests.externalTenants!.forEach((tenant: string) => {
          add(GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers, `${guestType} - ${tenant}`)
        })
      })
    } else {
      excludeGuests.guestOrExternalUserTypes.forEach((guestType) => {
        add(GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers, String(guestType))
      })
    }
  }

  // Conditions - platforms
  policy.conditions.platforms?.includePlatforms?.forEach((v) =>
    add(GraphNodeName.ConditionsPlatformsIncludePlatforms, String(v)),
  )
  policy.conditions.platforms?.excludePlatforms?.forEach((v) =>
    add(GraphNodeName.ConditionsPlatformsExcludePlatforms, String(v)),
  )

  // Conditions - locations
  policy.conditions.locations?.includeLocations?.forEach((v) =>
    add(GraphNodeName.ConditionsLocationsIncludeLocations, v),
  )
  policy.conditions.locations?.excludeLocations?.forEach((v) =>
    add(GraphNodeName.ConditionsLocationsExcludeLocations, v),
  )

  // Conditions - client applications
  policy.conditions.clientApplications?.includeServicePrincipals?.forEach((v) =>
    add(GraphNodeName.ConditionsClientApplicationsIncludeServicePrincipals, v),
  )
  policy.conditions.clientApplications?.excludeServicePrincipals?.forEach((v) =>
    add(GraphNodeName.ConditionsClientApplicationsExcludeServicePrincipals, v),
  )
  if (policy.conditions.clientApplications?.servicePrincipalFilter) {
    const filter = policy.conditions.clientApplications.servicePrincipalFilter
    const prefix = filter.mode === "include" ? "(+) " : filter.mode === "exclude" ? "(-) " : ""
    add(GraphNodeName.ConditionsClientApplicationsServicePrincipalFilter, `${prefix}${filter.rule}`)
  }

  // Conditions - authentication flows (array of strings)
  policy.conditions.authenticationFlows?.forEach((v) =>
    add(GraphNodeName.ConditionsAuthenticationFlowsTransferMethods, String(v)),
  )

  // Session controls
  if (policy.sessionControls?.disableResilienceDefaults !== undefined) {
    add(
      GraphNodeName.SessionControlsDisableResilienceDefaults,
      String(policy.sessionControls.disableResilienceDefaults),
    )
  }
  if (policy.sessionControls?.applicationEnforcedRestrictions !== undefined) {
    add(
      GraphNodeName.SessionControlsApplicationEnforcedRestrictions,
      String(policy.sessionControls.applicationEnforcedRestrictions),
    )
  }
  if (policy.sessionControls?.cloudAppSecurity) {
    add(
      GraphNodeName.SessionControlsCloudAppSecurity,
      String(policy.sessionControls.cloudAppSecurity as CloudAppSecurityType),
    )
  }
  if (policy.sessionControls?.signInFrequency) {
    const sf = policy.sessionControls.signInFrequency
    if (sf.frequencyInterval === "everyTime") {
      add(GraphNodeName.SessionControlsSignInFrequency, "Every Time")
    } else if (sf.frequencyInterval === "timeBased" && sf.value !== undefined && sf.type) {
      add(GraphNodeName.SessionControlsSignInFrequency, `${sf.value} ${sf.type}`)
    }
  }
  if (policy.sessionControls?.persistentBrowser) {
    add(
      GraphNodeName.SessionControlsPersistentBrowser,
      String(policy.sessionControls.persistentBrowser as PersistentBrowserMode),
    )
  }

  // Grant controls
  if (policy.grantControls?.builtInControls && policy.grantControls.builtInControls.length > 0) {
    const op = policy.grantControls.operator
    if (policy.grantControls.builtInControls.length > 1 && op) {
      policy.grantControls.builtInControls.forEach((v: BuiltInGrantControl) =>
        add(GraphNodeName.GrantControlsBuiltInControls, `(${op}) ${v}`),
      )
    } else {
      policy.grantControls.builtInControls.forEach((v: BuiltInGrantControl) =>
        add(GraphNodeName.GrantControlsBuiltInControls, String(v)),
      )
    }
  }
  policy.grantControls?.customAuthenticationFactors?.forEach((v) =>
    add(GraphNodeName.GrantControlsCustomAuthenticationFactor, v),
  )
  policy.grantControls?.termsOfUse?.forEach((v) => add(GraphNodeName.GrantControlsTermsOfUse, v))

  return map
}

// Aggregate all possible values per field across policies
export function aggregateFieldValues(policies: Policy[]): Record<GraphNodeName, string[]> {
  const aggregate = new Map<GraphNodeName, Set<string>>()

  for (const policy of policies) {
    const perPolicy = extractPolicyFieldValueSets(policy)
    for (const [name, set] of perPolicy.entries()) {
      if (!aggregate.has(name)) aggregate.set(name, new Set<string>())
      const aggSet = aggregate.get(name)!
      set.forEach((v) => aggSet.add(v))
    }
  }

  const result = {} as Record<GraphNodeName, string[]>
  for (const [name, set] of aggregate.entries()) {
    const arr = Array.from(set)
    if (arr.length === 0) continue
    arr.sort()
    result[name] = arr
  }
  return result
}

// Policy filter predicate using the same transformation as the graph
export function policyMatchesFilter(policy: Policy, field: GraphNodeName, value: string): boolean {
  const map = extractPolicyFieldValueSets(policy)
  const set = map.get(field)
  if (!set) return false
  return set.has(value)
}
