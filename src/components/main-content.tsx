"use client"
import type { FC } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import type { Graph } from "@/types/Graph"
import NoDataCard from "@/components/no-data-card"
import GraphVisualization from "@/components/graph-visualization"

interface MainContentProps {
  onFileUpload: (file: File) => void
  hasData: boolean
  isLoading: boolean
  error: string | null
  graph: Graph | null
  selectedPoliciesCount: number
  policyColorMap: Record<string, string>
  onPolicyHighlight?: (policyCode: string) => void
  highlightedPolicy?: string | null
}

const MainContent: FC<MainContentProps> = ({
  onFileUpload,
  hasData,
  isLoading,
  error,
  graph,
  selectedPoliciesCount,
  policyColorMap,
  onPolicyHighlight,
  highlightedPolicy,
}) => {
  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading and processing data...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {}}>
              <Upload className="mr-2 h-4 w-4" />
              Try Uploading Again
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (hasData) {
    if (selectedPoliciesCount === 0) {
      return (
        <main className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">No Policies Selected</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select policies from the sidebar to visualize them in the graph.
            </p>
          </div>
        </main>
      )
    }

    return (
      <main className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-auto">
        <GraphVisualization
          graph={graph}
          policyColorMap={policyColorMap}
          onPolicyHighlight={onPolicyHighlight}
          highlightedPolicy={highlightedPolicy}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <NoDataCard onFileUpload={onFileUpload} />
    </main>
  )
}

export default MainContent
