import { ReactElement } from "react";
import { Demo } from "./Demo";
import { numsAtPaths, straightTo } from "./DragSpec";
import { rotate, scale, translate } from "./manipulable";
import { manipulableAngle, stateAngle } from "./manipulable-angle";
import {
  manipulableAngleViaTransform,
  stateAngleViaTransform,
} from "./manipulable-angle-via-transform";
import { manipulableBraid } from "./manipulable-braid";
import { manipulableClock, stateClock } from "./manipulable-clock";
import { manipulableGraph, stateGraph } from "./manipulable-graph";
import { manipulableGridPoly, stateGridPoly1 } from "./manipulable-grid-poly";
import {
  ConfigPanelNoolTree,
  defaultConfigNool,
  manipulableNoolTree,
  stateNoolTree1,
  stateNoolTree2,
} from "./manipulable-nool-tree";
import {
  manipulableOutline,
  stateOutline1,
  stateOutlineTreeOfLife,
} from "./manipulable-outline";
import { manipulablePerm, statePerm1 } from "./manipulable-perm";
import {
  manipulablePermDouble,
  statePermDouble1,
} from "./manipulable-perm-double";
import {
  manipulableSecondSimplest,
  stateSecondSimplest,
} from "./manipulable-second-simplest";
import {
  manipulableSimplestClicker,
  stateSimplestClicker,
} from "./manipulable-simplest-clicker";
import { manipulableSpinny, stateSpinny1 } from "./manipulable-spinny";
import { manipulableTiles, stateTilesLonely } from "./manipulable-tiles";
import { manipulableTodo, stateTodo1 } from "./manipulable-todo";

export const demos: ReactElement[] = [
  <Demo
    id="second-simplest"
    title="Second simplest"
    manipulable={manipulableSecondSimplest}
    initialState={stateSecondSimplest}
    height={200}
    padding={20}
  />,
  <Demo
    id="second-simplest-on-drag"
    title="Second simplest (as data-on-drag)"
    initialState={{ value: 0 }}
    manipulable={({ state, drag }) => (
      <rect
        id="switch"
        transform={translate(state.value * 100, 20 * (-1) ** state.value + 20)}
        x={0}
        y={0}
        width={100}
        height={100}
        data-on-drag={drag(() => [
          state.value > 0 && straightTo({ value: state.value - 1 }),
          state.value < 3 && straightTo({ value: state.value + 1 }),
        ])}
      />
    )}
    height={200}
    padding={20}
  />,
  <Demo
    id="simplest-clicker"
    title="Simplest clicker"
    manipulable={manipulableSimplestClicker}
    initialState={stateSimplestClicker}
    height={200}
    padding={20}
  />,
  <Demo
    id="todo"
    title="Todo"
    manipulable={manipulableTodo}
    initialState={stateTodo1}
    height={400}
    padding={20}
  />,
  <Demo
    id="lonely-tile-on-a-grid"
    title="Lonely tile on a grid"
    notes="I'm trying to make dragging feel right here. Goal is for the tile to only drag orthogonally, AND to not jump discontinuously. This seems to require 'Relative Pointer Motion' mode (or divergent approaches)."
    manipulable={manipulableTiles}
    initialState={stateTilesLonely}
    height={300}
    padding={20}
    initialRelativePointerMotion={true}
  />,
  <Demo
    id="grid-polygon"
    title="Grid polygon"
    manipulable={manipulableGridPoly}
    initialState={stateGridPoly1}
    height={300}
    padding={20}
  />,
  <Demo
    id="permutation"
    title="Permutation"
    manipulable={manipulablePerm}
    initialState={statePerm1}
    height={100}
    padding={15}
  />,
  <Demo
    id="permutation-of-permutations"
    title="Permutation of permutations"
    manipulable={manipulablePermDouble}
    initialState={statePermDouble1}
    height={200}
  />,
  <Demo
    id="spinny"
    title="Spinny"
    manipulable={manipulableSpinny}
    initialState={stateSpinny1}
    height={200}
    padding={30}
    initialRelativePointerMotion={false}
  />,
  <Demo
    id="nool-tree"
    title="Nool tree"
    manipulable={manipulableNoolTree}
    initialState={stateNoolTree1}
    height={350}
    padding={20}
    initialSnapRadius={1}
    initialRelativePointerMotion={true}
    defaultConfig={defaultConfigNool}
    ConfigPanel={ConfigPanelNoolTree}
  />,
  <Demo
    id="nool-tree-simpler"
    title="Nool tree, simpler"
    manipulable={manipulableNoolTree}
    initialState={stateNoolTree2}
    height={200}
    padding={20}
    initialSnapRadius={1}
    initialRelativePointerMotion={true}
    defaultConfig={defaultConfigNool}
    ConfigPanel={ConfigPanelNoolTree}
  />,
  <Demo
    id="outline"
    title="Outline"
    manipulable={manipulableOutline}
    initialState={stateOutline1}
    height={400}
    padding={20}
    initialSnapRadius={5}
  />,
  <Demo
    id="tree-of-life"
    title="Tree of Life"
    manipulable={manipulableOutline}
    initialState={stateOutlineTreeOfLife}
    height={1100}
    padding={20}
    initialSnapRadius={5}
  />,
  <Demo
    id="graph"
    title="Graph"
    manipulable={manipulableGraph}
    initialState={stateGraph}
    height={200}
    padding={20}
  />,
  <Demo
    id="angle"
    title="Angle"
    manipulable={manipulableAngle}
    initialState={stateAngle}
    height={200}
    padding={20}
  />,
  <Demo
    id="angle-via-transform"
    title="Angle (via transform)"
    manipulable={manipulableAngleViaTransform}
    initialState={stateAngleViaTransform}
    height={200}
    padding={20}
  />,
  <Demo
    id="stretchy-xy"
    title="Stretchy (xy)"
    initialState={{ scaleX: 1, scaleY: 1 }}
    manipulable={({ state: { scaleX, scaleY }, draggable }) => (
      <g>
        {draggable(
          <circle
            transform={translate(100, 100) + scale(scaleX, scaleY)}
            cx={0}
            cy={0}
            r={50}
            fill="lightblue"
          />,
          numsAtPaths([["scaleX"], ["scaleY"]]),
        )}
        <ellipse
          cx={100}
          cy={100}
          rx={50 * Math.abs(scaleX)}
          ry={50 * Math.abs(scaleY)}
          fill="none"
          stroke="black"
          strokeWidth={4}
        />
      </g>
    )}
    height={200}
    padding={20}
  />,
  <Demo
    id="stretchy-rot"
    title="Stretchy (rot)"
    initialState={{ angle: 0, scaleX: 1 }}
    manipulable={({ state: { angle, scaleX }, draggable }) =>
      draggable(
        <circle
          transform={
            translate(100, 100) + rotate(angle) + scale(scaleX, 1 / scaleX)
          }
          cx={0}
          cy={0}
          r={50}
          fill="lightblue"
        />,
        numsAtPaths([["angle"], ["scaleX"]]),
      )
    }
    height={200}
    padding={20}
  />,
  <Demo
    id="clock"
    title="Clock"
    manipulable={manipulableClock}
    initialState={stateClock}
    height={200}
    padding={20}
  />,
  <Demo
    id="braids"
    title="Braids"
    manipulable={manipulableBraid}
    initialState={{ n: 2, seq: [] as const, buds: true }}
    height={200}
    padding={20}
  />,
];
