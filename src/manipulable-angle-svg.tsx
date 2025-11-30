import { numAtPath } from "./manipulable";
import { ManipulableSvg, translate } from "./manipulable-svg";
import { Vec2 } from "./vec2";

type AngleState = {
  angle: number;
};

export const manipulableAngleSvg: ManipulableSvg<AngleState> = ({
  state,
  draggable,
}) => {
  const center = Vec2(100, 100);
  const radius = 100;
  const knobPos = Vec2(radius, 0).rotate(state.angle).add(center);

  return (
    <g>
      {draggable(
        <circle
          transform={translate(knobPos)}
          cx={0}
          cy={0}
          r={20}
          fill="black"
        />,
        numAtPath(["angle"]),
      )}
      <line
        x1={center.x}
        y1={center.y}
        x2={knobPos.x}
        y2={knobPos.y}
        stroke="black"
        strokeWidth={4}
      />
    </g>
  );
};

export const stateAngle = {
  angle: 0,
};
