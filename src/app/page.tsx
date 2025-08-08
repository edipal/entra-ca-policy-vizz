"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Header from "@/components/header"
import MainContent from "@/components/main-content"
import Sidebar from "@/components/sidebar"
import { parseCSV } from "@/utils/CSVHelper"
import { fromCSVRow } from "@/builders/PolicyBuilder"
import { fromPolicyCollection } from "@/builders/GraphBuilder"
import type {
  Policy,
  RiskLevel,
  ClientAppType,
  DevicePlatform,
  BuiltInGrantControl,
  GuestOrExternalUserType,
} from "@/types/Policy"
import type { Graph } from "@/types/Graph"
import type { PolicyFilter } from "@/components/policy-filters"
import { GraphNodeName, GraphNodeSubcategory } from "@/types/Graph"

// Helper function to check if a policy matches a filter - moved outside component
const checkPolicyMatchesFilter = (policy: Policy, filter: PolicyFilter): boolean => {
  const { field, value } = filter

  switch (field) {
    case GraphNodeName.ConditionsUserRiskLevels:
      return policy.conditions.userRiskLevels?.includes(value as RiskLevel) || false
    case GraphNodeName.ConditionsSignInRiskLevels:
      return policy.conditions.signInRiskLevels?.includes(value as RiskLevel) || false
    case GraphNodeName.ConditionsClientAppTypes:
      return policy.conditions.clientAppTypes?.includes(value as ClientAppType) || false
    case GraphNodeName.ConditionsServicePrincipalRiskLevels:
      return policy.conditions.servicePrincipalRiskLevels?.includes(value as RiskLevel) || false
    case GraphNodeName.ConditionsDevicesDeviceFilter:
      return policy.conditions.devices?.deviceFilter === value
    case GraphNodeName.ConditionsApplicationsIncludeApplications:
      return policy.conditions.applications?.includeApplications?.includes(value) || false
    case GraphNodeName.ConditionsApplicationsExcludeApplications:
      return policy.conditions.applications?.excludeApplications?.includes(value) || false
    case GraphNodeName.ConditionsApplicationsIncludeUserActions:
      return policy.conditions.applications?.includeUserActions?.includes(value) || false
    case GraphNodeName.ConditionsApplicationsIncludeAuthenticationContextClassReferences:
      return policy.conditions.applications?.includeAuthenticationContextClassReferences?.includes(value) || false
    case GraphNodeName.ConditionsApplicationsApplicationFilter:
      return policy.conditions.applications?.applicationFilter === value
    case GraphNodeName.ConditionsUsersIncludeUsers:
      return policy.conditions.users?.includeUsers?.includes(value) || false
    case GraphNodeName.ConditionsUsersExcludeUsers:
      return policy.conditions.users?.excludeUsers?.includes(value) || false
    case GraphNodeName.ConditionsUsersIncludeGroups:
      return policy.conditions.users?.includeGroups?.includes(value) || false
    case GraphNodeName.ConditionsUsersExcludeGroups:
      return policy.conditions.users?.excludeGroups?.includes(value) || false
    case GraphNodeName.ConditionsUsersIncludeRoles:
      return policy.conditions.users?.includeRoles?.includes(value) || false
    case GraphNodeName.ConditionsUsersExcludeRoles:
      return policy.conditions.users?.excludeRoles?.includes(value) || false
    case GraphNodeName.ConditionsPlatformsIncludePlatforms:
      return policy.conditions.platforms?.includePlatforms?.includes(value as DevicePlatform) || false
    case GraphNodeName.ConditionsPlatformsExcludePlatforms:
      return policy.conditions.platforms?.excludePlatforms?.includes(value as DevicePlatform) || false
    case GraphNodeName.ConditionsLocationsIncludeLocations:
      return policy.conditions.locations?.includeLocations?.includes(value) || false
    case GraphNodeName.ConditionsLocationsExcludeLocations:
      return policy.conditions.locations?.excludeLocations?.includes(value) || false
    case GraphNodeName.ConditionsClientApplicationsIncludeServicePrincipals:
      return policy.conditions.clientApplications?.includeServicePrincipals?.includes(value) || false
    case GraphNodeName.ConditionsClientApplicationsExcludeServicePrincipals:
      return policy.conditions.clientApplications?.excludeServicePrincipals?.includes(value) || false
    case GraphNodeName.ConditionsClientApplicationsServicePrincipalFilter:
      return policy.conditions.clientApplications?.servicePrincipalFilter === value
    case GraphNodeName.ConditionsAuthenticationFlowsTransferMethods:
      return policy.conditions.authenticationFlows?.transferMethods?.includes(value) || false
    case GraphNodeName.GrantControlsBuiltInControls:
      const op = policy.grantControls?.operator
      if (policy.grantControls?.builtInControls && policy.grantControls.builtInControls.length > 1) {
        return policy.grantControls.builtInControls.some((control) => `(${op}) ${control}` === value)
      } else {
        return policy.grantControls?.builtInControls?.includes(value as BuiltInGrantControl) || false
      }
    case GraphNodeName.GrantControlsCustomAuthenticationFactor:
      return policy.grantControls?.customAuthenticationFactors?.includes(value) || false
    case GraphNodeName.GrantControlsTermsOfUse:
      return policy.grantControls?.termsOfUse?.includes(value) || false
    case GraphNodeName.SessionControlsDisableResilienceDefaults:
      return String(policy.sessionControls?.disableResilienceDefaults) === value
    case GraphNodeName.SessionControlsApplicationEnforcedRestrictions:
      return String(policy.sessionControls?.applicationEnforcedRestrictions?.isEnabled) === value
    case GraphNodeName.SessionControlsCloudAppSecurity:
      return policy.sessionControls?.cloudAppSecurity?.cloudAppSecurityType === value
    case GraphNodeName.SessionControlsSignInFrequency:
      const sf = policy.sessionControls?.signInFrequency
      if (sf?.frequencyInterval === "everyTime") {
        return value === "Every Time"
      } else if (sf?.frequencyInterval === "timeBased" && sf.value !== undefined && sf.type) {
        return value === `${sf.value} ${sf.type}`
      }
      return false
    case GraphNodeName.SessionControlsPersistentBrowser:
      return policy.sessionControls?.persistentBrowser?.mode === value
    case GraphNodeName.ConditionsUsersIncludeGuestsOrExternalUsers:
      const includeGuests = policy.conditions.users?.includeGuestsOrExternalUsers
      if (includeGuests?.guestOrExternalUserTypes) {
        if (includeGuests.externalTenants && includeGuests.externalTenants.length > 0) {
          return includeGuests.guestOrExternalUserTypes.some((guestType) =>
            includeGuests.externalTenants!.some((tenant) => `${guestType} - ${tenant}` === value),
          )
        } else {
          return includeGuests.guestOrExternalUserTypes.includes(value as GuestOrExternalUserType)
        }
      }
      return false
    case GraphNodeName.ConditionsUsersExcludeGuestsOrExternalUsers:
      const excludeGuests = policy.conditions.users?.excludeGuestsOrExternalUsers
      if (excludeGuests?.guestOrExternalUserTypes) {
        if (excludeGuests.externalTenants && excludeGuests.externalTenants.length > 0) {
          return excludeGuests.guestOrExternalUserTypes.some((guestType: GuestOrExternalUserType) =>
            excludeGuests.externalTenants!.some((tenant: string) => `${guestType} - ${tenant}` === value),
          )
        } else {
          return excludeGuests.guestOrExternalUserTypes.includes(value as GuestOrExternalUserType)
        }
      }
      return false
    default:
      return true
  }
}

