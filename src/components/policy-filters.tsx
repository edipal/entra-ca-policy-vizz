"use client"

import React, { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { GraphNodeName } from "@/types/Graph"
import { ConditionalAccessPolicyState } from "@/types/Policy"
import type { Policy } from "@/types/Policy"
import { aggregateFieldValues, policyMatchesFilter } from "@/utils/PolicyFieldTransforms"

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
          return policyMatchesFilter(policy, filter.field as GraphNodeName, filter.value)
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
    return aggregateFieldValues(filteredPolicies)
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
