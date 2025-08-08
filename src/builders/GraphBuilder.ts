// GraphBuilder.ts
// Build a graph from a collection of Policy objects using the mapping rules
import type { Policy } from "@/types/Policy"
import {
  type GraphNode,
  type Graph,
  GraphNodeName,
  GraphNodeNameCategoryMap,
  GraphNodeCategory,
  type GraphEdge,
} from "@/types/Graph"

// Main builder function
export function fromPolicyCollection(policies: Policy[], ignoredSubcategories: string[] = []): Graph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = [] // Reverted to a simple array for edges

  // Helper to add or update a node, but skip if subcategory is ignored
  function addOrUpdateNode(name: GraphNodeName, value: string, policyCode: string) {
    const { category, subcategory } = GraphNodeNameCategoryMap[name]
    if (ignoredSubcategories.includes(subcategory)) return // skip ignored subcategories
    const existing = nodes.find((n) => n.name === name && n.value === value)
    if (existing) {
      if (!existing.policies) existing.policies = []
      if (!existing.policies.includes(policyCode)) existing.policies.push(policyCode)
    } else {
      nodes.push({
        name,
        value,
        policies: [policyCode],
        category,
        subcategory,
      })
    }
  }

  for (const policy of policies) {
    if (!policy.code) continue
    if (policy.conditions.userRiskLevels) {
      for (const v of policy.conditions.userRiskLevels) {
        addOrUpdateNode(GraphNodeName.ConditionsUserRiskLevels, v, policy.code)
      }
    }
    if (policy.conditions.signInRiskLevels) {
      for (const v of policy.conditions.signInRiskLevels) {
        addOrUpdateNode(GraphNodeName.ConditionsSignInRiskLevels, v, policy.code)
      }
    }
    if (policy.conditions.clientAppTypes) {
      for (const v of policy.conditions.clientAppTypes) {
        addOrUpdateNode(GraphNodeName.ConditionsClientAppTypes, v, policy.code)
      }
    }
    if (policy.conditions.servicePrincipalRiskLevels) {
      for (const v of policy.conditions.servicePrincipalRiskLevels) {
        addOrUpdateNode(GraphNodeName.ConditionsServicePrincipalRiskLevels, v, policy.code)
      }
    }
    if (policy.conditions.devices?.deviceFilter) {
      addOrUpdateNode(GraphNodeName.ConditionsDevicesDeviceFilter, policy.conditions.devices.deviceFilter, policy.code)
    }
    if (policy.conditions.applications?.includeApplications) {
      for (const v of policy.conditions.applications.includeApplications) {
        addOrUpdateNode(GraphNodeName.ConditionsApplicationsIncludeApplications, v, policy.code)
      }
    }
    if (policy.conditions.applications?.excludeApplications) {
      for (const v of policy.conditions.applications.excludeApplications) {
        addOrUpdateNode(GraphNodeName.ConditionsApplicationsExcludeApplications, v, policy.code)
      }
    }
    if (policy.conditions.applications?.includeUserActions) {
      for (const v of policy.conditions.applications.includeUserActions) {
        addOrUpdateNode(GraphNodeName.ConditionsApplicationsIncludeUserActions, v, policy.code)
      }
    }
    if (policy.conditions.applications?.includeAuthenticationContextClassReferences) {
      for (const v of policy.conditions.applications.includeAuthenticationContextClassReferences) {
        addOrUpdateNode(GraphNodeName.ConditionsApplicationsIncludeAuthenticationContextClassReferences, v, policy.code)
      }
    }
    if (policy.conditions.applications?.applicationFilter) {
      addOrUpdateNode(
        GraphNodeName.ConditionsApplicationsApplicationFilter,
        policy.conditions.applications.applicationFilter,
        policy.code,
      )
    }
    if (policy.conditions.users?.includeUsers) {
      for (const v of policy.conditions.users.includeUsers) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersIncludeUsers, v, policy.code)
      }
    }
    if (policy.conditions.users?.excludeUsers) {
      for (const v of policy.conditions.users.excludeUsers) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersExcludeUsers, v, policy.code)
      }
    }
    if (policy.conditions.users?.includeGroups) {
      for (const v of policy.conditions.users.includeGroups) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersIncludeGroups, v, policy.code)
      }
    }
    if (policy.conditions.users?.excludeGroups) {
      for (const v of policy.conditions.users.excludeGroups) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersExcludeGroups, v, policy.code)
      }
    }
    if (policy.conditions.users?.includeRoles) {
      for (const v of policy.conditions.users.includeRoles) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersIncludeRoles, v, policy.code)
      }
    }
    if (policy.conditions.users?.excludeRoles) {
      for (const v of policy.conditions.users.excludeRoles) {
        addOrUpdateNode(GraphNodeName.ConditionsUsersExcludeRoles, v, policy.code)
      }
    }
    const includeGuests = policy.conditions.users?.includeGuestsOrExternalUsers
    if (includeGuests?.guestOrExternalUserTypes) {
      if (includeGuests.externalTenants && includeGuests.externalTenants.length > 0) {
        for (const guestType of includeGuests.guestOrExternalUserTypes) {
          for (const tenant of includeGuests.externalTenants) {
            addOrUpdateNode(
              GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers,
              `${guestType} - ${tenant}`,
              policy.code,
            )
          }
        }
      } else {
        for (const guestType of includeGuests.guestOrExternalUserTypes) {
          addOrUpdateNode(
            GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers,
            guestType,
            policy.code,
          )
        }
      }
    }
    const excludeGuests = policy.conditions.users?.excludeGuestsOrExternalUsers
    if (excludeGuests?.guestOrExternalUserTypes) {
      if (excludeGuests.externalTenants && excludeGuests.externalTenants.length > 0) {
        for (const guestType of excludeGuests.guestOrExternalUserTypes) {
          for (const tenant of excludeGuests.externalTenants) {
            addOrUpdateNode(
              GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers,
              `${guestType} - ${tenant}`,
              policy.code,
            )
          }
        }
      } else {
        for (const guestType of excludeGuests.guestOrExternalUserTypes) {
          addOrUpdateNode(
            GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers,
            guestType,
            policy.code,
          )
        }
      }
    }
    if (policy.conditions.platforms?.includePlatforms) {
      for (const v of policy.conditions.platforms.includePlatforms) {
        addOrUpdateNode(GraphNodeName.ConditionsPlatformsIncludePlatforms, v, policy.code)
      }
    }
    if (policy.conditions.platforms?.excludePlatforms) {
      for (const v of policy.conditions.platforms.excludePlatforms) {
        addOrUpdateNode(GraphNodeName.ConditionsPlatformsExcludePlatforms, v, policy.code)
      }
    }
    if (policy.conditions.locations?.includeLocations) {
      for (const v of policy.conditions.locations.includeLocations) {
        addOrUpdateNode(GraphNodeName.ConditionsLocationsIncludeLocations, v, policy.code)
      }
    }
    if (policy.conditions.locations?.excludeLocations) {
      for (const v of policy.conditions.locations.excludeLocations) {
        addOrUpdateNode(GraphNodeName.ConditionsLocationsExcludeLocations, v, policy.code)
      }
    }
    if (policy.conditions.clientApplications?.includeServicePrincipals) {
      for (const v of policy.conditions.clientApplications.includeServicePrincipals) {
        addOrUpdateNode(GraphNodeName.ConditionsClientApplicationsIncludeServicePrincipals, v, policy.code)
      }
    }
    if (policy.conditions.clientApplications?.excludeServicePrincipals) {
      for (const v of policy.conditions.clientApplications.excludeServicePrincipals) {
        addOrUpdateNode(GraphNodeName.ConditionsClientApplicationsExcludeServicePrincipals, v, policy.code)
      }
    }
    if (policy.conditions.clientApplications?.servicePrincipalFilter) {
      addOrUpdateNode(
        GraphNodeName.ConditionsClientApplicationsServicePrincipalFilter,
        policy.conditions.clientApplications.servicePrincipalFilter,
        policy.code,
      )
    }
    if (policy.conditions.authenticationFlows?.transferMethods) {
      for (const v of policy.conditions.authenticationFlows.transferMethods) {
        addOrUpdateNode(GraphNodeName.ConditionsAuthenticationFlowsTransferMethods, v, policy.code)
      }
    }
    if (policy.sessionControls?.disableResilienceDefaults !== undefined) {
      addOrUpdateNode(
        GraphNodeName.SessionControlsDisableResilienceDefaults,
        String(policy.sessionControls.disableResilienceDefaults),
        policy.code,
      )
    }
    if (policy.sessionControls?.applicationEnforcedRestrictions?.isEnabled !== undefined) {
      addOrUpdateNode(
        GraphNodeName.SessionControlsApplicationEnforcedRestrictions,
        String(policy.sessionControls.applicationEnforcedRestrictions.isEnabled),
        policy.code,
      )
    }
    if (policy.sessionControls?.cloudAppSecurity?.cloudAppSecurityType) {
      addOrUpdateNode(
        GraphNodeName.SessionControlsCloudAppSecurity,
        policy.sessionControls.cloudAppSecurity.cloudAppSecurityType,
        policy.code,
      )
    }
    if (policy.sessionControls?.signInFrequency) {
      const sf = policy.sessionControls.signInFrequency
      if (sf.frequencyInterval === "everyTime") {
        addOrUpdateNode(GraphNodeName.SessionControlsSignInFrequency, "Every Time", policy.code)
      } else if (sf.frequencyInterval === "timeBased" && sf.value !== undefined && sf.type) {
        addOrUpdateNode(GraphNodeName.SessionControlsSignInFrequency, `${sf.value} ${sf.type}`, policy.code)
      }
    }
    if (policy.sessionControls?.persistentBrowser?.mode) {
      // mode should be set only when isEnabled is TRUE
      addOrUpdateNode(
        GraphNodeName.SessionControlsPersistentBrowser,
        policy.sessionControls.persistentBrowser.mode,
        policy.code,
      )
    }
    if (policy.grantControls?.builtInControls) {
      const op = policy.grantControls.operator
      if (policy.grantControls.builtInControls.length > 1) {
        for (const v of policy.grantControls.builtInControls) {
          addOrUpdateNode(GraphNodeName.GrantControlsBuiltInControls, `(${op}) ${v}`, policy.code)
        }
      } else if (policy.grantControls.builtInControls.length === 1) {
        // Handle single built-in control without operator prefix
        addOrUpdateNode(
          GraphNodeName.GrantControlsBuiltInControls,
          policy.grantControls.builtInControls[0],
          policy.code,
        )
      }
    }
    if (policy.grantControls?.customAuthenticationFactors) {
      for (const v of policy.grantControls.customAuthenticationFactors) {
        addOrUpdateNode(GraphNodeName.GrantControlsCustomAuthenticationFactor, v, policy.code)
      }
    }
    if (policy.grantControls?.termsOfUse) {
      for (const v of policy.grantControls.termsOfUse) {
        addOrUpdateNode(GraphNodeName.GrantControlsTermsOfUse, v, policy.code)
      }
    }

    // After adding all nodes for this policy, ensure each main category has a node
    const mainCategories = [
      { category: GraphNodeCategory.Users, name: GraphNodeName.UsersNone, value: "None" },
      { category: GraphNodeCategory.TargetResources, name: GraphNodeName.TargetResourcesNone, value: "None" },
      { category: GraphNodeCategory.Network, name: GraphNodeName.NetworkNotConfigured, value: "Not configured" },
      { category: GraphNodeCategory.Conditions, name: GraphNodeName.ConditionsNotConfigured, value: "Not configured" },
      { category: GraphNodeCategory.Grant, name: GraphNodeName.GrantNotConfigured, value: "Not configured" },
      { category: GraphNodeCategory.Session, name: GraphNodeName.SessionNotConfigured, value: "Not configured" },
    ]
    for (const { category, name, value } of mainCategories) {
      const hasNode = nodes.some((n) => n.category === category && n.policies && n.policies.includes(policy.code!))
      if (!hasNode) {
        addOrUpdateNode(name, value, policy.code!)
      }
    }
  }

  // Build edges: for each policy, for each category in order, connect all nodes in current category to all nodes in next category
  const orderedCategories = Object.values(GraphNodeCategory)
  for (const policy of policies) {
    if (!policy.code) continue
    for (let i = 0; i < orderedCategories.length - 1; i++) {
      const catA = orderedCategories[i]
      const catB = orderedCategories[i + 1]
      const nodesA = nodes.filter((n) => n.category === catA && n.policies && n.policies.includes(policy.code!))
      const nodesB = nodes.filter((n) => n.category === catB && n.policies && n.policies.includes(policy.code!))
      for (const nodeA of nodesA) {
        for (const nodeB of nodesB) {
          // No deduplication: simply push the edge
          edges.push({ node1: nodeA, node2: nodeB })
        }
      }
    }
  }

  return { nodes, edges }
}
