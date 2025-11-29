import { straightTo } from "./manipulable";
import { draggable, ManipulableSvg } from "./manipulable-svg";

type State = {
  value: number;
};

export const stateSecondSimplestSvg: State = { value: 0 };

export const manipulableSecondSimplestSvg: ManipulableSvg<State> = (state) => {
  return (
    <g
      transform={`translate(${state.value * 100}, ${20 * (-1) ** state.value + 10})`}
    >
      {draggable(
        <rect
          x={0}
          y={0}
          width={100}
          height={100}
          fill="black"
          data-draggable="switch"
          id="hi"
        />,
        [
          state.value > 0 && straightTo({ value: state.value - 1 }),
          state.value < 3 && straightTo({ value: state.value + 1 }),
        ],
      )}
    </g>
  );
};
