import _ from "lodash";
import { Manipulable } from "./manipulable";
import { group, keyed, transform } from "./shape";
import { Vec2 } from "./vec2";
import { XYWH } from "./xywh";

type TilesState = {
  w: number;
  h: number;
  tiles: {
    key: string;
    x: number;
    y: number;
  }[];
};

export const manipulableTiles: Manipulable<TilesState> = {
  render(state) {
    // draw grid as rectangles
    const TILE_SIZE = 50;
    return group(`tiles`, [
      ..._.range(state.w).flatMap((x) =>
        _.range(state.h).flatMap((y) => ({
          type: "rectangle" as const,
          xywh: XYWH(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
          strokeStyle: "gray",
          lineWidth: 1,
        })),
      ),
      ...state.tiles.map((tile) =>
        transform(
          Vec2(tile.x * TILE_SIZE, tile.y * TILE_SIZE),
          keyed(`${tile.key}`, true, {
            type: "rectangle" as const,
            xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
            fillStyle: "#eee",
            strokeStyle: "black",
            lineWidth: 2,
            label: tile.key,
          }),
        ),
      ),
    ]);
  },

  accessibleFrom(state, draggableKey) {
    const curLoc = state.tiles.find((t) => t.key === draggableKey)!;
    const nextStates: TilesState[] = [];
    nextStates.push(state); // can stay in place
    const deltas = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];
    for (const { dx, dy } of deltas) {
      const x = curLoc.x + dx;
      const y = curLoc.y + dy;
      // check bounds
      if (x < 0 || x >= state.w || y < 0 || y >= state.h) {
        continue;
      }
      // check collision
      if (state.tiles.some((t) => t.x === x && t.y === y)) {
        continue;
      }
      nextStates.push({
        ...state,
        tiles: state.tiles.map((t) =>
          t.key === draggableKey ? { ...t, x, y } : t,
        ),
      });
    }
    return nextStates;
  },
};
