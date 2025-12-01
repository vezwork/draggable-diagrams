import { straightTo } from "./DragSpec";
import { Manipulable, translate } from "./manipulable";

type State = {
  value: number;
};

export const stateSecondSimplest: State = { value: 0 };

export const manipulableSecondSimplest: Manipulable<State> = ({
  state,
  drag,
}) => {
  // TODO: follow list of points?
  // solid path follows?
  const points = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ] as const;
  return (
    <rect
      id="switch"
      // transform={translate(state.value * 100, 20 * (-1) ** state.value + 20)}
      transform={translate(points[state.value])}
      x={0}
      y={0}
      width={100}
      height={100}
      data-on-drag={drag([
        state.value > 0 && straightTo({ value: state.value - 1 }),
        state.value < 3 && straightTo({ value: state.value + 1 }),
      ])}
    />
  );
};
