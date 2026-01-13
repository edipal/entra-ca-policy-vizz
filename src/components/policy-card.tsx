"use client"

import type { FC } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Pencil } from "lucide-react"
import { cn } from "@/utils/utils"
import { type Policy, ConditionalAccessPolicyState } from "@/types/Policy"

interface PolicyCardProps {
  policy: Policy
  isSelected?: boolean
  isHighlighted?: boolean
  onToggleSelection?: () => void
  onToggleHighlight?: () => void
  policyColor?: string
  onColorChange?: (color: string) => void // NEW PROP
}

const PolicyCard: FC<PolicyCardProps> = ({
  policy,
  isSelected = false,
  isHighlighted = false,
  onToggleSelection,
  onToggleHighlight,
  policyColor,
  onColorChange, // NEW PROP
}) => {
  const getBadgeClass = (state?: ConditionalAccessPolicyState) => {
    switch (state) {
      case ConditionalAccessPolicyState.Enabled:
        return "bg-green-500 text-white"
      case ConditionalAccessPolicyState.Disabled:
        return "bg-red-600 text-white"
      case ConditionalAccessPolicyState.Report:
        return "bg-yellow-400 text-black"
      default:
        return "bg-gray-300 text-black"
    }
  }

  const getPolicyStateKey = (state?: ConditionalAccessPolicyState) => {
    if (!state) return "Unknown"
    return Object.keys(ConditionalAccessPolicyState).find(
      (k) => ConditionalAccessPolicyState[k as keyof typeof ConditionalAccessPolicyState] === state,
    ) || state
  }

  return (
    <Card
      className={cn(
        "p-2 flex flex-col gap-1 border transition-all duration-200",
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      )}
    >
      <div className="flex justify-between items-center gap-2 min-h-[1.75rem]"> {/* h-7 = 1.75rem */}
        <div className="flex items-center gap-2 h-7">
          {policyColor && onColorChange ? (
            <input
              type="color"
              value={policyColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
              title={`Pick color for policy: ${policy.code}`}
              style={{ background: "none" }}
            />
          ) : policyColor ? (
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: policyColor }}
              title={`Policy color: ${policyColor}`}
            />
          ) : null}
          <Badge
            title={`Policy state: ${getPolicyStateKey(policy.state)}`}
            className={cn(getBadgeClass(policy.state), "h-7 min-w-[90px] flex items-center justify-center px-2 text-sm font-medium rounded")}
          >
            {getPolicyStateKey(policy.state)}
          </Badge>
        </div>
        <div className="flex gap-2 h-7 items-center">
          <Button
            variant="outline"
            size="icon"
            title={isSelected ? "Hide Policy" : "Show Policy"}
            className={cn(
              "h-7 w-7 p-0 bg-white border-gray-300 text-gray-800 hover:bg-gray-50 dark:bg-white dark:border-gray-300 dark:text-gray-800 dark:hover:bg-gray-50",
              isSelected &&
                "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 border-blue-500",
            )}
            onClick={onToggleSelection}
          >
            {isSelected ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="sr-only">{isSelected ? "Hide Policy" : "Show Policy"}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            title={isHighlighted ? "Unhighlight Policy" : "Highlight Policy"}
            className={cn(
              "h-7 w-7 p-0 bg-white border-gray-300 text-gray-800 hover:bg-gray-50 dark:bg-white dark:border-gray-300 dark:text-gray-800 dark:hover:bg-gray-50",
              isHighlighted &&
                "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 border-orange-500",
            )}
            onClick={onToggleHighlight}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{isHighlighted ? "Unhighlight Policy" : "Highlight Policy"}</span>
          </Button>
        </div>
      </div>
      <span className="font-semibold text-gray-900 dark:text-gray-100 block mt-1 ml-0 pl-5">{policy.code || "N/A"}</span>
    </Card>
  )
}

export default PolicyCard
