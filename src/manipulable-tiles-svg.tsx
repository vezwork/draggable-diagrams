import _ from "lodash";
import { straightTo } from "./DragSpec";
import { ManipulableSvg, translate } from "./manipulable-svg";
import { Vec2 } from "./vec2";
import { inXYWH } from "./xywh";

type TilesState = {
  w: number;
  h: number;
  tiles: { [key: string]: { x: number; y: number } };
};

export const manipulableTilesSvg: ManipulableSvg<TilesState> = ({
  state,
  draggable,
}) => {
  const TILE_SIZE = 50;
  return (
    <g>
      {_.range(state.w).map((x) =>
        _.range(state.h).map((y) => (
          <rect
            x={x * TILE_SIZE}
            y={y * TILE_SIZE}
            width={TILE_SIZE}
            height={TILE_SIZE}
            stroke="gray"
            strokeWidth={1}
            fill="none"
          />
        )),
      )}
      {Object.entries(state.tiles).map(([key, tile]) =>
        draggable(
          <g transform={translate(tile.x * TILE_SIZE, tile.y * TILE_SIZE)}>
            <rect
              x={0}
              y={0}
              width={TILE_SIZE}
              height={TILE_SIZE}
              fill="#eee"
              stroke="black"
              strokeWidth={2}
            />
            <text
              x={TILE_SIZE / 2}
              y={TILE_SIZE / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize={20}
              fill="black"
            >
              {key}
            </text>
          </g>,
          () =>
            (
              [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ] as const
            ).map((d) => {
              const adjLoc = Vec2(tile).add(d);
              if (!inXYWH(adjLoc, [0, 0, state.w - 1, state.h - 1])) return;
              if (Object.values(state.tiles).some((t) => adjLoc.eq(t))) return;
              return straightTo({
                ...state,
                tiles: { ...state.tiles, [key]: adjLoc.xy() },
              });
            }),
        ),
      )}
    </g>
  );
};

// export const manipulableTiles: Manipulable<TilesState> = {
//   sourceFile: "manipulable-tiles-svg.tsx",

//   render(state) {
//     const TILE_SIZE = 50;
//     return group(
//       _.range(state.w).map((x) =>
//         _.range(state.h).map((y) =>
//           rectangle({
//             xywh: XYWH(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE),
//             strokeStyle: "gray",
//             lineWidth: 1,
//           }),
//         ),
//       ),
//       Object.entries(state.tiles).map(([key, tile]) =>
//         rectangle({
//           xywh: XYWH(0, 0, TILE_SIZE, TILE_SIZE),
//           fillStyle: "#eee",
//           strokeStyle: "black",
//           lineWidth: 2,
//           label: key,
//         })
//           .draggable(key)
//           .translate(Vec2(tile.x * TILE_SIZE, tile.y * TILE_SIZE)),
//       ),
//     );
//   },

//   onDrag(state, draggableKey) {
//     const dragLoc = Vec2(state.tiles[draggableKey]);
//     return (
//       [
//         [-1, 0],
//         [1, 0],
//         [0, -1],
//         [0, 1],
//       ] as const
//     )
//       .map((d) => {
//         const adjLoc = dragLoc.add(d);
//         if (!inXYWH(adjLoc, XYWH(0, 0, state.w - 1, state.h - 1))) return;
//         if (Object.values(state.tiles).some((t) => adjLoc.eq(t))) return;
//         return straightTo({
//           ...state,
//           tiles: { ...state.tiles, [draggableKey]: adjLoc.xy() },
//         });
//       })
//       .filter(defined);
//   },
// };

export const stateTilesLonely: TilesState = {
  w: 5,
  h: 5,
  tiles: {
    A: { x: 2, y: 2 },
    B: { x: 4, y: 4 },
  },
};
