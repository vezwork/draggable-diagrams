import { produce } from "immer";
import { straightTo } from "./DragSpec";
import { ManipulableSvg, rotate, translate } from "./manipulable-svg";

type PermState = {
  perm: string[];
};

const TILE_SIZE = 50;
const RADIUS = 100;

export const manipulableSpinnySvg: ManipulableSvg<PermState> = ({
  state,
  draggable,
}) => (
  <g transform={translate(100, 100)}>
    <circle
      cx={0}
      cy={0}
      r={RADIUS}
      fill="none"
      stroke="#eee"
      strokeWidth={8}
    />
    {state.perm.map((p) => {
      const angle = (state.perm.indexOf(p) / state.perm.length) * 360 + 180;

      return draggable(
        <g
          id={p}
          transform={rotate(angle) + translate(RADIUS, 0) + rotate(-angle)}
          data-z-index={1}
        >
          <circle
            cx={0}
            cy={0}
            r={TILE_SIZE / 2}
            fill="white"
            stroke="black"
            strokeWidth={2}
          />
          <text
            x={0}
            y={0}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={14}
            fill="black"
          >
            {p}
          </text>
        </g>,
        [
          straightTo(
            produce(state, (s) => {
              s.perm.push(s.perm.shift()!);
            }),
          ),
          straightTo(
            produce(state, (s) => {
              s.perm.unshift(s.perm.pop()!);
            }),
          ),
        ],
      );
    })}
  </g>
);

export const stateSpinny1: PermState = {
  perm: ["A", "B", "C", "D"],
};
