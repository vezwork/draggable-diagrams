import { ManipulableSvg } from "./manipulable-svg";

type State = {
  colorIdx: number;
};

export const stateSimplestClickerSvg: State = { colorIdx: 0 };

export const manipulableSimplestClickerSvg: ManipulableSvg<State> = ({
  state,
  setState,
}) => {
  const colors = ["red", "green", "blue", "yellow"];

  return (
    <rect
      x={40 * state.colorIdx}
      y={0}
      width={100}
      height={100}
      fill={colors[state.colorIdx]}
      onClick={() => {
        const nextIdx = (state.colorIdx + 1) % colors.length;
        setState({ colorIdx: nextIdx });
      }}
      style={{ cursor: "pointer" }}
    />
  );
};
