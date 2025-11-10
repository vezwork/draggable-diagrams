import { Manipulable } from "./manipulable";
import { drawBgTree } from "./order-preserving";

type RushHourState = {
  w: number;
  h: number;
  cars: {
    x: number;
    y: number;
    w: number;
    h: number;
    motion: "x" | "y";
  }[];
};

export const manipulableOrderPreserving: Manipulable<RushHourState> = {
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
    const adjMorphIdxes = [
      ...hasseDiagram.edges
        .filter(
          ([from, _to, nodeId]) =>
            from === curMorphIdx && nodeId === draggableKey,
        )
        .map(([, to]) => to),
      ...hasseDiagram.edges
        .filter(
          ([_from, to, nodeId]) =>
            to === curMorphIdx && nodeId === draggableKey,
        )
        .map(([from]) => from),
    ];
    return adjMorphIdxes.map((idx) => ({
      ...state,
      curMorphIdx: idx,
    }));
  },
};
