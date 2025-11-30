# Claude Code Workspace Guide

This document provides guidance for working on the draggable-diagrams codebase.

## Project Overview

This project implements interactive, draggable SVG diagrams with sophisticated state interpolation. The core concept is **manifolds** - continuous spaces of valid states that elements can be dragged through. When you drag an element, the system finds nearby valid states and smoothly interpolates between them.

## Architecture

### ManipulableSvg

The main abstraction is `ManipulableSvg<T>` - a function that takes state and returns SVG JSX:

```typescript
export type ManipulableSvg<T extends object> = (props: {
  state: T;
  draggable: (element: SvgElem, dragSpec: DragSpec<T>) => SvgElem;
  drag: (dragSpec: DragSpec<T>) => OnDragPropValue<T>;
  draggedId: string | null;
  setState: SetState<T>;
}) => SvgElem;
```

**Key props:**
- `state` - Current state of the diagram
- `draggable()` - Wraps an element to make it draggable (returns modified JSX)
- `drag()` - Alternative API that returns a value for `data-on-drag` attribute
- `draggedId` - ID of currently dragged element (if any)
- `setState` - Function to programmatically change state with animation

### Drag Specifications

Drag specs define what happens when you drag an element. Common patterns:

```typescript
// Numeric parameters (continuous dragging)
import { numsAtPaths } from "./DragSpec";
draggable(<circle />, numsAtPaths([["x"], ["y"]]))

// Discrete state transitions
import { straightTo, span } from "./DragSpec";
draggable(<rect />, [
  straightTo({ value: 0 }),
  straightTo({ value: 1 }),
])

// Complex manifolds (multiple states forming a continuous space)
draggable(<element />, span([state1, state2, state3, ...]))
```

**Important:** Use `span(states)` not `states.map(straightTo)` - these have different behavior:
- `span(states)` - single manifold from array of states
- `states.map(straightTo)` - array of individual manifolds

### Transform Helpers

Helper functions for SVG transforms (exported from `manipulable-svg.tsx`):

```typescript
translate(100, 100)  // "translate(100,100) "
translate(Vec2(x, y)) // also accepts Vec2able

rotate(45)  // "rotate(45,0,0) " (degrees)
rotate(45, Vec2(100, 100))  // rotate around point

scale(2)  // "scale(2,2) "
scale(2, 0.5)  // "scale(2,0.5) "

points(Vec2(0, 0), Vec2(10, 5), Vec2(20, 10))  // "0,0 10,5 20,10"
```

**Combine with `+`:**
```typescript
transform={translate(100, 100) + rotate(45) + scale(2)}
// Generates: "translate(100,100) rotate(45,0,0) scale(2,2) "
```

### SVG Transform Semantics

**CRITICAL:** SVG transforms apply **right-to-left** (like matrix multiplication):

```typescript
// ✓ CORRECT - scale first, then translate
transform={translate(100, 100) + scale(2, 2)}
// Applies: scale(2,2) to (0,0) → (0,0), then translate → (100,100)
// Circle stays centered at (100, 100) and scales in place

// ✗ WRONG - translate first, then scale
transform={scale(2, 2) + translate(100, 100)}
// Applies: translate(0,0) → (100,100), then scale → (200,200)
// Circle jumps to wrong position!
```

The `localToGlobal` and `globalToLocal` functions in `svg-transform.ts` handle this correctly by iterating in reverse order.

## Key Files

### Core Framework
- `src/manipulable-svg.tsx` - ManipulableSvg type, transform helpers, drag state management
- `src/DragSpec.ts` - Drag specification types (`straightTo`, `span`, `numsAtPaths`, etc.)
- `src/svg-transform.ts` - Transform parsing, interpolation, coordinate conversion
- `src/jsx-lerp.ts` - Interpolation between SVG elements (transforms, colors, points, etc.)
- `src/jsx-flatten.ts` - Flattening SVG trees, accumulating transforms
- `src/vec2.ts` - 2D vector utilities

### Components
- `src/components/DemoSvg.tsx` - Wrapper for ManipulableSvg demos
- `src/demos.tsx` - All demo configurations

### Manipulables
Each `manipulable-*-svg.tsx` file contains a ManipulableSvg implementation. Good examples:
- `manipulable-clock-svg.tsx` - Simple rotating hands with transforms
- `manipulable-graph-svg.tsx` - Complex drag specs with span()
- `manipulable-spinny-svg.tsx` - Using element IDs for stable identity

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- svg-transform.test --run

# Build
npm run build

# Type check
npm run typecheck
```

## Common Patterns

### Creating a Manipulable

```typescript
import { ManipulableSvg, translate, rotate } from "./manipulable-svg";
import { numsAtPaths } from "./DragSpec";

