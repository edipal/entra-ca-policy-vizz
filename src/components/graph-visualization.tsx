"use client"

import type React from "react"
import type { ToasterToast } from "@/hooks/use-toast"

import type { FC } from "react"
import { useRef, useState, useMemo, useCallback, useEffect } from "react" // Added useCallback and useEffect
import type { Graph } from "@/types/Graph"
import { GraphNodeCategory, GraphNodeSubcategory, CategorySubcategoryMap, GraphNodeName } from "@/types/Graph"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Add onPolicyHighlight prop to the component interface
interface GraphVisualizationProps {
  graph: Graph | null
  policyColorMap: Record<string, string>
  onPolicyHighlight?: (policyCode: string) => void
  highlightedPolicy?: string | null
}

const GraphVisualization: FC<GraphVisualizationProps> = ({
  graph,
  policyColorMap,
  onPolicyHighlight,
  highlightedPolicy,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const { toast } = useToast()

  // Ref to store the active toast instance and the policies of the node that opened it
  // Use the correct type for toastRef (object returned by toast function)
  type ToastController = { id: string; dismiss: () => void; update: (props: ToasterToast) => void }
  const toastRef = useRef<ToastController | null>(null)
  const currentToastNodePolicies = useRef<string[] | null>(null)
  const currentToastNode = useRef<Graph["nodes"][number] | null>(null)

  // Layout constants
  const CATEGORY_WIDTH = 280
  const CATEGORY_SPACING = 120
  const NODE_HEIGHT = 50
  const NODE_SPACING = 8
  const SUBCATEGORY_SPACING = 16
  const CATEGORY_HEADER_HEIGHT = 60

  const { nodePositions, nodesByCategory, edgesWithColors } = useMemo(() => {
    if (!graph) return { nodePositions: {}, nodesByCategory: [], edgesWithColors: [] }

    const positions: Record<string, { x: number; y: number }> = {}

    const nodesByCategory = Object.values(GraphNodeCategory)
      .map((category) => {
        const categoryNodes = graph.nodes.filter((node) => node.category === category)
        const subcategories = CategorySubcategoryMap[category]

        const subcategoryGroups = subcategories
          .map((subcategory) => {
            const subcategoryNodes = categoryNodes.filter((node) => node.subcategory === subcategory)
            return {
              subcategory,
              nodes: subcategoryNodes,
            }
          })
          .filter((group) => group.nodes.length > 0)

        return {
          category,
          subcategoryGroups,
          hasNodes: categoryNodes.length > 0,
        }
      })
      .filter((categoryGroup) => categoryGroup.hasNodes)

    // Calculate positions
    nodesByCategory.forEach(({ subcategoryGroups }, categoryIndex) => {
      const categoryX = categoryIndex * (CATEGORY_WIDTH + CATEGORY_SPACING) + 50
      let currentY = CATEGORY_HEADER_HEIGHT

      subcategoryGroups.forEach(({ subcategory, nodes }) => {
        // Add space for subcategory header if not Default
        if (subcategory !== GraphNodeSubcategory.Default) {
          currentY += 30 // Subcategory header space
        }

        nodes.forEach((node, nodeIndex) => {
          const nodeKey = `${node.name}-${node.value}-${graph.nodes.indexOf(node)}`
          positions[nodeKey] = {
            x: categoryX,
            y: currentY + nodeIndex * (NODE_HEIGHT + NODE_SPACING),
          }
        })

        currentY += nodes.length * (NODE_HEIGHT + NODE_SPACING) + SUBCATEGORY_SPACING
      })
    })

    // Create edges with colors based on shared policies
    const edgesWithColors = graph.edges.map((edge, index) => {
      // Find common policies between the two nodes
      const node1Policies = edge.node1.policies || []
      const node2Policies = edge.node2.policies || []
      const commonPolicies = node1Policies.filter((policy) => node2Policies.includes(policy))

      // Use the first common policy's color from the policy color map
      const policyForColor = commonPolicies[0] || node1Policies[0] || node2Policies[0]
      const color = policyForColor ? policyColorMap[policyForColor] : "#dc2626"

      return {
        ...edge,
        color,
        policies: commonPolicies,
        id: `edge-${index}`,
      }
    })

    return { nodePositions: positions, nodesByCategory, edgesWithColors }
  }, [graph, policyColorMap])

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.3, Math.min(3, prev * zoomFactor)))
  }

  // Memoized function to render the toast description
  const renderToastDescription = useCallback(
    (policies: string[]) => (
      <div className="mt-2">
        <p className="text-sm font-medium mb-2">Associated Policies:</p>
        <div className="flex flex-wrap gap-1">
          {policies.map((policyCode: string) => (
            <button
              key={policyCode}
              onClick={() => {
                if (onPolicyHighlight) {
                  onPolicyHighlight(policyCode)
                }
                // Do NOT dismiss the toast here
              }}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                policyCode === highlightedPolicy
                  ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800 border border-orange-300 dark:border-orange-700"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              }`}
              title={`Click to ${policyCode === highlightedPolicy ? "unhighlight" : "highlight"} ${policyCode}`}
            >
              <div
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: policyColorMap[policyCode] || "#dc2626" }}
              />
              {policyCode}
              {policyCode === highlightedPolicy && <span className="ml-1 text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>
    ),
    [onPolicyHighlight, policyColorMap, highlightedPolicy], // Dependencies for renderToastDescription
  )

  // Effect to update the toast's content when highlightedPolicy changes
  useEffect(() => {
    if (toastRef.current && currentToastNodePolicies.current) {
      const node = currentToastNode.current;
      toastRef.current.update({
        ...toastRef.current,
        title: node ? `Node: ${getGraphNodeNameKey(node.name)}` : undefined,
        description: (
          <>
            {node && <div>Value: {node.value}</div>}
            {renderToastDescription(currentToastNodePolicies.current)}
          </>
        ),
      });
    }
  }, [highlightedPolicy, renderToastDescription]); // Remove graph from deps, always use ref

  const getGraphNodeNameKey = (value: GraphNodeName) => {
    return Object.keys(GraphNodeName).find(
      (key) => GraphNodeName[key as keyof typeof GraphNodeName] === value
    ) || value;
  };

  const handleNodeDoubleClick = (node: Graph["nodes"][number]) => {
    if (node.policies && node.policies.length > 0) {
      // If a toast is already open, dismiss it first to ensure a fresh render
      if (toastRef.current) {
        toastRef.current.dismiss()
        toastRef.current = null
        currentToastNodePolicies.current = null
        currentToastNode.current = null
      }

      const newToast = toast({
        title: `Node: ${getGraphNodeNameKey(node.name)}`,
        description: (
          <>
            <div>Value: {node.value}</div>
            {renderToastDescription(node.policies)}
          </>
        ),
        duration: Infinity, // Keep the toast open until manually closed
        onOpenChange: (open) => {
          if (!open) {
            toastRef.current = null
            currentToastNodePolicies.current = null
            currentToastNode.current = null
          }
        },
      })
      // Store the new toast instance and its policies
      toastRef.current = newToast
      currentToastNodePolicies.current = node.policies
      currentToastNode.current = node
    }
  }

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">No graph data available</p>
      </div>
    )
  }

  return (
    <div className="h-full relative bg-gray-50 dark:bg-gray-900">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-1">
        <Button size="sm" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${-pan.x} ${-pan.y} ${1400 / zoom} ${900 / zoom}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Category Headers */}
        {nodesByCategory.map(({ category }, index) => (
          <g key={category}>
            <rect
              x={index * (CATEGORY_WIDTH + CATEGORY_SPACING) + 50}
              y={10}
              width={CATEGORY_WIDTH}
              height={40}
              fill="#dbeafe"
              stroke="#3b82f6"
              strokeWidth="1"
              rx="8"
              className="dark:fill-blue-900/30 dark:stroke-blue-800"
            />
            <text
              x={index * (CATEGORY_WIDTH + CATEGORY_SPACING) + 50 + CATEGORY_WIDTH / 2}
              y={35}
              textAnchor="middle"
              className="text-sm font-semibold fill-blue-900 dark:fill-blue-100"
            >
              {category.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Subcategory Headers */}
        {nodesByCategory.map(({ category, subcategoryGroups }, categoryIndex) => {
          let currentY = CATEGORY_HEADER_HEIGHT
          return subcategoryGroups.map(({ subcategory, nodes }) => {
            if (subcategory === GraphNodeSubcategory.Default) {
              currentY += nodes.length * (NODE_HEIGHT + NODE_SPACING) + SUBCATEGORY_SPACING
              return null
            }

            const headerY = currentY
            currentY += 30 + nodes.length * (NODE_HEIGHT + NODE_SPACING) + SUBCATEGORY_SPACING

            return (
              <text
                key={`${category}-${subcategory}`}
                x={categoryIndex * (CATEGORY_WIDTH + CATEGORY_SPACING) + 60}
                y={headerY + 20}
                className="text-xs font-medium fill-gray-600 dark:fill-gray-400"
              >
                {subcategory.toUpperCase()}
              </text>
            )
          })
        })}

        {/* Edges with Policy Colors */}
        {edgesWithColors.map((edge) => {
          const sourceKey = `${edge.node1.name}-${edge.node1.value}-${graph.nodes.indexOf(edge.node1)}`
          const targetKey = `${edge.node2.name}-${edge.node2.value}-${graph.nodes.indexOf(edge.node2)}`

          const sourcePos = nodePositions[sourceKey]
          const targetPos = nodePositions[targetKey]

          if (!sourcePos || !targetPos) return null

          return (
            <line
              key={edge.id}
              x1={sourcePos.x + CATEGORY_WIDTH}
              y1={sourcePos.y + NODE_HEIGHT / 2}
              x2={targetPos.x}
              y2={targetPos.y + NODE_HEIGHT / 2}
              stroke={edge.color}
              strokeWidth="1.5"
              opacity="0.8"
              className="transition-opacity duration-200 hover:opacity-100"
            >
              <title>{edge.policies.join(", ")}</title>
            </line>
          )
        })}

        {/* Nodes */}
        {graph.nodes.map((node, nodeIndex) => {
          const nodeKey = `${node.name}-${node.value}-${nodeIndex}`
          const position = nodePositions[nodeKey]
          if (!position) return null

          return (
            <g key={nodeKey}>
              <rect
                x={position.x}
                y={position.y}
                width={CATEGORY_WIDTH}
                height={NODE_HEIGHT}
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="1"
                rx="6"
                className="cursor-pointer transition-all duration-200 hover:stroke-blue-500 hover:shadow-lg dark:fill-gray-800 dark:stroke-gray-700 dark:hover:stroke-blue-600"
                onDoubleClick={() => handleNodeDoubleClick(node)}
              >
                <title>{node.value}</title>
              </rect>
              <text
                x={position.x + 12}
                y={position.y + 18}
                className="text-sm font-medium fill-gray-900 dark:fill-gray-100 pointer-events-none"
              >
                <title>{node.value}</title>
                {node.value.length > 35 ? `${node.value.substring(0, 35)}...` : node.value}
              </text>
              {node.policies && node.policies.length > 0 && (
                <text
                  x={position.x + 12}
                  y={position.y + 35}
                  className="text-xs fill-blue-600 dark:fill-blue-400 pointer-events-none"
                >
                  {node.policies.length} {node.policies.length === 1 ? "policy" : "policies"}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default GraphVisualization
