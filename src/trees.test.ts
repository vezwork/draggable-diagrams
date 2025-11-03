import { expect, it, describe } from "vitest";
import { addParents, allMorphs, domainTree, codomainTree, testMorphs } from "./trees";

describe("allMorphs", () => {
  it("works on Elliot's example", () => {
    const tree = addParents({
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [] },
      ],
    });
    const morphs = allMorphs(tree, tree);
    expect(morphs).toHaveLength(11);
  });

  it("single node to single node has exactly one morphism", () => {
    const singleNode = addParents({ id: "x", children: [] });
    const morphs = allMorphs(singleNode, singleNode);
    expect(morphs).toHaveLength(1);
    expect(morphs[0]).toEqual({ x: "x" });
  });

  it("single node to larger tree has morphisms to each node", () => {
    const singleNode = addParents({ id: "x", children: [] });
    const threeNodeTree = addParents({
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [] },
      ],
    });
    const morphs = allMorphs(singleNode, threeNodeTree);
    expect(morphs).toHaveLength(3); // Can map to root, a, or b
    expect(morphs).toContainEqual({ x: "root" });
    expect(morphs).toContainEqual({ x: "a" });
    expect(morphs).toContainEqual({ x: "b" });
  });

  it("two-node chain has correct morphisms", () => {
    const chain = addParents({
      id: "p",
      children: [{ id: "c", children: [] }],
    });
    const morphs = allMorphs(chain, chain);
    // Valid morphisms: both to p, both to c, or p->p and c->c
    expect(morphs).toHaveLength(3);
    expect(morphs).toContainEqual({ p: "p", c: "p" }); // All to root
    expect(morphs).toContainEqual({ p: "p", c: "c" }); // Identity
    expect(morphs).toContainEqual({ p: "c", c: "c" }); // All to leaf
  });

  it("verifies testMorphs are all valid", () => {
    const allValidMorphs = allMorphs(domainTree, codomainTree);

    for (const testMorph of testMorphs) {
      const isValid = allValidMorphs.some(m =>
        JSON.stringify(m) === JSON.stringify(testMorph)
      );
      expect(isValid).toBe(true);
    }
  });

  it("three-node chain to two-node chain has valid morphisms", () => {
    const largeChain = addParents({
      id: "a",
      children: [{
        id: "b",
        children: [{ id: "c", children: [] }],
      }],
    });
    const smallerTree = addParents({
      id: "x",
      children: [{ id: "y", children: [] }],
    });
    const morphs = allMorphs(largeChain, smallerTree);
    // Possible mappings: all to x, all to y, a->x with b,c->y, or a,b->x with c->y
    expect(morphs).toHaveLength(4);
    expect(morphs).toContainEqual({ a: "x", b: "x", c: "x" });
    expect(morphs).toContainEqual({ a: "y", b: "y", c: "y" });
    expect(morphs).toContainEqual({ a: "x", b: "y", c: "y" });
    expect(morphs).toContainEqual({ a: "x", b: "x", c: "y" });
  });

  it("no morphisms when incompatible structure (two incomparable elements to chain)", () => {
    // Two sibling nodes cannot both map to a strict chain since they're incomparable
    const siblings = addParents({
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [] },
      ],
    });
    const singleLeaf = addParents({ id: "x", children: [] });

    // There ARE morphisms - both siblings can map to the single node
    const morphs = allMorphs(siblings, singleLeaf);
    expect(morphs).toHaveLength(1);
    expect(morphs[0]).toEqual({ root: "x", a: "x", b: "x" });
  });

  it("counts morphisms for symmetric case", () => {
    // Two children, both with two children
    const symmetricTree = addParents({
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
            { id: "b1", children: [] },
            { id: "b2", children: [] },
          ],
        },
      ],
    });
    const morphs = allMorphs(symmetricTree, symmetricTree);
    // Should have identity plus many other valid morphisms
    expect(morphs.length).toBeGreaterThan(1);

    // Verify identity is included
    const identity = {
      root: "root",
      a: "a",
      a1: "a1",
      a2: "a2",
      b: "b",
      b1: "b1",
      b2: "b2",
    };
    expect(morphs).toContainEqual(identity);
  });
});