export default function Home() {
  const [policies, setPolicies] = useState<Policy[] | null>(null)
  const [graph, setGraph] = useState<Graph | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [policyCount, setPolicyCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set()) // Track selected policy codes
  const [highlightedPolicy, setHighlightedPolicy] = useState<string | null>(null) // Track highlighted policy
  const [previouslySelectedPolicies, setPreviouslySelectedPolicies] = useState<Set<string>>(new Set()) // Store previous selection
  const [filters, setFilters] = useState<PolicyFilter[]>([])
  const [filterOperator, setFilterOperator] = useState<"AND" | "OR">("AND")
  const [policyColorMap, setPolicyColorMap] = useState<Record<string, string>>({}) // NEW STATE
  const [ignoredSubcategories, setIgnoredSubcategories] = useState<GraphNodeSubcategory[]>([])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const togglePolicySelection = useCallback((policyCode: string) => {
    setSelectedPolicies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(policyCode)) {
        newSet.delete(policyCode)
      } else {
        newSet.add(policyCode)
      }
      return newSet
    })
  }, [])

  const togglePolicyHighlight = useCallback(
    (policyCode: string) => {
      if (highlightedPolicy === policyCode) {
        // Case 1: Unhighlight the currently highlighted policy
        setHighlightedPolicy(null)
        setSelectedPolicies(previouslySelectedPolicies)
        setPreviouslySelectedPolicies(new Set()) // Clear previous selection after restoring
      } else {
        // Case 2: Highlight a new policy (either from no highlight or switching highlight)
        if (highlightedPolicy === null) {
          // Only store previous selection if we are transitioning from a non-highlighted state
          setPreviouslySelectedPolicies(selectedPolicies)
        }
        setHighlightedPolicy(policyCode)
        setSelectedPolicies(new Set([policyCode]))
      }
    },
    [highlightedPolicy, selectedPolicies, previouslySelectedPolicies],
  )

  // Filter policies based on current filters
  const filteredPolicies = useMemo(() => {
    if (!policies || filters.length === 0) return policies || []

    return policies.filter((policy) => {
      const filterResults = filters.map((filter) => {
        if (!filter.field || !filter.value) return true

        return checkPolicyMatchesFilter(policy, filter)
      })

      return filterOperator === "AND" ? filterResults.every((result) => result) : filterResults.some((result) => result)
    })
  }, [policies, filters, filterOperator])

  // Effect to clear selections when filters change
  useEffect(() => {
    // Clear all selections when filters change
    setSelectedPolicies(new Set())
    // Clear highlight when filters change
    setHighlightedPolicy(null)
    setPreviouslySelectedPolicies(new Set())
  }, [filters, filterOperator])

  const showAllPolicies = useCallback(() => {
    const allCodes = new Set(filteredPolicies.map((p) => p.code).filter(Boolean) as string[])
    setSelectedPolicies(allCodes)
    // Clear highlight when showing all
    setHighlightedPolicy(null)
    setPreviouslySelectedPolicies(new Set())
  }, [filteredPolicies])

  const hideAllPolicies = useCallback(() => {
    setSelectedPolicies(new Set())
    // Clear highlight when hiding all
    setHighlightedPolicy(null)
    setPreviouslySelectedPolicies(new Set())
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setPolicies(null)
    setGraph(null)
    setFileName(null)
    setPolicyCount(null)
    setSelectedPolicies(new Set()) // Reset selections
    setHighlightedPolicy(null) // Reset highlight
    setPreviouslySelectedPolicies(new Set()) // Reset previous selection
    setFilters([]) // Reset filters

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvString = e.target?.result as string
        const parsedRows = parseCSV(csvString)
        const newPolicies = parsedRows.map(fromCSVRow)

        // Sort policies by code
        newPolicies.sort((a, b) => (a.code || "").localeCompare(b.code || ""))
        const newGraph = fromPolicyCollection(newPolicies)

        setPolicies(newPolicies)
        setGraph(newGraph)
        setFileName(file.name)
        setPolicyCount(newPolicies.length)
      } catch (err) {
        console.error("Error processing CSV:", err)
        setError("Failed to process CSV file. Please ensure it's a valid format.")
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setIsLoading(false)
      setError("Failed to read file. Please try again.")
    }

    reader.readAsText(file)
  }, [])

  const handleIgnoredSubcategoriesChange = useCallback((subcats: GraphNodeSubcategory[]) => {
    setIgnoredSubcategories(subcats)
  }, [])

  // Generate filtered graph based on selected policies
  const filteredGraph =
    graph && policies && selectedPolicies.size > 0
      ? (() => {
          const selectedPolicyArray = policies.filter((p) => p.code && selectedPolicies.has(p.code))
          return fromPolicyCollection(selectedPolicyArray, ignoredSubcategories)
        })()
      : null

  // When policies change, initialize color map
  useEffect(() => {
    if (!policies) {
      setPolicyColorMap({})
      return
    }
    const POLICY_COLORS = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#6366f1",
      "#14b8a6",
      "#eab308",
      "#dc2626",
      "#2563eb",
      "#059669",
      "#d97706",
      "#7c3aed",
      "#db2777",
      "#0891b2",
      "#65a30d",
    ]
    const colorMap: Record<string, string> = {}
    policies.forEach((policy, index) => {
      if (policy.code) {
        colorMap[policy.code] = POLICY_COLORS[index % POLICY_COLORS.length]
      }
    })
    setPolicyColorMap(colorMap)
  }, [policies])

  // Handler to update a policy's color
  const handlePolicyColorChange = useCallback((policyCode: string, color: string) => {
    setPolicyColorMap((prev) => ({ ...prev, [policyCode]: color }))
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header fileName={fileName} policyCount={policyCount} toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          policies={policies}
          selectedPolicies={selectedPolicies}
          highlightedPolicy={highlightedPolicy}
          onTogglePolicySelection={togglePolicySelection}
          onTogglePolicyHighlight={togglePolicyHighlight}
          onShowAll={showAllPolicies}
          onHideAll={hideAllPolicies}
          policyColorMap={policyColorMap}
          onPolicyColorChange={handlePolicyColorChange}
          filters={filters}
          filterOperator={filterOperator}
          onFiltersChange={setFilters}
          onFilterOperatorChange={setFilterOperator}
          filteredPolicies={filteredPolicies}
          ignoredSubcategories={ignoredSubcategories}
          onIgnoredSubcategoriesChange={handleIgnoredSubcategoriesChange}
        />
        <MainContent
          onFileUpload={handleFileUpload}
          hasData={!!policies}
          isLoading={isLoading}
          error={error}
          graph={filteredGraph}
          selectedPoliciesCount={selectedPolicies.size}
          policyColorMap={policyColorMap}
          onPolicyHighlight={togglePolicyHighlight}
          highlightedPolicy={highlightedPolicy}
        />
      </div>
    </div>
  )
}
