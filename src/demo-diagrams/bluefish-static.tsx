import { Background, Circle, Ref, StackH, StackV, Text } from "bluefish-js";
import { bluefish } from "../bluefish";
import { Manipulable } from "../manipulable";

export namespace BluefishStatic {
  export type State = {};

  export const state1: State = {};

  export const manipulable: Manipulable<State> = () =>
    bluefish(
      [
        Background(
          { padding: 40, fill: "#859fc9", stroke: "none" },
          StackH({ spacing: 50 }, [
            Circle({
              name: "mercury",
              r: 15,
              fill: "#EBE3CF",
              "stroke-width": 3,
              stroke: "black",
            }),
            Circle({
              r: 36,
              fill: "#DC933C",
              "stroke-width": 3,
              stroke: "black",
            }),
            Circle({
              r: 38,
              fill: "#179DD7",
              "stroke-width": 3,
              stroke: "black",
            }),
            Circle({
              r: 21,
              fill: "#F1CF8E",
              "stroke-width": 3,
              stroke: "black",
            }),
          ])
        ),
        Background(
          { rx: 10 },
          StackV({ spacing: 30 }, [Text("Mercury"), Ref({ select: "mercury" })])
        ),
      ],
      {}
    );
}
