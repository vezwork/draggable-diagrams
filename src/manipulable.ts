import { Delaunay } from "d3-delaunay";
import _ from "lodash";
import { layer, Layer } from "./layer";
import { IPointerManager } from "./pointer";
import {
  drawInterpolatable,
  InterpolatableShape,
  lerpShapes,
  origToInterpolatable,
  Shape,
  shapeByKey,
} from "./shape";
import { assert, clamp } from "./utils";
import { Vec2 } from "./vec2";

/** A manipulable is a way of visualizing and interacting with
 * "state" (of some type T). */
export type Manipulable<T> = {
  render(state: T): Shape;
  accessibleFrom(state: T, draggableKey: string): T[];
};

export class ManipulableDrawer<T> {
  private state:
    | {
        type: "idle";
        state: T;
      }
    | {
        type: "dragging";
        draggableKey: string;
        pointerOffset: Vec2;
        prevState: T;
        accessibleStateInfos: {
          state: T;
          shape: InterpolatableShape;
          offset: Vec2;
        }[];
        accessibleDeletionInfo: {
          state: T;
          shape: InterpolatableShape;
        } | null;
        delaunay: Delaunay<Delaunay.Point>;
      };

  public config: { snapRadius: number; debugView: boolean };

  constructor(
    public manipulable: Manipulable<T>,
    state: T,
    config: Partial<typeof this.config> = {},
  ) {
    this.state = { type: "idle", state };
    this.config = { snapRadius: 20, debugView: false, ...config };
  }

  draw(lyr: Layer, pointer: IPointerManager): void {
    const state = this.state;
    const lyrDebug = layer(lyr);

    if (state.type === "dragging") {
      pointer.setCursor("grabbing");

      const { shapeToDraw, newState } = ((): {
        shapeToDraw: InterpolatableShape;
        newState: T;
      } => {
        const draggableDestPt = pointer.dragPointer!.sub(state.pointerOffset);

        const closestStateInfo = _.minBy(state.accessibleStateInfos, (info) =>
          draggableDestPt.dist(info.offset),
        );

        // where is it in the triangulation?
        const triIdx = findTriangle(state.delaunay, draggableDestPt);

        // project if it's outside the convex hull (or collinear)
        let projected =
          triIdx === -1 || (state.delaunay as any).collinear
            ? projectOntoConvexHull(state.delaunay, draggableDestPt)
            : null;
        const projectedDestPt = projected?.projectedPt ?? draggableDestPt;

        // debug view
        if (this.config.debugView) {
          for (const { offset } of state.accessibleStateInfos) {
            lyrDebug.do(() => {
              lyrDebug.beginPath();
              lyrDebug.arc(
                ...offset.arr(),
                this.config.snapRadius,
                0,
                2 * Math.PI,
              );
              lyrDebug.fillStyle = "red";
              lyrDebug.fill();
            });
          }

          lyrDebug.do(() => {
            lyrDebug.strokeStyle = "red";
            lyrDebug.lineWidth = 2;
            const { triangles, points } = state.delaunay;
            for (let i = 0; i < triangles.length; i += 3) {
              const ax = points[2 * triangles[i]];
              const ay = points[2 * triangles[i] + 1];
              const bx = points[2 * triangles[i + 1]];
              const by = points[2 * triangles[i + 1] + 1];
              const cx = points[2 * triangles[i + 2]];
              const cy = points[2 * triangles[i + 2] + 1];
              lyrDebug.beginPath();
              lyrDebug.moveTo(ax, ay);
              lyrDebug.lineTo(bx, by);
              lyrDebug.lineTo(cx, cy);
              lyrDebug.lineTo(ax, ay);
              lyrDebug.stroke();
            }
          });

          lyrDebug.do(() => {
            lyrDebug.strokeStyle = "blue";
            lyrDebug.lineWidth = 2;
            lyrDebug.beginPath();
            lyrDebug.arc(...projectedDestPt.arr(), 10, 0, 2 * Math.PI);
            lyrDebug.stroke();
            // draw line to projection
            lyrDebug.beginPath();
            lyrDebug.moveTo(...draggableDestPt.arr());
            lyrDebug.lineTo(...projectedDestPt.arr());
            lyrDebug.stroke();
          });
        }

        // check if it's time to delete
        // TODO: make this work better lol
        if (state.accessibleDeletionInfo) {
          const deletionDist = projectedDestPt.dist(draggableDestPt);
          // console.log("deletionDist", deletionDist);
          if (deletionDist > 40) {
            const t = clamp((deletionDist - 40) / 20, 0, 1);
            return {
              shapeToDraw: lerpShapes(
                closestStateInfo!.shape,
                state.accessibleDeletionInfo.shape,
                t,
              ),
              newState:
                t > 0.5
                  ? state.accessibleDeletionInfo.state
                  : closestStateInfo!.state,
            };
          }
        }

        const newState = closestStateInfo!.state;

        // check if it's time to snap
        if (
          projectedDestPt.dist(closestStateInfo!.offset) <
          this.config.snapRadius
        ) {
          // TODO: maybe this should be optional?
          this.enterDraggingMode(
            newState,
            state.draggableKey,
            state.pointerOffset,
          );
          return { shapeToDraw: closestStateInfo!.shape, newState };
        }

        if (projected) {
          // we handle this as a special case directly rather than
          // working with projectedDestPt
          if (projected.type === "vertex") {
            return {
              shapeToDraw:
                state.accessibleStateInfos[projected.vertexIdx].shape,
              newState,
            };
          } else {
            // interpolate along edge
            const { edgeIdx0, edgeIdx1, t } = projected;
            return {
              shapeToDraw: lerpShapes(
                state.accessibleStateInfos[edgeIdx0].shape,
                state.accessibleStateInfos[edgeIdx1].shape,
                t,
              ),
              newState,
            };
          }
        }

        const ptIdx0 = state.delaunay.triangles[3 * triIdx + 0];
        const ptIdx1 = state.delaunay.triangles[3 * triIdx + 1];
        const ptIdx2 = state.delaunay.triangles[3 * triIdx + 2];
        const ptIdxSet = new Set([ptIdx0, ptIdx1, ptIdx2]);
        assert(ptIdxSet.size >= 2);
        if (ptIdxSet.size === 2) {
          // I think this only happens when there are only two points
          // total, like for the 15 puzzle. IDK why it happens at all.
          const [idxA, idxB] = Array.from(ptIdxSet);
          const a = state.accessibleStateInfos[idxA];
          const b = state.accessibleStateInfos[idxB];
          const edge = b.offset.sub(a.offset);
          const edgeLen2 = edge.len2();
          assert(edgeLen2 > 0);
          const t = clamp(
            draggableDestPt.sub(a.offset).dot(edge) / edgeLen2,
            0,
            1,
          );
          return {
            shapeToDraw: lerpShapes(a.shape, b.shape, t),
            newState,
          };
        } else {
          const bary = barycentric(
            draggableDestPt,
            state.accessibleStateInfos[ptIdx0].offset,
            state.accessibleStateInfos[ptIdx1].offset,
            state.accessibleStateInfos[ptIdx2].offset,
          );
          // console.log(bary);
          return {
            shapeToDraw: lerpShapes3(
              state.accessibleStateInfos[ptIdx0].shape,
              state.accessibleStateInfos[ptIdx1].shape,
              state.accessibleStateInfos[ptIdx2].shape,
              bary,
            ),
            newState,
          };
        }
      })();
      drawInterpolatable(lyr, shapeToDraw);
      pointer.addPointerUpHandler(() => {
        this.state = { type: "idle", state: newState };
      });
    } else if (state.type === "idle") {
      pointer.setCursor("default");

      const orig = this.manipulable.render(state.state);
      const interpolatable = origToInterpolatable(orig);
      // console.log("interpol", interpolatable);
      drawInterpolatable(lyr, interpolatable, {
        pointer: pointer,
        onDragStart: (key, pointerOffset) => {
          this.enterDraggingMode(state.state, key, pointerOffset);
        },
      });
    }

    lyr.place(lyrDebug);
  }

