import _ from "lodash";
import { Manipulable } from "./manipulable";
import { drawBgTree } from "./order-preserving";
import { HasseDiagram, TreeNode } from "./trees";

type OrderPreservingState = {
  domainTree: TreeNode;
  codomainTree: TreeNode;
  hasseDiagram: HasseDiagram;
  curMorphIdx: number;
};

export const manipulableOrderPreserving: Manipulable<OrderPreservingState> = {
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
        for (const [domainElem, codomainElem] of Object.entries(curMorph)) {
          if (domainElem === draggableKey) {
            continue;
          }
          if (morph[domainElem] !== codomainElem) {
            return false;
          }
        }
        return true;
      },
    );
    // const adjMorphIdxes = [
    //   ...hasseDiagram.edges
    //     .filter(
    //       ([from, _to, nodeId]) =>
    //         from === curMorphIdx && nodeId === draggableKey,
    //     )
    //     .map(([, to]) => to),
    //   ...hasseDiagram.edges
    //     .filter(
    //       ([_from, to, nodeId]) =>
    //         to === curMorphIdx && nodeId === draggableKey,
    //     )
    //     .map(([from]) => from),
    // ];
    return adjMorphIdxes.map((idx) => ({
      ...state,
      curMorphIdx: idx,
    }));
  },
};
