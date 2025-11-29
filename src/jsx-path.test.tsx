import { describe, expect, it } from "vitest";
import { assignPaths } from "./jsx-path";

describe("assignPaths", () => {
  it("assigns numerical paths to nested elements", () => {
    const tree = (
      <g>
        <rect />
        <circle />
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        data-path="/"
      >
        <rect
          data-path="/0/"
        />
        <circle
          data-path="/1/"
        />
      </g>
    `);
  });

  it("handles deeply nested elements", () => {
    const tree = (
      <g>
        <g>
          <rect />
          <circle />
        </g>
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        data-path="/"
      >
        <g
          data-path="/0/"
        >
          <rect
            data-path="/0/0/"
          />
          <circle
            data-path="/0/1/"
          />
        </g>
      </g>
    `);
  });

  it("uses id when present", () => {
    const tree = (
      <g>
        <rect id="my-rect" />
        <circle />
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        data-path="/"
      >
        <rect
          data-path="my-rect/"
          id="my-rect"
        />
        <circle
          data-path="/1/"
        />
      </g>
    `);
  });

  it("id replaces the path and children append to it", () => {
    const tree = (
      <g>
        <g id="container">
          <rect />
          <circle />
        </g>
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        data-path="/"
      >
        <g
          data-path="container/"
          id="container"
        >
          <rect
            data-path="container/0/"
          />
          <circle
            data-path="container/1/"
          />
        </g>
      </g>
    `);
  });

  it("handles mixed id and relative paths", () => {
    const tree = (
      <g>
        <g>
          <rect id="special" />
          <circle />
        </g>
        <line />
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        data-path="/"
      >
        <g
          data-path="/0/"
        >
          <rect
            data-path="special/"
            id="special"
          />
          <circle
            data-path="/0/1/"
          />
        </g>
        <line
          data-path="/1/"
        />
      </g>
    `);
  });

  it("preserves existing props", () => {
    const tree = (
      <g className="my-class">
        <rect x={10} y={20} fill="red" />
      </g>
    );

    expect(assignPaths(tree)).toMatchInlineSnapshot(`
      <g
        className="my-class"
        data-path="/"
      >
        <rect
          data-path="/0/"
          fill="red"
          x={10}
          y={20}
        />
      </g>
    `);
  });
});
