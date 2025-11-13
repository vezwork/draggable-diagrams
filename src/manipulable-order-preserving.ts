import _ from "lodash";
import { Manipulable } from "./manipulable";
import { drawBgTree } from "./order-preserving";
import {
  buildHasseDiagram,
  HasseDiagram,
  tree3,
  tree7,
  TreeNode,
} from "./trees";

type OrderPreservingState = {
  domainTree: TreeNode;
  codomainTree: TreeNode;
  hasseDiagram: HasseDiagram;
  curMorphIdx: number;
};

export const manipulableOrderPreserving: Manipulable<OrderPreservingState> = {
  sourceFile: "manipulable-order-preserving.ts",
  render(state) {
    const r = drawBgTree(
      state.codomainTree,
      state.domainTree,
      state.hasseDiagram.nodes[state.curMorphIdx],
    );
    return r.shape;
  },

  accessibleFrom(state, draggableKey) {
    const { hasseDiagram, curMorphIdx } = state;
    const curMorph = hasseDiagram.nodes[curMorphIdx];
    const adjMorphIdxes = _.range(hasseDiagram.nodes.length).filter(
      (nodeIdx) => {
        const morph = hasseDiagram.nodes[nodeIdx];
        // all the mappings in morph must agree with those in the current morph,
        // except for the one with id draggableKey
        return Object.entries(morph).every(
          ([domainElem, codomainElem]) =>
            domainElem === draggableKey ||
            curMorph[domainElem] === codomainElem,
        );
      },
    );
    return adjMorphIdxes.map((idx) => ({
      ...state,
      curMorphIdx: idx,
    }));
  },
};

export const stateOrderPreserving1: OrderPreservingState = {
  domainTree: tree3,
  codomainTree: tree3,
  hasseDiagram: buildHasseDiagram(tree3, tree3),
  curMorphIdx: 0,
};

export const stateOrderPreserving2: OrderPreservingState = {
  domainTree: tree7,
  codomainTree: tree7,
  hasseDiagram: buildHasseDiagram(tree7, tree7),
  curMorphIdx: 0,
};
