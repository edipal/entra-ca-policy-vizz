"use client"

import { cn } from "@/utils/utils"
import PolicyCard from "@/components/policy-card"
import PolicyFilters, { type PolicyFilter } from "@/components/policy-filters"
import { Button } from "@/components/ui/button"
import type { Policy } from "@/types/Policy"
import React, { useState } from "react"
import { GraphNodeCategory, GraphNodeSubcategory, CategorySubcategoryMap } from "@/types/Graph"

interface SidebarProps {
  isSidebarOpen: boolean
  policies: Policy[] | null
  selectedPolicies: Set<string>
  highlightedPolicy: string | null
  onTogglePolicySelection: (policyCode: string) => void
  onTogglePolicyHighlight: (policyCode: string) => void
  onShowAll: () => void
  onHideAll: () => void
  policyColorMap: Record<string, string>
  onPolicyColorChange: (policyCode: string, color: string) => void // NEW PROP
  filters: PolicyFilter[]
  filterOperator: "AND" | "OR"
  onFiltersChange: (filters: PolicyFilter[]) => void
  onFilterOperatorChange: (operator: "AND" | "OR") => void
  filteredPolicies: Policy[]
  ignoredSubcategories: GraphNodeSubcategory[]
  onIgnoredSubcategoriesChange: (subcategories: GraphNodeSubcategory[]) => void
}

export default function Sidebar({
  isSidebarOpen,
  policies,
  selectedPolicies,
  highlightedPolicy,
  onTogglePolicySelection,
  onTogglePolicyHighlight,
  onShowAll,
  onHideAll,
  policyColorMap,
  onPolicyColorChange, // NEW PROP
  filters,
  filterOperator,
  onFiltersChange,
  onFilterOperatorChange,
  filteredPolicies: initialFilteredPolicies,
  ignoredSubcategories,
  onIgnoredSubcategoriesChange,
}: SidebarProps) {
  // State for filtered policies
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>(initialFilteredPolicies ?? policies ?? [])
  const filteredPoliciesCount = filteredPolicies.length
  const visiblePoliciesCount = filteredPolicies.filter((policy) => policy.code && selectedPolicies.has(policy.code)).length

  // Handler for toggling subcategory ignore
  function handleToggleSubcategory(subcat: GraphNodeSubcategory) {
    if (ignoredSubcategories.includes(subcat)) {
      onIgnoredSubcategoriesChange(ignoredSubcategories.filter((s) => s !== subcat))
    } else {
      onIgnoredSubcategoriesChange([...ignoredSubcategories, subcat])
    }
  }

  // List of subcategories to show (excluding Default)
  const subcategoriesByCategory = Object.entries(CategorySubcategoryMap).map(([cat, subcats]) => ({
    category: cat as GraphNodeCategory,
    subcategories: subcats.filter((s) => s !== GraphNodeSubcategory.Default),
  }))

  return (
    <aside
      className={cn(
        "border-r bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out flex-shrink-0 h-full max-h-full min-h-0 flex flex-col overflow-hidden",
        isSidebarOpen ? "w-64 p-4" : "w-20 p-2"
      )}
    >
      {isSidebarOpen ? (
        // Expanded sidebar
        <div className="h-full flex flex-col min-h-0 w-full space-y-6">
          {/* Filters Section */}
          <section>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">
              Filters
            </h2>
            <PolicyFilters
              policies={policies}
              filters={filters}
              operator={filterOperator}
              onFiltersChange={onFiltersChange}
              onOperatorChange={onFilterOperatorChange}
              onFilteredPoliciesChange={setFilteredPolicies}
            />
          </section>

          {/* Policies Section */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4 shrink-0">
              Policies ({visiblePoliciesCount}/{filteredPoliciesCount})
            </h2>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  onClick={onShowAll}
                >
                  Show All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  onClick={onHideAll}
                >
                  Hide All
                </Button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {filteredPolicies && filteredPolicies.length > 0 ? (
                  filteredPolicies.map((policy, index) => (
                    <PolicyCard
                      key={policy.id || index}
                      policy={policy}
                      isSelected={policy.code ? selectedPolicies.has(policy.code) : false}
                      isHighlighted={policy.code ? highlightedPolicy === policy.code : false}
                      onToggleSelection={() => policy.code && onTogglePolicySelection(policy.code)}
                      onToggleHighlight={() => policy.code && onTogglePolicyHighlight(policy.code)}
                      policyColor={policy.code ? policyColorMap[policy.code] : undefined}
                      onColorChange={policy.code ? (color) => onPolicyColorChange(policy.code!, color) : undefined} // NEW PROP
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {filters.length > 0 ? "No policies match the current filters." : "No policies loaded."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ignored Subcategories Section at the bottom */}
          <div className="mt-auto pt-4 shrink-0 border-t dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-4">
              Ignored Subcategories
            </h2>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900">
              {subcategoriesByCategory.map(({ category, subcategories }) => (
                <div key={category}>
                  <div className="font-semibold text-sm mt-2 mb-1">{category}</div>
                  {subcategories.map((subcat) => (
                    <label key={subcat} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ignoredSubcategories.includes(subcat)}
                        onChange={() => handleToggleSubcategory(subcat)}
                        className="accent-blue-600"
                      />
                      {subcat}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Collapsed sidebar
        <div className="h-full flex flex-col items-center pt-8 gap-8">
          <div className="flex items-center justify-center h-40">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base transform rotate-90 origin-center whitespace-nowrap">
              Filters
            </h2>
          </div>
          <div className="flex items-center justify-center h-40">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base transform rotate-90 origin-center whitespace-nowrap">
              Policies ({visiblePoliciesCount}/{filteredPoliciesCount})
            </h2>
          </div>
        </div>
      )}
    </aside>
  )
}
