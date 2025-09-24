"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Header from "@/components/header"
import MainContent from "@/components/main-content"
import Sidebar from "@/components/sidebar"
import { parseCSV, DEFAULT_CSV_DELIMITER } from "@/utils/CSVHelper"
import { fromCSVRow, DEFAULT_COLUMN_MAP, setPolicyBuilderDefaults } from "@/builders/PolicyBuilder"
import { fromPolicyCollection } from "@/builders/GraphBuilder"
import type { Policy } from "@/types/Policy"
import type { Graph } from "@/types/Graph"
import type { PolicyFilter } from "@/components/policy-filters"
import { GraphNodeName, GraphNodeSubcategory } from "@/types/Graph"
import { policyMatchesFilter } from "@/utils/PolicyFieldTransforms"
import ImportConfigModal, { type ImportSettings } from "@/components/import-config-modal"

// Helper uses shared transformation
const checkPolicyMatchesFilter = (policy: Policy, filter: PolicyFilter): boolean => {
  const { field, value } = filter
  if (!field || !value) return true
  return policyMatchesFilter(policy, field as GraphNodeName, value)
}

export default function Home() {
  const [policies, setPolicies] = useState<Policy[] | null>(null)
  const [graph, setGraph] = useState<Graph | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [policyCount, setPolicyCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set())
  const [highlightedPolicy, setHighlightedPolicy] = useState<string | null>(null)
  const [previouslySelectedPolicies, setPreviouslySelectedPolicies] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<PolicyFilter[]>([])
  const [filterOperator, setFilterOperator] = useState<"AND" | "OR">("AND")
  const [policyColorMap, setPolicyColorMap] = useState<Record<string, string>>({}) // NEW STATE
  const [ignoredSubcategories, setIgnoredSubcategories] = useState<GraphNodeSubcategory[]>([])
  // Import flow state
  const [showImportConfig, setShowImportConfig] = useState(false)
  const [pendingCsvText, setPendingCsvText] = useState<string | null>(null)
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    csvDelimiter: DEFAULT_CSV_DELIMITER,
    collectionSplitChar: ",",
    columnMap: DEFAULT_COLUMN_MAP,
  })

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
        setPendingCsvText(csvString)
        setShowImportConfig(true)
      } catch (err) {
        console.error("Error reading CSV:", err)
        setError("Failed to read CSV file. Please try again.")
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setIsLoading(false)
      setError("Failed to read file. Please try again.")
    }

    reader.readAsText(file)
    setFileName(file.name)
  }, [])

  const processImport = useCallback((settings: ImportSettings) => {
    if (!pendingCsvText) return
    try {
      const parsedRows = parseCSV(pendingCsvText, { delimiter: settings.csvDelimiter })
      // Configure defaults once for this import run
      setPolicyBuilderDefaults({
        collectionSplitChar: settings.collectionSplitChar,
        columnMap: settings.columnMap,
      })
      const newPolicies = parsedRows.map((row) => fromCSVRow(row))
      // Sort policies by code
      newPolicies.sort((a, b) => (a.code || "").localeCompare(b.code || ""))
      const newGraph = fromPolicyCollection(newPolicies)

      setPolicies(newPolicies)
      setGraph(newGraph)
      setPolicyCount(newPolicies.length)
    } catch (err) {
      console.error("Error processing CSV:", err)
      setError("Failed to process CSV file. Please ensure it's a valid format.")
    } finally {
      setIsLoading(false)
      setPendingCsvText(null)
    }
  }, [pendingCsvText])

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
      <ImportConfigModal
        visible={showImportConfig}
        initialSettings={importSettings}
        onClose={() => {
          setShowImportConfig(false)
          setIsLoading(false)
          setPendingCsvText(null)
          setFileName(null)
        }}
        onConfirm={(settings) => {
          setImportSettings(settings)
          setShowImportConfig(false)
          processImport(settings)
        }}
      />
    </div>
  )
}
