export type TreeNodeWithoutParents = {
  id: string;
  children: TreeNodeWithoutParents[];
};

export type TreeNode = {
  id: string;
  parentId: string | null;
  children: TreeNode[];
};

export function addParents(
  node: TreeNodeWithoutParents,
  parentId: string | null = null,
): TreeNode {
  return {
    id: node.id,
    parentId: parentId,
    children: node.children.map((child) => addParents(child, node.id)),
  };
}

export type TreeMorph = Record<string, string>;

export function nodesInTree(root: TreeNode): TreeNode[] {
  const nodes: TreeNode[] = [];
  function visit(node: TreeNode) {
    nodes.push(node);
    for (const child of node.children) {
      visit(child);
    }
  }
  visit(root);
  return nodes;
}

// /**
//  * We're descending the codomain tree, drawing bits of the domain
//  * tree in the right places. By the time we get to a codomain node,
//  * we have a bunch of domain nodes that need to be drawn somewhere.
//  */
// export function whatToDrawAtCodomainNode(
//   morph: TreeMorph,
//   domainNodes: TreeNode[],
//   codomainTree: TreeNode,
// ): {
//   domainNodesHere: TreeNode[];
//   domainNodesBelow: TreeNode[];
// } {
//   const domainNodesHere: TreeNode[] = [];
//   const domainNodesBelow: TreeNode[] = [];

// }

// # Example data

// Domain tree (parent with two children)
export const domainTree = addParents({
  id: "d0",
  children: [
    { id: "d1", children: [] },
    { id: "d2", children: [] },
  ],
});

// Codomain tree (3 layers)
export const codomainTree = addParents({
  id: "root",
  children: [
    {
      id: "a",
      children: [
        { id: "a1", children: [] },
        { id: "a2", children: [] },
      ],
    },
    {
      id: "b",
      children: [
        {
          id: "b1",
          children: [],
        },
        { id: "b2", children: [] },
        { id: "b3", children: [] },
      ],
    },
    { id: "c", children: [{ id: "c1", children: [] }] },
  ],
});

export const testMorphs: TreeMorph[] = [
  // Entire domain maps to one codomain node
  { d0: "root", d1: "root", d2: "root" },
  // Domain spread across multiple codomain nodes
  { d0: "root", d1: "a", d2: "b" },
  // Domain spanning parent and leaf
  { d0: "root", d1: "a1", d2: "a1" },
  // Starting lower
  { d0: "a", d1: "a1", d2: "a1" },
];

/**
 * Find all morphisms from domain tree to codomain tree.
 * A morphism is a map that preserves the ancestor-descendant partial order:
 * if x is an ancestor of y in domain, then f(x) must be an ancestor of f(y) in codomain.
 */
export function allMorphs(domain: TreeNode, codomain: TreeNode): TreeMorph[] {
  const domainNodes = nodesInTree(domain);
  const codomainNodes = nodesInTree(codomain);

  // Build ancestor relationships for both trees
  const isAncestorInDomain = buildAncestorMap(domain);
  const isAncestorInCodomain = buildAncestorMap(codomain);

  const results: TreeMorph[] = [];
  const currentMorph: TreeMorph = {};

  function backtrack(nodeIndex: number) {
    if (nodeIndex === domainNodes.length) {
      // We've assigned all domain nodes, save this morphism
      results.push({ ...currentMorph });
      return;
    }

    const domainNode = domainNodes[nodeIndex];

    // Try assigning this domain node to each codomain node
    for (const codomainNode of codomainNodes) {
      // Check if this assignment is valid
      if (isValidAssignment(domainNode, codomainNode)) {
        currentMorph[domainNode.id] = codomainNode.id;
        backtrack(nodeIndex + 1);
        delete currentMorph[domainNode.id];
      }
    }
  }

  function isValidAssignment(domainNode: TreeNode, codomainNode: TreeNode): boolean {
    // Check against all previously assigned nodes
    for (const [assignedDomainId, assignedCodomainId] of Object.entries(currentMorph)) {
      const assignedDomainNode = domainNodes.find(n => n.id === assignedDomainId)!;
      const assignedCodomainNode = codomainNodes.find(n => n.id === assignedCodomainId)!;

      // If assignedDomainNode is an ancestor of domainNode in domain,
      // then assignedCodomainNode must be an ancestor of codomainNode in codomain
      if (isAncestorInDomain(assignedDomainNode, domainNode)) {
        if (!isAncestorInCodomain(assignedCodomainNode, codomainNode)) {
          return false;
        }
      }

      // If domainNode is an ancestor of assignedDomainNode in domain,
      // then codomainNode must be an ancestor of assignedCodomainNode in codomain
      if (isAncestorInDomain(domainNode, assignedDomainNode)) {
        if (!isAncestorInCodomain(codomainNode, assignedCodomainNode)) {
          return false;
        }
      }
    }

    return true;
  }

  backtrack(0);
  return results;
}

/**
 * Build a function that checks if node1 is an ancestor of node2 (or equal to node2)
 */
function buildAncestorMap(root: TreeNode): (ancestor: TreeNode, descendant: TreeNode) => boolean {
  const ancestorMap = new Map<string, Set<string>>();

  function visit(node: TreeNode, ancestors: string[]) {
    // A node is its own ancestor (reflexive)
    const nodeAncestors = new Set([...ancestors, node.id]);
    ancestorMap.set(node.id, nodeAncestors);

    for (const child of node.children) {
      visit(child, [...ancestors, node.id]);
    }
  }

  visit(root, []);

  return (ancestor: TreeNode, descendant: TreeNode) => {
    const ancestors = ancestorMap.get(descendant.id);
    return ancestors ? ancestors.has(ancestor.id) : false;
  };
}
