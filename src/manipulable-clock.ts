import { Manipulable } from "./manipulable";
import { group, keyed, Shape, translate } from "./shape";
import { Vec2 } from "./vec2";

type ClockState = {
  hours: number;
};

export const manipulableClock: Manipulable<ClockState> = {
  sourceFile: "manipulable-clock.ts",

  render(state) {
    const center = Vec2(100, 100);

    function hand(
      name: string,
      angle: number,
      length: number,
      lineWidth: number,
    ): Shape {
      const handEnd = Vec2(length, 0).rotate(angle).add(center);
      return group([
        translate(
          handEnd,
          keyed(name, true, {
            type: "circle" as const,
            center: Vec2(0),
            radius: 10,
            fillStyle: "black",
          }),
        ),
        {
          type: "line" as const,
          from: center,
          to: handEnd,
          strokeStyle: "black",
          lineWidth,
        },
      ]);
    }

    return group([
      hand("hour", (state.hours * (2 * Math.PI)) / 12 - Math.PI / 2, 60, 6),
      hand("minute", (state.hours * (2 * Math.PI)) / 1 - Math.PI / 2, 80, 4),
      hand("second", 60 * (state.hours * (2 * Math.PI)) - Math.PI / 2, 90, 2),
    ]);
  },

  accessibleFrom(_state, _draggableKey) {
    return {
      paramPaths: [["hours"]],
    };
  },
};

export const stateClock = {
  hours: 4.333333,
};
