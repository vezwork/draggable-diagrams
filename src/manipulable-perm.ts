import { Manipulable } from "./manipulable";
import { group, keyed, transform } from "./shape";
import { Vec2 } from "./vec2";
import { XYWH } from "./xywh";

type PermState = {
  perm: number[];
};

export const manipulablePerm: Manipulable<PermState> = {
  render(state) {
    // draw grid as rectangles
    const TILE_SIZE = 50;
    return group(
      `grid-poly`,
      state.perm.map((p, idx) =>
        transform(
          Vec2(idx * TILE_SIZE, 0),
          keyed(`${p}`, true, {
            type: "rectangle" as const,
            xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
            strokeStyle: "black",
            lineWidth: 2,
            label: `${p}`,
          }),
        ),
      ),
    );
  },

  accessibleFrom(state, draggableKey) {
    const p = parseInt(draggableKey, 10);
    if (!isNaN(p)) {
      const nextStates: PermState[] = [];
      const idx = state.perm.indexOf(p);
      for (let swapIdx = 0; swapIdx < state.perm.length; swapIdx++) {
        if (swapIdx !== idx) {
          const newPerm = state.perm.slice();
          // swap idx and swapIdx
          const temp = newPerm[idx];
          newPerm[idx] = newPerm[swapIdx];
          newPerm[swapIdx] = temp;
          nextStates.push({
            perm: newPerm,
          });
        }
      }
      return nextStates;
    } else {
      return [];
    }
  },
};
