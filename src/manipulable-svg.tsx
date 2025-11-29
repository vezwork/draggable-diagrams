import React from "react";
import { DragSpec } from "./DragSpec";

/**
 * A ManipulableSvg is a function that takes state and returns SVG JSX.
 * Like a React component but without hooks - pure function of state.
 */
export type ManipulableSvg<T extends object> = (state: T) => React.ReactElement;

// Module-level state to communicate between draggable() and the drawer during render
let currentDrawerContext: DrawerContext<any> | null = null;

interface DrawerContext<T extends object> {
  registerDraggable: (key: string, specs: DragSpec<T>[]) => void;
  onHover: (key: string | null) => void;
}

/**
 * Helper function to mark an element as draggable and associate it with drag specs.
 * Registers the element and adds hover handlers.
 */
export function draggable<T extends object>(
  element: React.ReactElement,
  dragSpecs: (DragSpec<T> | false)[],
): React.ReactElement {
  if (!currentDrawerContext) return element;

  // Get unique key for this draggable
  const props = element.props as any;
  const key = props.id || String(Math.random());

  // Filter out false specs
  const filteredSpecs = dragSpecs.filter(Boolean) as DragSpec<T>[];

  // Register with the drawer
  currentDrawerContext.registerDraggable(key, filteredSpecs);

  // Add hover handlers
  return React.cloneElement(element, {
    onMouseEnter: () => currentDrawerContext?.onHover(key),
    onMouseLeave: () => currentDrawerContext?.onHover(null),
    style: { cursor: "pointer", ...props.style },
  } as any);
}

/**
 * Drawer for SVG-based manipulables.
 * Handles rendering and hover previews.
 */
export class ManipulableSvgDrawer<T extends object> {
  private draggableRegistry = new Map<string, DragSpec<T>[]>();

  constructor(
    public manipulableSvg: ManipulableSvg<T>,
    public state: T,
  ) {}

  /**
   * Render the current state to an SVG element.
   * Takes hover state and callbacks from the component.
   */
  render(
    hoveredKey: string | null,
    onHover: (key: string | null) => void,
  ): React.ReactElement {
    // Set up context for draggable() to access
    this.draggableRegistry.clear();
    currentDrawerContext = {
      registerDraggable: (key, specs) => this.draggableRegistry.set(key, specs as DragSpec<T>[]),
      onHover,
    };

    // Render main content
    const content = this.manipulableSvg(this.state);

    // Clear context
    currentDrawerContext = null;

    // Extract accessible states for hovered element
    const overlays: React.ReactNode[] = [];
    if (hoveredKey) {
      const specs = this.draggableRegistry.get(hoveredKey);
      if (specs) {
        specs.forEach((spec, i) => {
          const states = this.extractStatesFromSpec(spec);
          states.forEach((state, j) => {
            overlays.push(
              <g key={`overlay-${i}-${j}`} opacity={0.3}>
                {this.manipulableSvg(state)}
              </g>,
            );
          });
        });
      }
    }

    return (
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        {overlays}
        {content}
      </svg>
    );
  }

  /**
   * Extract states from a DragSpec.
   * Handles different spec types (manifold, params, etc.)
   */
  private extractStatesFromSpec(spec: DragSpec<T>): T[] {
    const specs = Array.isArray(spec) ? spec : [spec];
    const states: T[] = [];

    for (const s of specs) {
      if (s && typeof s === "object" && "type" in s) {
        if (s.type === "manifold") {
          states.push(...s.states);
        }
        // Add other spec types as needed
      }
    }

    return states;
  }
}