  private enterDraggingMode(
    state: T,
    draggableKey: string,
    pointerOffset: Vec2,
  ) {
    const states = this.manipulable.accessibleFrom(state, draggableKey);
    // console.log("enterDraggingMode states", states);
    let accessibleDeletionInfo: {
      state: T;
      interpolatableShape: Shape;
    } | null = null;
    const accessibleStateInfos = states.flatMap((state) => {
      const shape = origToInterpolatable(this.manipulable.render(state));
      const foundShape = shapeByKey(shape, draggableKey);
      if (foundShape) {
        return { state, shape, offset: foundShape.offset } satisfies Extract<
          typeof this.state,
          { type: "dragging" }
        >["accessibleStateInfos"][0];
      } else {
        assert(!accessibleDeletionInfo, "Multiple deletions found");
        accessibleDeletionInfo = { state, interpolatableShape: shape };
        return [];
      }
    });
    const delaunay = Delaunay.from(
      accessibleStateInfos.map((info) => info.offset.arr()),
    );
    // console.log("delaunay", delaunay);
    this.state = {
      type: "dragging",
      draggableKey,
      pointerOffset,
      prevState: state,
      accessibleStateInfos,
      accessibleDeletionInfo: accessibleDeletionInfo,
      delaunay,
    };
  }
}

