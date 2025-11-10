import { Manipulable } from "./manipulable";
import { group, keyed, transform } from "./shape";
import { Vec2 } from "./vec2";
import { XYWH } from "./xywh";

type PermDoubleState = {
  rows: [number, number][][];
};

export const manipulablePermDouble: Manipulable<PermDoubleState> = {
  render(state) {
    // draw grid as rectangles
    const TILE_SIZE = 50;
    const ROW_PADDING = 5;
    return group(
      `grid-poly`,
      state.rows.map((row, rowIdx) =>
        transform(
          Vec2(0, rowIdx * (TILE_SIZE + ROW_PADDING * 2)),
          group(`row-${rowIdx}`, [
            // {
            //   type: "rectangle" as const,
            //   xywh: XYWH(
            //     0,
            //     0,
            //     row.length * TILE_SIZE + ROW_PADDING * 2,
            //     TILE_SIZE + ROW_PADDING * 2,
            //   ),
            //   strokeStyle: "black",
            //   lineWidth: 2,
            // } satisfies Shape,
            ...row.map((p, idx) =>
              transform(
                Vec2(idx * TILE_SIZE + ROW_PADDING, ROW_PADDING),
                keyed(`${p[0]},${p[1]}`, true, {
                  type: "rectangle" as const,
                  xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
                  strokeStyle: "black",
                  lineWidth: 2,
                  label: `${p[0]}, ${p[1]}`,
                }),
              ),
            ),
          ]),
        ),
      ),
    );
  },

  accessibleFrom(state, draggableKey) {
    const [rowStr, colStr] = draggableKey.split(",");
    const rowP = parseInt(rowStr, 10);
    const colP = parseInt(colStr, 10);
    if (isNaN(rowP) || isNaN(colP)) return [];

    const rowIdx = state.rows.findIndex((row) =>
      row.some((p) => p[0] === rowP && p[1] === colP),
    );
    if (rowIdx === -1) return [];

    const row = state.rows[rowIdx];
    const colIdx = row.findIndex((p) => p[0] === rowP && p[1] === colP);
    if (colIdx === -1) return [];

    const nextStates: PermDoubleState[] = [];
    for (let swapIdx = 0; swapIdx < row.length; swapIdx++) {
      if (swapIdx !== colIdx) {
        const newRows = state.rows.map((r) => r.slice());
        // swap colIdx and swapIdx in row rowIdx
        const temp = newRows[rowIdx][colIdx];
        newRows[rowIdx][colIdx] = newRows[rowIdx][swapIdx];
        newRows[rowIdx][swapIdx] = temp;
        nextStates.push({
          rows: newRows,
        });
      }
    }
    for (let otherRowIdx = 0; otherRowIdx < state.rows.length; otherRowIdx++) {
      if (otherRowIdx !== rowIdx) {
        nextStates.push({
          rows: state.rows.map((r, idx) =>
            idx === rowIdx
              ? state.rows[otherRowIdx]
              : idx === otherRowIdx
                ? state.rows[rowIdx]
                : r,
          ),
        });
      }
    }
    return nextStates;

    // const p = parseInt(draggableKey, 10);
    // if (!isNaN(p)) {
    //   const nextStates: PermState[] = [];
    //   const idx = state.perm.indexOf(p);
    //   for (let swapIdx = 0; swapIdx < state.perm.length; swapIdx++) {
    //     if (swapIdx !== idx) {
    //       const newPerm = state.perm.slice();
    //       // swap idx and swapIdx
    //       const temp = newPerm[idx];
    //       newPerm[idx] = newPerm[swapIdx];
    //       newPerm[swapIdx] = temp;
    //       nextStates.push({
    //         perm: newPerm,
    //       });
    //     }
    //   }
    //   return nextStates;
    // } else {
    //   return [];
    // }
    return [];
  },
};
