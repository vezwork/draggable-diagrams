import { produce } from "immer";
import _ from "lodash";
import { span } from "./DragSpec";
import { ManipulableSvg, translate } from "./manipulable-svg";

type PermState = {
  perm: string[];
};

export const manipulablePermSvg: ManipulableSvg<PermState> = ({
  state,
  drag,
  draggedId,
}) => {
  const TILE_SIZE = 50;

  return (
    <g>
      {state.perm.map((p, idx) => {
        const isDragged = p === draggedId;
        return (
          <g
            id={p}
            transform={translate(idx * TILE_SIZE, isDragged ? -10 : 0)}
            data-z-index={isDragged ? 1 : 0}
            data-on-drag={drag(() => {
              const draggedIdx = state.perm.indexOf(p);
              return span(
                _.range(state.perm.length).map((idx) =>
                  produce(state, (draft) => {
                    draft.perm.splice(draggedIdx, 1);
                    draft.perm.splice(idx, 0, p);
                  }),
                ),
              );
            })}
          >
            <rect
              x={0}
              y={0}
              width={TILE_SIZE}
              height={TILE_SIZE}
              stroke="black"
              strokeWidth={2}
              fill="white"
            />
            <text
              x={TILE_SIZE / 2}
              y={TILE_SIZE / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize={20}
              fill="black"
            >
              {p}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const statePerm1: PermState = {
  perm: ["A", "B", "C", "D", "E"],
};