type MyState = {
  x: number;
  y: number;
  angle: number;
};

export const myManipulable: ManipulableSvg<MyState> = ({
  state,
  draggable,
}) => {
  return (
    <g>
      {draggable(
        <rect
          transform={translate(state.x, state.y) + rotate(state.angle)}
          width={50}
          height={50}
          fill="blue"
        />,
        numsAtPaths([["x"], ["y"], ["angle"]]),
      )}
    </g>
  );
};

export const initialState: MyState = { x: 100, y: 100, angle: 0 };
```

### Adding to demos.tsx

```typescript
import { myManipulable, initialState } from "./manipulable-my-svg";

<DemoSvg
  id="my-demo"
  title="My Demo"
  manipulableSvg={myManipulable}
  initialState={initialState}
  height={200}
  padding={20}
/>
```

### Using Element IDs for Stable Identity

When elements need stable identity across state changes (for interpolation):

```typescript
// ✓ Good - uses id for tracking
{items.map((item) =>
  <rect id={`item-${item.id}`} x={item.x} y={item.y} />
)}

// ✗ Bad - uses React key (not supported)
{items.map((item) =>
  <rect key={item.id} x={item.x} y={item.y} />  // Error!
)}
```

**Important:**
- NO React `key` props (framework doesn't use them)
- NO slashes in IDs (use hyphens: `"node-1-2"` not `"node/1/2"`)

### Using data-on-drag

Alternative to `draggable()` - attach drag spec directly as attribute:

```typescript
export const demo: ManipulableSvg<State> = ({ state, drag }) => (
  <rect
    x={state.x}
    data-on-drag={drag(numsAtPaths([["x"]]))}
  />
);
```

This is useful for inline demos in `demos.tsx`.

## Important Gotchas

### 1. Transform Ordering
SVG transforms are right-to-left. Always put `translate()` first in your string:
```typescript
// ✓ Correct
transform={translate(x, y) + rotate(angle)}

// ✗ Wrong
transform={rotate(angle) + translate(x, y)}
```

### 2. No React Keys
The framework uses `id` attributes for element tracking, not React's `key`:
```typescript
// ✓ Correct
<rect id="my-element" />

// ✗ Wrong
<rect key="my-element" />  // Error!
```

### 3. No Slashes in IDs
IDs cannot contain `/` - use hyphens or other separators:
```typescript
// ✓ Correct
<g id="node-1-2" />

// ✗ Wrong
<g id="node/1/2" />  // Error!
```

### 4. Read Before Edit/Write
The Edit and Write tools require reading the file first. Always use Read tool before modifying files.

### 5. TypeScript Type Safety

**NEVER use `any` as a lazy workaround for type errors.** Only use `any` when it is truly called for (e.g., interfacing with untyped external code, or when the type system genuinely cannot express the constraint).

The codebase provides proper types for common patterns:
- `Drag<T>` - the type of the `drag()` function
- `Draggable<T>` - the type of the `draggable()` function
- `ManipulableSvg<T>` - the manipulable function type

```typescript
// ✗ WRONG - lazy use of any
function helper(drag: any) { ... }

// ✓ CORRECT - use proper types
import { Drag } from "./manipulable-svg";
function helper(drag: Drag<MyState>) { ... }

// ✗ WRONG - bypasses type checking
const value = (obj as any).propertyName;

// ✓ CORRECT - use proper type narrowing
const typed = obj as Extract<Transform, { type: "rotate" }>;
const value = typed.propertyName;
```

## Testing

### Transform Tests
Test coordinate transformations with `localToGlobal` and `globalToLocal`:

```typescript
const transforms = parseTransform("translate(100, 0) rotate(90)");
const global = localToGlobal(transforms, { x: 10, y: 0 });
expect(global.x).toBeCloseTo(100);
expect(global.y).toBeCloseTo(10);
```

### Lerp Tests
Test interpolation with `lerpSvgNode`:

```typescript
const a = <rect x={0} fill="red" />;
const b = <rect x={100} fill="blue" />;
const result = lerpSvgNode(a, b, 0.5);
expect(result.props.x).toBe(50);
```

## Debug Features

Enable debug view by clicking the eye icon in the demo UI. This shows:
- Red circles at manifold points
- Red triangles for manifold triangulation
- Blue circles at projection points
- Blue lines from draggable to projection
- Green circles at achieved positions (for `dragging-params` mode)
- Orange dashed lines to pointer objective

## Additional Resources

- `MIGRATION.md` - Guide for porting from old canvas-based API (if needed)
- `src/jsx-lerp.test.tsx` - Examples of SVG interpolation
- `src/svg-transform.test.ts` - Examples of transform operations
- Individual manipulable files - See how different patterns are implemented