function findTriangle(
  delaunay: Delaunay<Delaunay.Point>,
  pt: Vec2,
  {
    edge = 0,
    // visit = null,
    limit = Infinity,
  } = {},
): number {
  if (isNaN(edge)) return -1;
  // coords is required for delaunator compatibility.
  const { triangles, halfedges, points } = delaunay;

  const getPrev = (e: number) => (e % 3 === 0 ? e + 2 : e - 1);
  const getNext = (e: number) => (e % 3 === 2 ? e - 2 : e + 1);
  let current = edge,
    start = current,
    n = 0;

  while (true) {
    if (limit-- <= 0) return -1;
    // if (visit) visit(current);

    const next = getNext(current);
    const pc = triangles[current] * 2;
    const pn = triangles[next] * 2;
    const o = orientation(
      points[pc],
      points[pc + 1],
      points[pn],
      points[pn + 1],
      pt.x,
      pt.y,
    );

    if (o >= 0) {
      if (start === (current = next)) break;
    } else {
      if (-1 === (current = halfedges[current])) break;
      start = current = ++n % 2 ? getNext(current) : getPrev(current);
    }
  }
  return current > -1 ? Math.floor(current / 3) : -1;
}

// Returns the orientation of three points A, B and C:
//   -1 = counterclockwise
//    0 = collinear
//    1 = clockwise
// More on the topic: http://www.dcs.gla.ac.uk/~pat/52233/slides/Geometry1x1.pdf
function orientation(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
) {
  // Determinant of vectors of the line segments AB and BC:
  // [ cx - bx ][ bx - ax ]
  // [ cy - by ][ by - ay ]
  return Math.sign((cx - bx) * (by - ay) - (cy - by) * (bx - ax));
}

function barycentric(pt: Vec2, p0: Vec2, p1: Vec2, p2: Vec2) {
  const x = pt.x;
  const y = pt.y;
  const x0 = p0.x;
  const y0 = p0.y;
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  const l0 = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / den;
  const l1 = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / den;
  const l2 = 1 - l0 - l1;
  return { l0, l1, l2 };
}

function lerpShapes3(
  a: InterpolatableShape,
  b: InterpolatableShape,
  c: InterpolatableShape,
  { l0, l1, l2 }: { l0: number; l1: number; l2: number },
) {
  if (l0 + l1 < 1e-6) {
    return c;
  }
  const ab = lerpShapes(a, b, l1 / (l0 + l1));
  return lerpShapes(ab, c, l2);
}

function delaunayCollinearIdxs(delaunay: Delaunay<Delaunay.Point>): number[] {
  return (delaunay as any).collinear;
}

function projectOntoConvexHull(
  delaunay: Delaunay<Delaunay.Point>,
  pt: Vec2,
):
  | { type: "vertex"; vertexIdx: number; projectedPt: Vec2 }
  | {
      type: "edge";
      edgeIdx0: number;
      edgeIdx1: number;
      t: number;
      projectedPt: Vec2;
    } {
  // Special case: If the points are collinear, delaunay.hull isn't a
  // hull in cyclic order. We use an undocumented d3-delaunay
  // property to make our own hull.
  const collinearIdxs = delaunayCollinearIdxs(delaunay);
  const hull = collinearIdxs
    ? [
        ...collinearIdxs,
        ..._.reverse(collinearIdxs.slice(1, collinearIdxs.length - 1)),
      ]
    : delaunay.hull;
  const points = delaunay.points;

  let minDist = Infinity;
  let bestProjection:
    | { type: "vertex"; vertexIdx: number; projectedPt: Vec2 }
    | {
        type: "edge";
        edgeIdx0: number;
        edgeIdx1: number;
        t: number;
        projectedPt: Vec2;
      }
    | null = null;

  // Check each edge of the convex hull
  for (let i = 0; i < hull.length; i++) {
    const idx0 = hull[i];
    const idx1 = hull[(i + 1) % hull.length];

    const p0 = Vec2(points[2 * idx0], points[2 * idx0 + 1]);
    const p1 = Vec2(points[2 * idx1], points[2 * idx1 + 1]);

    // Project pt onto the line segment from p0 to p1
    const edge = p1.sub(p0);
    const edgeLen2 = edge.len2();

    if (edgeLen2 < 1e-10) {
      // Degenerate edge, treat as vertex
      const dist = pt.dist(p0);
      if (dist < minDist) {
        minDist = dist;
        bestProjection = { type: "vertex", vertexIdx: idx0, projectedPt: p0 };
      }
      continue;
    }

    // Parameter t for projection onto infinite line
    const t = pt.sub(p0).dot(edge) / edgeLen2;

    // Clamp to [0, 1] to stay on the line segment
    const tClamped = Math.max(0, Math.min(1, t));

    // Closest point on the edge
    const closestPt = p0.lerp(p1, tClamped);
    const dist = pt.dist(closestPt);

    if (dist < minDist) {
      minDist = dist;

      // Check if we're at a vertex or along the edge
      if (tClamped < 1e-6) {
        bestProjection = { type: "vertex", vertexIdx: idx0, projectedPt: p0 };
      } else if (tClamped > 1 - 1e-6) {
        bestProjection = { type: "vertex", vertexIdx: idx1, projectedPt: p1 };
      } else {
        bestProjection = {
          type: "edge",
          edgeIdx0: idx0,
          edgeIdx1: idx1,
          t: tClamped,
          projectedPt: closestPt,
        };
      }
    }
  }

  return bestProjection!;
}
