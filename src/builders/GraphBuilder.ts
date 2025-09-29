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
import { extractPolicyFieldValueSets } from "@/utils/PolicyFieldTransforms"

// Main builder function
export function fromPolicyCollection(policies: Policy[], ignoredSubcategories: string[] = []): Graph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

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
    const fieldSets = extractPolicyFieldValueSets(policy)
    for (const [name, set] of fieldSets.entries()) {
      set.forEach((value) => addOrUpdateNode(name, value, policy.code!))
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
