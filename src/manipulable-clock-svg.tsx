import { numAtPath } from "./manipulable";
import { ManipulableSvg, rotate, translate } from "./manipulable-svg";

type ClockState = {
  hours: number;
};

export const manipulableClockSvg: ManipulableSvg<ClockState> = ({
  state,
  draggable,
}) => {
  function hand(
    name: string,
    degrees: number,
    length: number,
    strokeWidth: number,
  ) {
    return (
      <g id={name} transform={translate(100, 100) + rotate(degrees)}>
        <line
          x1={0}
          y1={0}
          x2={length}
          y2={0}
          stroke="black"
          strokeWidth={strokeWidth}
        />
        {draggable(
          <circle
            transform={translate(length, 0)}
            cx={0}
            cy={0}
            r={10}
            fill="black"
          />,
          numAtPath(["hours"]),
        )}
      </g>
    );
  }

  return (
    <g>
      {hand("hour", (state.hours * 360) / 12 - 90, 60, 6)}
      {hand("minute", (state.hours * 360) / 1 - 90, 80, 4)}
      {hand("second", state.hours * 60 * 360 - 90, 90, 2)}
    </g>
  );
};

export const stateClockSvg: ClockState = {
  hours: 4.333333,
};
