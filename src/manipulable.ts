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
import { clamp } from "./utils";
import { Vec2 } from "./vec2";

/** A manipulable is a way of visualizing and interacting with data
 * (of some type T). */
export type Manipulable<T> = {
  render(t: T): Shape;
  accessibleFrom(t: T, draggableKey: string): T[];
};

export class ManipulableDrawer<T> {
  private curDrag: {
    draggableKey: string;
    pointerOffset: Vec2;
    prevTInfo: {
      offset: Vec2;
    };
    nextTInfos: {
      t: T;
      rendered: Shape;
      draggable: Shape;
      offset: Vec2;
    }[];
  } | null = null;

  constructor(
    public manipulable: Manipulable<T>,
    public t: T,
  ) {}

  draw(lyr: Layer, pointer: IPointerManager): void {
    const lyrDebug = layer(lyr);

    let drewSomething = false;
    if (this.curDrag) {
      pointer.setCursor("grabbing");
      pointer.addPointerUpHandler(() => {
        this.curDrag = null;
      });

      const curDraggableOffset = pointer.dragPointer!.sub(
        this.curDrag!.pointerOffset,
      );
      const prevToCur = curDraggableOffset.sub(this.curDrag.prevTInfo.offset);
      const prevToCurUnit = prevToCur.norm();

      // which adjacent morphism maximizes the dot product with toPointer?
      const nextTInfosWithGeom = this.curDrag.nextTInfos.map((newTInfo) => {
        const prevToNext = newTInfo.offset.sub(this.curDrag!.prevTInfo.offset);
        const curToNext = newTInfo.offset.sub(curDraggableOffset);
        return {
          ...newTInfo,
          prevToNext,
          dotUnit: prevToCurUnit.dot(prevToNext.norm()),
          cross: prevToCurUnit.cross(prevToNext),
          dist: curToNext.len(),
        };
      });
      // console.log("nextTInfosWithGeom", nextTInfosWithGeom);
      // const bestNextTInfo = _.maxBy(
      //   nextTInfosWithGeom.filter(({ cross }) => Math.abs(cross) < 40),
      //   "dotUnit",
      // );
      const bestNextTInfo = _.minBy(
        nextTInfosWithGeom.filter(({ cross }) => Math.abs(cross) < 40),
        "dist",
      );

      console.log("bestNextTInfo", bestNextTInfo);

      if (bestNextTInfo !== undefined) {
        const { prevToNext } = bestNextTInfo;
        const t = clamp(
          0,
          1,
          prevToCur.dot(prevToNext) / prevToNext.dot(prevToNext),
        );

        // console.log(bestNextTInfo.rendered);
        const prev = origToInterpolatable(this.manipulable.render(this.t));
        const next = bestNextTInfo.rendered;
        // console.log("prev", JSON.stringify(prev, null, 2));
        // console.log("next", JSON.stringify(next, null, 2));
        // console.log(JSON.stringify(diff(prev, next), null, 2));
        const lerped = lerpShapes(prev, next, t);
        drawInterpolatable(lyr, lerped);
        drewSomething = true;

        if (t > 0.99) {
          // if (bestNextTInfo.dist < 3) {
          this.t = bestNextTInfo.t;
          this.curDrag = {
            ...this.curDrag,
            prevTInfo: { offset: bestNextTInfo.offset },
            nextTInfos: this.getNextTInfosForDrag(this.curDrag.draggableKey),
          };
        }

        if (t > 0.5) {
          pointer.addPointerUpHandler(() => {
            console.log("pointer up with t =", t);

            this.t = bestNextTInfo.t;
            this.curDrag = null;
          });
        }
      }

      if (false) {
        lyrDebug.do(() => {
          lyrDebug.strokeStyle = "green";
          lyrDebug.setLineDash([5, 5]);
          lyrDebug.beginPath();
          const prevOffset = this.curDrag!.prevTInfo.offset;
          lyrDebug.arc(...prevOffset.arr(), 10, 0, 2 * Math.PI);
          lyrDebug.stroke();
        });

        lyrDebug.do(() => {
          lyrDebug.strokeStyle = "black";
          lyrDebug.setLineDash([5, 5]);
          lyrDebug.beginPath();
          const curOffset = pointer.dragPointer!.sub(
            this.curDrag!.pointerOffset,
          );
          lyrDebug.arc(...curOffset.arr(), 10, 0, 2 * Math.PI);
          lyrDebug.stroke();
        });

        for (const { offset, t } of this.curDrag?.nextTInfos ?? []) {
          lyrDebug.do(() => {
            lyrDebug.strokeStyle = "red";
            if (!bestNextTInfo || t !== bestNextTInfo.t) {
              lyrDebug.setLineDash([5, 5]);
            }
            lyrDebug.beginPath();
            lyrDebug.arc(...offset.arr(), 10, 0, 2 * Math.PI);
            lyrDebug.stroke();
          });
        }
      }
    }

    if (!drewSomething) {
      let cleanup = () => {};
      if (true) {
        const orig = this.manipulable.render(this.t);
        const interpolatable = origToInterpolatable(orig);
        // console.log("interpol", interpolatable);
        drawInterpolatable(lyr, interpolatable, {
          pointer: pointer,
          onDragStart: (key, pointerOffset) => {
            const { offset } = shapeByKey(interpolatable, key);
            this.curDrag = {
              draggableKey: key,
              pointerOffset,
              prevTInfo: { offset },
              nextTInfos: this.getNextTInfosForDrag(key),
            };
          },
        });
      } else {
        // const fgNode = getCircle(curDrawnTree.fgGrp, selectedNodeId!);
        // const originalCenter = fgNode.center;
        // cleanup = () => (fgNode.center = originalCenter);
        // const pointerInLyrPan = pointer.dragPointer!.sub(pan);
        // const desiredCenter = pointerInLyrPan.sub(dragOffset!);
        // const desireVector = desiredCenter.sub(fgNode.center);
        // const maxMoveDistance = FG_NODE_SIZE / 8;
        // const desireVectorForVis =
        //   desireVector.len() === 0
        //     ? Vec2(0)
        //     : desireVector
        //         .norm()
        //         .mul(
        //           maxMoveDistance *
        //             Math.tanh((0.05 * desireVector.len()) / maxMoveDistance),
        //         );
        // const desiredCenterForVis = fgNode.center.add(desireVectorForVis);
        // fgNode.center = desiredCenterForVis;
      }
      lyr.place(lyrDebug);
    }
  }

  getNextTInfosForDrag(draggableKey: string) {
    return this.manipulable.accessibleFrom(this.t, draggableKey).map((t) => {
      const rendered = origToInterpolatable(this.manipulable.render(t));
      const { shape: draggable, offset } = shapeByKey(rendered, draggableKey);
      return { t, rendered, draggable, offset };
    });
  }
}
