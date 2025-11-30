import { produce } from "immer";
import _ from "lodash";
import { span } from "./DragSpec";
import { ManipulableSvg, translate } from "./manipulable-svg";

type GridPolyState = {
  w: number;
  h: number;
  points: {
    x: number;
    y: number;
  }[];
};

export const manipulableGridPolySvg: ManipulableSvg<GridPolyState> = ({
  state,
  draggable,
}) => {
  const TILE_SIZE = 50;

  return (
    <g>
      {/* Grid points */}
      {_.range(state.w).map((x) =>
        _.range(state.h).map((y) => (
          <circle cx={x * TILE_SIZE} cy={y * TILE_SIZE} r={5} fill="gray" />
        )),
      )}

      {/* Polygon edges */}
      {state.points.map((pt, idx) => {
        const nextPt = state.points[(idx + 1) % state.points.length];
        return (
          <line
            // {...Vec2(pt).mul(TILE_SIZE).xy1()}
            x1={pt.x * TILE_SIZE}
            y1={pt.y * TILE_SIZE}
            x2={nextPt.x * TILE_SIZE}
            y2={nextPt.y * TILE_SIZE}
            stroke="black"
            strokeWidth={2}
          />
        );
      })}

      {/* Draggable polygon vertices */}
      {state.points.map((pt, idx) =>
        draggable(
          <circle
            transform={translate(pt.x * TILE_SIZE, pt.y * TILE_SIZE)}
            cx={0}
            cy={0}
            r={10}
            fill="black"
          />,
          () => {
            const states = [];
            for (const x of _.range(state.w)) {
              for (const y of _.range(state.h)) {
                if (!state.points.some((p) => p.x === x && p.y === y)) {
                  states.push(
                    produce(state, (draft) => {
                      draft.points[idx] = { x, y };
                    }),
                  );
                }
              }
            }
            return span(states);
          },
        ),
      )}
    </g>
  );
};

export const stateGridPoly1: GridPolyState = {
  w: 6,
  h: 6,
  points: [
    { x: 1, y: 1 },
    { x: 4, y: 2 },
    { x: 3, y: 5 },
    { x: 1, y: 4 },
  ],
};

export const stateGridPolySmol: GridPolyState = {
  w: 2,
  h: 2,
  points: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
};
