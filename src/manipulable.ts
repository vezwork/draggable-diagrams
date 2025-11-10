import { Delaunay } from "d3-delaunay";
import _ from "lodash";
import { layer, Layer } from "./layer";
import { IPointerManager } from "./pointer";
import {
  drawInterpolatable,
  lerpShapes,
  origToInterpolatable,
  Shape,
  shapeByKey,
} from "./shape";
import { Vec2 } from "./vec2";

/** A manipulable is a way of visualizing and interacting with data
 * (of some type T). */
export type Manipulable<T> = {
  render(t: T): Shape;
  accessibleFrom(t: T, draggableKey: string): T[];
};

export class ManipulableDrawer<T> {
  private state:
    | {
        type: "idle";
        t: T;
      }
    | {
        type: "dragging";
        draggableKey: string;
        pointerOffset: Vec2;
        prevT: T;
        tInfos: {
          t: T;
          interpolatableShape: Shape;
          draggable: Shape;
          offset: Vec2;
        }[];
        delaunay: Delaunay<Delaunay.Point>;
      };

  constructor(
    public manipulable: Manipulable<T>,
    t: T,
    public config: { snapRadius: number } = { snapRadius: 20 },
  ) {
    this.state = { type: "idle", t };
  }

  draw(lyr: Layer, pointer: IPointerManager): void {
    const state = this.state;
    const lyrDebug = layer(lyr);

    if (state.type === "dragging") {
      let toDraw: Shape | null = null;
      pointer.setCursor("grabbing");

      const draggableDestPtMaybeOutside = pointer.dragPointer!.sub(
        state.pointerOffset,
      );
      const prelimTriIdx = findTriangle(
        state.delaunay,
        draggableDestPtMaybeOutside,
      );
      const draggableDestPt =
        prelimTriIdx === -1
          ? projectOntoConvexHull(state.delaunay, draggableDestPtMaybeOutside)
              .projectedPt
          : draggableDestPtMaybeOutside;
      const closestTInfo = _.minBy(state.tInfos, (tInfo) =>
        draggableDestPt.dist(tInfo.offset),
      );
      pointer.addPointerUpHandler(() => {
        this.state = { type: "idle", t: closestTInfo!.t };
      });

      // if (draggableDestPt.dist(closestTInfo!.offset) < this.config.snapRadius) {
      if (false) {
        toDraw = closestTInfo!.interpolatableShape;
        // TODO: we used to let you snap through different sets of
        // accessible states, but I think this is a bad idea... gotta
        // update some manipulables tho

        // this.enterDraggingMode(
        //   closestTInfo!.t, state.draggableKey,
        //   state.pointerOffset, );
      } else {
        const triIdx = findTriangle(state.delaunay, draggableDestPt);

        if (triIdx === -1) {
          throw new Error("outside convex hull... shouldn't happen?");
          // // outside convex hull - project onto hull
          // const projection = projectOntoConvexHull(
          //   state.delaunay,
          //   draggableDestPt,
          // );
          // // console.log("outside convex hull, projection", projection);

          // if (projection.type === "vertex") {
          //   toDraw = state.tInfos[projection.vertexIdx].interpolatableShape;
          // } else {
          //   // interpolate along edge
          //   const { edgeIdx0, edgeIdx1, t } = projection;
          //   toDraw = lerpShapes(
          //     state.tInfos[edgeIdx0].interpolatableShape,
          //     state.tInfos[edgeIdx1].interpolatableShape,
          //     t,
          //   );
          // }
        } else {
          // console.log("found triangle", triIdx);
          const ptIdx0 = state.delaunay.triangles[3 * triIdx + 0];
          const ptIdx1 = state.delaunay.triangles[3 * triIdx + 1];
          const ptIdx2 = state.delaunay.triangles[3 * triIdx + 2];
          const ptIdxSet = new Set([ptIdx0, ptIdx1, ptIdx2]);
          if (ptIdxSet.size === 2) {
            // interpolate draggableDestPt along edge
            const [ptIdxA, ptIdxB] = Array.from(ptIdxSet);
            // console.log("degenerate edge", ptIdxA, ptIdxB);
            const [ptA, ptB] = [
              state.tInfos[ptIdxA].offset,
              state.tInfos[ptIdxB].offset,
            ];
            const t =
              draggableDestPt.sub(ptA).projOnto(ptB.sub(ptA)).len() /
              ptB.sub(ptA).len();
            // console.log("t along edge", t);
            toDraw = lerpShapes(
              state.tInfos[ptIdxA].interpolatableShape,
              state.tInfos[ptIdxB].interpolatableShape,
              t,
            );
          } else {
            // console.log("triangle", ptIdx0, ptIdx1, ptIdx2);
            // console.log(
            //   "triangle pts",
            //   state.tInfos[ptIdx0].offset,
            //   state.tInfos[ptIdx1].offset,
            //   state.tInfos[ptIdx2].offset,
            // );
            const bary = barycentric(
              draggableDestPt,
              state.tInfos[ptIdx0].offset,
              state.tInfos[ptIdx1].offset,
              state.tInfos[ptIdx2].offset,
            );
            // console.log(bary);
            toDraw = lerpShapes3(
              state.tInfos[ptIdx0].interpolatableShape,
              state.tInfos[ptIdx1].interpolatableShape,
              state.tInfos[ptIdx2].interpolatableShape,
              bary,
            );
          }
        }
      }
      // console.log("toDraw", toDraw);
      drawInterpolatable(lyr, toDraw);
      if (false) {
        lyr.do(() => {
          lyr.globalAlpha = 0.5;
          drawInterpolatable(lyr, closestTInfo!.interpolatableShape);
        });
      }

      if (true) {
        for (const { offset } of state.tInfos) {
          lyrDebug.do(() => {
            lyrDebug.beginPath();
            lyrDebug.arc(...offset.arr(), 5, 0, 2 * Math.PI);
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
          lyrDebug.arc(...draggableDestPt.arr(), 10, 0, 2 * Math.PI);
          lyrDebug.stroke();
          // draw line to projection
          lyrDebug.beginPath();
          lyrDebug.moveTo(...draggableDestPtMaybeOutside.arr());
          lyrDebug.lineTo(...draggableDestPt.arr());
          lyrDebug.stroke();
        });
      }
    } else if (state.type === "idle") {
      pointer.setCursor("default");

      const orig = this.manipulable.render(state.t);
      const interpolatable = origToInterpolatable(orig);
      // console.log("interpol", interpolatable);
      drawInterpolatable(lyr, interpolatable, {
        pointer: pointer,
        onDragStart: (key, pointerOffset) => {
          this.enterDraggingMode(state.t, key, pointerOffset);
        },
      });
    }

    lyr.place(lyrDebug);
  }

  private enterDraggingMode(t: T, draggableKey: string, pointerOffset: Vec2) {
    const states = [t, ...this.manipulable.accessibleFrom(t, draggableKey)];
    console.log("enterDraggingMode states", states);
    const tInfos = states.map((t) => {
      const interpolatableShape = origToInterpolatable(
        this.manipulable.render(t),
      );
      const { shape: draggable, offset } = shapeByKey(
        interpolatableShape,
        draggableKey,
      );
      return { t, interpolatableShape, draggable, offset };
    });
    const delaunay = Delaunay.from(tInfos.map((tInfo) => tInfo.offset.arr()));
    console.log("delaunay", delaunay);
    this.state = {
      type: "dragging",
      draggableKey,
      pointerOffset,
      prevT: t,
      tInfos,
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
  a: Shape,
  b: Shape,
  c: Shape,
  { l0, l1, l2 }: { l0: number; l1: number; l2: number },
) {
  if (l0 + l1 < 1e-6) {
    return c;
  }
  const ab = lerpShapes(a, b, l1 / (l0 + l1));
  return lerpShapes(ab, c, l2);
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
  // Get convex hull edges
  const hull = delaunay.hull;
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
