import _ from "lodash";
import { Manipulable } from "./manipulable";
import { group, keyed, Shape, transform } from "./shape";
import { Vec2 } from "./vec2";

type GridPolyState = {
  w: number;
  h: number;
  points: {
    x: number;
    y: number;
  }[];
};

export const manipulableGridPoly: Manipulable<GridPolyState> = {
  render(state) {
    // draw grid as rectangles
    const TILE_SIZE = 50;
    return group(`grid-poly`, [
      ..._.range(state.w).flatMap((x) =>
        _.range(state.h).flatMap(
          (y) =>
            ({
              type: "circle" as const,
              center: Vec2(x * TILE_SIZE, y * TILE_SIZE),
              radius: 5,
              fillStyle: "gray",
            }) satisfies Shape,
        ),
      ),
      ...state.points.map((pt, idx) =>
        transform(
          Vec2(pt.x * TILE_SIZE, pt.y * TILE_SIZE),
          keyed(`${idx}`, true, {
            type: "circle" as const,
            center: Vec2(0),
            radius: 10,
            fillStyle: "black",
          }),
        ),
      ),
      ...state.points.map((pt, idx) =>
        keyed(`line-${idx}`, false, {
          type: "line" as const,
          from: Vec2(pt.x * TILE_SIZE, pt.y * TILE_SIZE),
          to: Vec2(
            state.points[(idx + 1) % state.points.length].x * TILE_SIZE,
            state.points[(idx + 1) % state.points.length].y * TILE_SIZE,
          ),
          strokeStyle: "black",
          lineWidth: 2,
        }),
      ),
    ]);
  },

  accessibleFrom(state, draggableKey) {
    const idx = parseInt(draggableKey, 10);
    if (!isNaN(idx)) {
      const availablePositions = _.range(state.w)
        .flatMap((x) => _.range(state.h).map((y) => ({ x, y })))
        .filter(
          (pos) => !state.points.some((pt) => pt.x === pos.x && pt.y === pos.y),
        );
      return availablePositions.map((newPos) => ({
        ...state,
        points: state.points.map((pt, i) =>
          i === idx ? { x: newPos.x, y: newPos.y } : pt,
        ),
      }));
    } else {
      return [];
    }
  },
};
