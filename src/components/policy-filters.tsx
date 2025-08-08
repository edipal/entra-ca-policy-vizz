"use client"

import React, { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { GraphNodeName } from "@/types/Graph"
import { ConditionalAccessPolicyState } from "@/types/Policy"
import type { Policy } from "@/types/Policy"

export interface PolicyFilter {
  id: string
  field: GraphNodeName | ""
  value: string
}

interface PolicyFiltersProps {
  policies: Policy[] | null
  filters: PolicyFilter[]
  operator: "AND" | "OR"
  onFiltersChange: (filters: PolicyFilter[]) => void
  onOperatorChange: (operator: "AND" | "OR") => void
  onFilteredPoliciesChange?: (policies: Policy[]) => void // NEW PROP
}

export default function PolicyFilters({
  policies,
  filters,
  operator,
  onFiltersChange,
  onOperatorChange,
  onFilteredPoliciesChange,
}: PolicyFiltersProps) {
  // State filter
  const [selectedState, setSelectedState] = React.useState<string>("all")

  // Combine all filters (state + field filters + operator)
  const filteredPolicies = useMemo(() => {
    if (!policies) return []
    let result = policies
    // Apply state filter first (AND logic)
    if (selectedState !== "all") {
      result = result.filter((p) => p.state === selectedState)
    }
    // Apply field filters
    if (filters.length > 0) {
      result = result.filter((policy) => {
        const filterResults = filters.map((filter) => {
          if (!filter.field || !filter.value) return true
          // Find the value in the policy using GraphNodeName
          // This assumes all values are arrays or strings
          const fieldPath = filter.field.split('.')
          let value: unknown = policy as Policy
          for (const part of fieldPath) {
            if (typeof value === "object" && value !== null && part in value) {
              value = (value as Record<string, unknown>)[part]
            } else {
              value = undefined
              break
            }
          }
          if (Array.isArray(value)) {
            return value.includes(filter.value)
          }
          return value === filter.value
        })
        return operator === "AND"
          ? filterResults.every(Boolean)
          : filterResults.some(Boolean)
      })
    }
    return result
  }, [policies, selectedState, filters, operator])

  // Get all possible values for each GraphNodeName field from policies
  const fieldValues = useMemo(() => {
    if (!filteredPolicies || filteredPolicies.length === 0) return {} as Record<GraphNodeName, string[]>

    const values: Record<GraphNodeName, Set<string>> = {} as Record<GraphNodeName, Set<string>>

    // Initialize all GraphNodeName fields
    Object.values(GraphNodeName).forEach((field) => {
      values[field] = new Set<string>()
    })

    filteredPolicies.forEach((policy) => {
      // User Risk Levels
      policy.conditions.userRiskLevels?.forEach((level: string) => {
        values[GraphNodeName.ConditionsUserRiskLevels].add(level)
      })

      // Sign In Risk Levels
      policy.conditions.signInRiskLevels?.forEach((level: string) => {
        values[GraphNodeName.ConditionsSignInRiskLevels].add(level)
      })

      // Client App Types
      policy.conditions.clientAppTypes?.forEach((type: string) => {
        values[GraphNodeName.ConditionsClientAppTypes].add(type)
      })

      // Service Principal Risk Levels
      policy.conditions.servicePrincipalRiskLevels?.forEach((level: string) => {
        values[GraphNodeName.ConditionsServicePrincipalRiskLevels].add(level)
      })

      // Device Filter
      if (policy.conditions.devices?.deviceFilter) {
        values[GraphNodeName.ConditionsDevicesDeviceFilter].add(policy.conditions.devices.deviceFilter)
      }

      // Applications
      policy.conditions.applications?.includeApplications?.forEach((app: string) => {
        values[GraphNodeName.ConditionsApplicationsIncludeApplications].add(app)
      })
      policy.conditions.applications?.excludeApplications?.forEach((app: string) => {
        values[GraphNodeName.ConditionsApplicationsExcludeApplications].add(app)
      })
      policy.conditions.applications?.includeUserActions?.forEach((action: string) => {
        values[GraphNodeName.ConditionsApplicationsIncludeUserActions].add(action)
      })
      policy.conditions.applications?.includeAuthenticationContextClassReferences?.forEach((ref: string) => {
        values[GraphNodeName.ConditionsApplicationsIncludeAuthenticationContextClassReferences].add(ref)
      })
      if (policy.conditions.applications?.applicationFilter) {
        values[GraphNodeName.ConditionsApplicationsApplicationFilter].add(
          policy.conditions.applications.applicationFilter,
        )
      }

      // Users
      policy.conditions.users?.includeUsers?.forEach((user: string) => {
        values[GraphNodeName.ConditionsUsersIncludeUsers].add(user)
      })
      policy.conditions.users?.excludeUsers?.forEach((user: string) => {
        values[GraphNodeName.ConditionsUsersExcludeUsers].add(user)
      })
      policy.conditions.users?.includeGroups?.forEach((group: string) => {
        values[GraphNodeName.ConditionsUsersIncludeGroups].add(group)
      })
      policy.conditions.users?.excludeGroups?.forEach((group: string) => {
        values[GraphNodeName.ConditionsUsersExcludeGroups].add(group)
      })
      policy.conditions.users?.includeRoles?.forEach((role: string) => {
        values[GraphNodeName.ConditionsUsersIncludeRoles].add(role)
      })
      policy.conditions.users?.excludeRoles?.forEach((role: string) => {
        values[GraphNodeName.ConditionsUsersExcludeRoles].add(role)
      })

      // Guest/External Users
      const includeGuests = policy.conditions.users?.includeGuestsOrExternalUsers
      if (includeGuests?.guestOrExternalUserTypes) {
        if (includeGuests.externalTenants && includeGuests.externalTenants.length > 0) {
          includeGuests.guestOrExternalUserTypes.forEach((guestType: string) => {
            includeGuests.externalTenants!.forEach((tenant: string) => {
              values[GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers].add(
                `${guestType} - ${tenant}`,
              )
            })
          })
        } else {
          includeGuests.guestOrExternalUserTypes.forEach((guestType) => {
            values[GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers].add(guestType)
          })
        }
      }
      const excludeGuests = policy.conditions.users?.excludeGuestsOrExternalUsers
      if (excludeGuests?.guestOrExternalUserTypes) {
        if (excludeGuests.externalTenants && excludeGuests.externalTenants.length > 0) {
          excludeGuests.guestOrExternalUserTypes.forEach((guestType: string) => {
            excludeGuests.externalTenants!.forEach((tenant: string) => {
              values[GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers].add(
                `${guestType} - ${tenant}`,
              )
            })
          })
        } else {
          excludeGuests.guestOrExternalUserTypes.forEach((guestType) => {
            values[GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers].add(guestType)
          })
        }
      }

      // Platforms
      policy.conditions.platforms?.includePlatforms?.forEach((platform: string) => {
        values[GraphNodeName.ConditionsPlatformsIncludePlatforms].add(platform)
      })
      policy.conditions.platforms?.excludePlatforms?.forEach((platform: string) => {
        values[GraphNodeName.ConditionsPlatformsExcludePlatforms].add(platform)
      })

      // Locations
      policy.conditions.locations?.includeLocations?.forEach((location: string) => {
        values[GraphNodeName.ConditionsLocationsIncludeLocations].add(location)
      })
      policy.conditions.locations?.excludeLocations?.forEach((location: string) => {
        values[GraphNodeName.ConditionsLocationsExcludeLocations].add(location)
      })

      // Client Applications
      policy.conditions.clientApplications?.includeServicePrincipals?.forEach((sp: string) => {
        values[GraphNodeName.ConditionsClientApplicationsIncludeServicePrincipals].add(sp)
      })
      policy.conditions.clientApplications?.excludeServicePrincipals?.forEach((sp: string) => {
        values[GraphNodeName.ConditionsClientApplicationsExcludeServicePrincipals].add(sp)
      })
      if (policy.conditions.clientApplications?.servicePrincipalFilter) {
        values[GraphNodeName.ConditionsClientApplicationsServicePrincipalFilter].add(
          policy.conditions.clientApplications.servicePrincipalFilter,
        )
      }

      // Authentication Flows
      policy.conditions.authenticationFlows?.transferMethods?.forEach((method: string) => {
        values[GraphNodeName.ConditionsAuthenticationFlowsTransferMethods].add(method)
      })

      // Grant Controls
      policy.grantControls?.builtInControls?.forEach((control: string) => {
        const op = policy.grantControls?.operator
        if (policy.grantControls?.builtInControls && policy.grantControls.builtInControls.length > 1) {
          values[GraphNodeName.GrantControlsBuiltInControls].add(`(${op}) ${control}`)
        } else {
          values[GraphNodeName.GrantControlsBuiltInControls].add(control)
        }
      })
      policy.grantControls?.customAuthenticationFactors?.forEach((factor: string) => {
        values[GraphNodeName.GrantControlsCustomAuthenticationFactor].add(factor)
      })
      policy.grantControls?.termsOfUse?.forEach((terms: string) => {
        values[GraphNodeName.GrantControlsTermsOfUse].add(terms)
      })

      // Session Controls
      if (policy.sessionControls?.disableResilienceDefaults !== undefined) {
        values[GraphNodeName.SessionControlsDisableResilienceDefaults].add(
          String(policy.sessionControls.disableResilienceDefaults),
        )
      }
      if (policy.sessionControls?.applicationEnforcedRestrictions?.isEnabled !== undefined) {
        values[GraphNodeName.SessionControlsApplicationEnforcedRestrictions].add(
          String(policy.sessionControls.applicationEnforcedRestrictions.isEnabled),
        )
      }
      if (policy.sessionControls?.cloudAppSecurity?.cloudAppSecurityType) {
        values[GraphNodeName.SessionControlsCloudAppSecurity].add(
          policy.sessionControls.cloudAppSecurity.cloudAppSecurityType as string,
        )
      }
      if (policy.sessionControls?.signInFrequency) {
        const sf = policy.sessionControls.signInFrequency
        if (sf.frequencyInterval === "everyTime") {
          values[GraphNodeName.SessionControlsSignInFrequency].add("Every Time")
        } else if (sf.frequencyInterval === "timeBased" && sf.value !== undefined && sf.type) {
          values[GraphNodeName.SessionControlsSignInFrequency].add(`${sf.value} ${sf.type}`)
        }
      }
      if (policy.sessionControls?.persistentBrowser?.mode) {
        values[GraphNodeName.SessionControlsPersistentBrowser].add(policy.sessionControls.persistentBrowser.mode as string)
      }
    })

    // Convert Sets to sorted arrays
    const result: Record<GraphNodeName, string[]> = {} as Record<GraphNodeName, string[]>
    Object.entries(values).forEach(([key, valueSet]) => {
      result[key as GraphNodeName] = Array.from(valueSet).sort()
    })

    return result
  }, [filteredPolicies])

  const addFilter = () => {
    const newFilter: PolicyFilter = {
      id: Date.now().toString(),
      field: "",
      value: "",
    }
    onFiltersChange([...filters, newFilter])
  }

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId))
  }

  const updateFilter = (filterId: string, updates: Partial<PolicyFilter>) => {
    onFiltersChange(filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)))
  }

  const getFieldDisplayName = (field: GraphNodeName) => {
    // Convert GraphNodeName to a more readable format
    return field
      .replace(/^conditions\./, "")
      .replace(/^grantControls\./, "grant.")
      .replace(/^sessionControls\./, "session.")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  React.useEffect(() => {
    if (onFilteredPoliciesChange) {
      onFilteredPoliciesChange(filteredPolicies)
    }
  }, [filteredPolicies, onFilteredPoliciesChange])

  return (
    <div className="space-y-4">
      {/* Policy State Filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Policy State</label>
        <Select
          value={selectedState}
          onValueChange={(value: string) => setSelectedState(value)}
        >
          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value={ConditionalAccessPolicyState.Enabled}>Enabled</SelectItem>
            <SelectItem value={ConditionalAccessPolicyState.Disabled}>Disabled</SelectItem>
            <SelectItem value={ConditionalAccessPolicyState.Report}>Report Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Operator Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Operator</label>
        <Select value={operator} onValueChange={(value: "AND" | "OR") => onOperatorChange(value)}>
          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={addFilter}
        className="w-full justify-start text-sm bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Filter
      </Button>

      {/* Filter List */}
      <div className="space-y-3">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            {/* Field Selection */}
            <Select
              value={filter.field}
              onValueChange={(value: GraphNodeName) => updateFilter(filter.id, { field: value, value: "" })}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GraphNodeName)
                  .filter((field) => fieldValues[field] && fieldValues[field].length > 0)
                  .map((field) => (
                    <SelectItem key={field} value={field}>
                      {getFieldDisplayName(field)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Value Selection */}
            <div className="flex gap-2">
              <Select
                value={filter.value}
                onValueChange={(value: string) => updateFilter(filter.id, { value })}
                disabled={!filter.field}
              >
                <SelectTrigger className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {filter.field &&
                    (fieldValues[filter.field] as string[] | undefined)?.map((value: string) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeFilter(filter.id)}
                className="flex-shrink-0 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
