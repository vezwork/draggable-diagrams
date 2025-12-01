import { produce } from "immer";
import _ from "lodash";
import { span } from "./DragSpec";
import { Manipulable, translate } from "./manipulable";

type State = {
  n: number;
  seq: [number, number][];
  buds: boolean;
};

export const manipulableBraid: Manipulable<State> = ({
  state,
  draggable,
  draggedId,
}) => {
  const TILE_SIZE = 50;

  let perm = _.range(state.n);
  return (
    <g>
      <g>
        {_.range(state.n).map((i) => (
          <line
            x1={i * TILE_SIZE}
            y1={0}
            x2={i * TILE_SIZE}
            y2={TILE_SIZE}
            stroke="black"
          />
        ))}
      </g>
      {state.seq.map(([i, j], idx) => {
        perm = perm.slice();
        [perm[i], perm[j]] = [perm[j], perm[i]];
        return (
          <g transform={translate(0, (idx + 1) * TILE_SIZE)}>
            {/* swap lines */}
            <line
              id={`line-${perm[i]}-${idx}`}
              x1={j * TILE_SIZE}
              y1={0}
              x2={i * TILE_SIZE}
              y2={TILE_SIZE}
              stroke="black"
              data-z-index={-1}
            />
            <line
              id={`line-bkgrnd-${perm[i]}-${idx}`}
              x1={i * TILE_SIZE}
              y1={0}
              x2={j * TILE_SIZE}
              y2={TILE_SIZE}
              stroke="white"
              strokeWidth={20}
            />
            <line
              id={`line-${perm[j]}-${idx}`}
              x1={i * TILE_SIZE}
              y1={0}
              x2={j * TILE_SIZE}
              y2={TILE_SIZE}
              stroke="black"
              data-z-index={1}
            />
            {/* the rest */}
            {_.range(state.n).map((k) =>
              k !== i && k !== j ? (
                <line
                  id={`line-${perm[k]}-${idx}`}
                  x1={k * TILE_SIZE}
                  y1={0}
                  x2={k * TILE_SIZE}
                  y2={TILE_SIZE}
                  stroke="black"
                />
              ) : null,
            )}
          </g>
        );
      })}
      {state.buds && (
        <g transform={translate(0, (state.seq.length + 1) * TILE_SIZE)}>
          {perm.map((p, i) => (
            <line
              id={`line-${p}-${state.seq.length}`}
              x1={i * TILE_SIZE}
              y1={0}
              x2={i * TILE_SIZE}
              y2={0}
              stroke="black"
            />
          ))}
        </g>
      )}
      {perm.map((p, i) =>
        draggable(
          <circle
            id={`strand-end-${p}`}
            transform={translate(
              i * TILE_SIZE,
              (state.seq.length + 1) * TILE_SIZE,
            )}
            cx={0}
            cy={0}
            r={4}
            fill="black"
            data-z-index={1}
          >
            <title>{p}</title>
          </circle>,
          () => {
            const states = [];
            if (i > 0) {
              states.push(
                produce(state, (s) => {
                  s.seq.push([perm[i], perm[i - 1]]);
                  s.buds = false;
                }),
              );
            }
            if (i < state.n - 1) {
              states.push(
                produce(state, (s) => {
                  s.seq.push([perm[i], perm[i + 1]]);
                  s.buds = false;
                }),
              );
            }
            return span(states);
          },
        ),
      )}
    </g>
  );
};
