import { layer } from "./layer";
import { ManipulableDrawer } from "./manipulable";
import { manipulableGridPoly } from "./manipulable-grid-poly";
import { manipulableOrderPreserving } from "./manipulable-order-preserving";
import { manipulablePerm } from "./manipulable-perm";
import { manipulablePermDouble } from "./manipulable-perm-double";
import { manipulableTiles } from "./manipulable-tiles";
import { PointerManager, pointerManagerWithOffset } from "./pointer";
import { buildHasseDiagram, tree4 } from "./trees";
import { Vec2 } from "./vec2";

// Canvas setup
const c = document.getElementById("c") as HTMLCanvasElement;
const cContainer = document.getElementById("c-container") as HTMLDivElement;
const ctx = c.getContext("2d")!;

// Debug state
let showClickablesDebug = false;

// Keyboard event listeners
window.addEventListener("keydown", (e) => {
  if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    showClickablesDebug = !showClickablesDebug;
  }
  // if (e.key === "Escape") {
  //   selectedNodeId = null;
  //   dragOffset = null;
  // }
});

const domainTree = tree4;
const codomainTree = tree4;

// const domainTree = biggerTree;
// const codomainTree = biggerTree;

const hasseDiagram = buildHasseDiagram(domainTree, codomainTree);
console.log("Hasse diagram contains:", hasseDiagram.nodes.length);

// const drawnTrees = hasseDiagram.nodes.map((morph) =>
//   drawBgTree(codomainTree, domainTree, morph),
// );

// const morphBefore = hasseDiagram.nodes[0];
// const morphAfter = hasseDiagram.nodes[1];
// const nodeId = covers(morphBefore, morphAfter, codomainTree)!;

// const rBefore = drawBgTree(codomainTree, domainTree, morphBefore);
// const rAfter = drawBgTree(codomainTree, domainTree, morphAfter);

// let curMorphIdx = 0;
// let selectedNodeId: string | null = null;
// let dragOffset: Vec2 | null = null;

const pointer = new PointerManager(c);

const drawerOrderPreserving = new ManipulableDrawer(
  manipulableOrderPreserving,
  {
    domainTree,
    codomainTree,
    hasseDiagram,
    curMorphIdx: 0,
  },
);

// const drawer = new ManipulableDrawer(manipulableTiles, {
//   w: 2,
//   h: 1,
//   tiles: [{ key: "a", x: 0, y: 0 }],
// });

const drawerTiles = new ManipulableDrawer(manipulableTiles, {
  w: 4,
  h: 4,
  tiles: [
    { key: "12", x: 0, y: 0 },
    { key: "1", x: 1, y: 0 },
    { key: "2", x: 2, y: 0 },
    { key: "15", x: 3, y: 0 },
    { key: "11", x: 0, y: 1 },
    { key: "6", x: 1, y: 1 },
    { key: "5", x: 2, y: 1 },
    { key: "8", x: 3, y: 1 },
    { key: "7", x: 0, y: 2 },
    { key: "10", x: 1, y: 2 },
    { key: "9", x: 2, y: 2 },
    { key: "4", x: 3, y: 2 },
    { key: "13", x: 1, y: 3 },
    { key: "14", x: 2, y: 3 },
    { key: "3", x: 3, y: 3 },
  ],
});

const drawerGridPoly = new ManipulableDrawer(manipulableGridPoly, {
  w: 6,
  h: 6,
  points: [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
  ],
});

const drawerPerm = new ManipulableDrawer(manipulablePerm, {
  perm: [2, 0, 1, 4, 3],
});

const drawerPermDouble = new ManipulableDrawer(manipulablePermDouble, {
  rows: [
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  ],
});

// Drawing function
function draw() {
  pointer.prepareForDraw();

  c.style.cursor = "default";

  // Create main layer
  const lyr = layer(ctx);

  // Clear canvas with white background
  lyr.fillStyle = "white";
  lyr.fillRect(0, 0, c.width, c.height);

  const posTiles = Vec2(50, 50);
  const lyrTiles = layer(ctx);
  lyr.place(lyrTiles, posTiles);
  drawerTiles.draw(lyrTiles, pointerManagerWithOffset(pointer, posTiles));

  const posOrderPreserving = Vec2(400, 50);
  const lyrOrderPreserving = layer(ctx);
  lyr.place(lyrOrderPreserving, posOrderPreserving);
  drawerOrderPreserving.draw(
    lyrOrderPreserving,
    pointerManagerWithOffset(pointer, posOrderPreserving),
  );

  const posGridPoly = Vec2(50, 400);
  const lyrGridPoly = layer(ctx);
  lyr.place(lyrGridPoly, posGridPoly);
  drawerGridPoly.draw(
    lyrGridPoly,
    pointerManagerWithOffset(pointer, posGridPoly),
  );

  const posPerm = Vec2(700, 50);
  const lyrPerm = layer(ctx);
  lyr.place(lyrPerm, posPerm);
  drawerPerm.draw(lyrPerm, pointerManagerWithOffset(pointer, posPerm));

  const posPermDouble = Vec2(700, 400);
  const lyrPermDouble = layer(ctx);
  lyr.place(lyrPermDouble, posPermDouble);
  drawerPermDouble.draw(
    lyrPermDouble,
    pointerManagerWithOffset(pointer, posPermDouble),
  );

  // function getCircle(grp: Shape, id: string): Shape & { type: "circle" } {
  //   return (grp as KeyedGroup).shapes[id] as Shape & {
  //     type: "circle";
  //   };
  // }

  // const curDrawnTree = drawnTrees[curMorphIdx];

  // let drewSomething = false;
  // let adjMorphDots: {
  //   adjMorphIdx: number;
  //   circle: Shape & { type: "circle" };
  //   dot: number;
  // }[] = [];
  // if (selectedNodeId) {
  //   const pointerInLyrPan = pointer.hoverPointer.sub(pan);

  //   c.style.cursor = "grabbing";
  //   pointer.addPointerUpHandler(() => {
  //     selectedNodeId = null;
  //     dragOffset = null;
  //   });
  //   const selectedCircle = getCircle(curDrawnTree.fgGrp, selectedNodeId);
  //   const adjMorphIdxes = [
  //     ...hasseDiagram.edges
  //       .filter(
  //         ([from, _to, nodeId]) =>
  //           from === curMorphIdx && nodeId === selectedNodeId,
  //       )
  //       .map(([, to]) => to),
  //     ...hasseDiagram.edges
  //       .filter(
  //         ([_from, to, nodeId]) =>
  //           to === curMorphIdx && nodeId === selectedNodeId,
  //       )
  //       .map(([from]) => from),
  //   ];
  //   // const adjMorphIdxes = _.range(hasseDiagram.nodes.length);
  //   const toPointer = pointerInLyrPan.sub(selectedCircle.center).norm();
  //   // which adjacent morphism maximizes the dot product with toPointer?
  //   adjMorphDots = adjMorphIdxes.map((adjMorphIdx) => {
  //     const adjDrawn = drawnTrees[adjMorphIdx];
  //     const adjCircle = getCircle(adjDrawn.fgGrp, selectedNodeId!);
  //     const toAdjCircle = adjCircle.center.sub(selectedCircle.center).norm();
  //     return {
  //       adjMorphIdx,
  //       circle: adjCircle,
  //       dot: toPointer.dot(toAdjCircle),
  //     };
  //   });
  //   const bestAdjMorphIdx = _.maxBy(
  //     adjMorphDots.filter(({ dot }) => dot > 0.5),
  //     "dot",
  //   )?.adjMorphIdx;

  //   if (bestAdjMorphIdx !== undefined) {
  //     const adjDrawn = drawnTrees[bestAdjMorphIdx];
  //     const adjCircle = getCircle(adjDrawn.fgGrp, selectedNodeId);
  //     const totalVec = adjCircle.center.sub(selectedCircle.center);
  //     const pointerVec = pointerInLyrPan
  //       .sub(selectedCircle.center)
  //       .sub(dragOffset!);
  //     const t = clamp(0, 1, pointerVec.dot(totalVec) / totalVec.dot(totalVec));

  //     const targetDrawnTree = drawnTrees[bestAdjMorphIdx];

  //     const bgGrpLerp = lerpShapes(
  //       curDrawnTree.bgGrp,
  //       targetDrawnTree.bgGrp,
  //       t,
  //     );
  //     const fgGrpLerp = lerpShapes(
  //       curDrawnTree.fgGrp,
  //       targetDrawnTree.fgGrp,
  //       t,
  //     );
  //     drawShape(lyrPan, bgGrpLerp);
  //     drawShape(lyrPan, fgGrpLerp);
  //     drewSomething = true;

  //     if (t === 1) {
  //       curMorphIdx = bestAdjMorphIdx;
  //     }

  //     if (t > 0.5) {
  //       pointer.addPointerUpHandler(() => {
  //         console.log("pointer up with t =", t);

  //         curMorphIdx = bestAdjMorphIdx;
  //       });
  //     }
  //   }
  // }

  // if (!drewSomething) {
  //   let cleanup = () => {};
  //   if (!selectedNodeId) {
  //     for (const node of nodesInTree(codomainTree)) {
  //       const fgNode = getCircle(curDrawnTree.fgGrp, node.id);
  //       const bbox: XYWH = [
  //         ...pan
  //           .add(fgNode.center)
  //           .sub(Vec2(FG_NODE_SIZE / 2))
  //           .arr(),
  //         FG_NODE_SIZE,
  //         FG_NODE_SIZE,
  //       ];
  //       if (inXYWH(...pointer.hoverPointer.arr(), bbox)) {
  //         c.style.cursor = "grab";
  //       }
  //       pointer.addClickHandler(bbox, () => {
  //         const pointerInLyrPan = pointer.hoverPointer.sub(pan);
  //         selectedNodeId = node.id;
  //         dragOffset = pointerInLyrPan.sub(fgNode.center);
  //       });
  //     }
  //   } else {
  //     const fgNode = getCircle(curDrawnTree.fgGrp, selectedNodeId!);
  //     const originalCenter = fgNode.center;
  //     cleanup = () => (fgNode.center = originalCenter);

  //     const pointerInLyrPan = pointer.dragPointer!.sub(pan);
  //     const desiredCenter = pointerInLyrPan.sub(dragOffset!);
  //     const desireVector = desiredCenter.sub(fgNode.center);
  //     const maxMoveDistance = FG_NODE_SIZE / 8;
  //     const desireVectorForVis =
  //       desireVector.len() === 0
  //         ? Vec2(0)
  //         : desireVector
  //             .norm()
  //             .mul(
  //               maxMoveDistance *
  //                 Math.tanh((0.05 * desireVector.len()) / maxMoveDistance),
  //             );
  //     const desiredCenterForVis = fgNode.center.add(desireVectorForVis);
  //     fgNode.center = desiredCenterForVis;
  //   }
  //   drawShape(lyrPan, curDrawnTree.bgGrp);
  //   drawShape(lyrPan, curDrawnTree.fgGrp);
  //   cleanup();
  // }

  // if (false) {
  //   for (const { circle } of adjMorphDots) {
  //     // draw dashed circle at adjCircle.center for debugging
  //     lyrPan.do(() => {
  //       lyrPan.strokeStyle = "red";
  //       lyrPan.setLineDash([5, 5]);
  //       lyrPan.beginPath();
  //       lyrPan.arc(...circle.center.arr(), circle.radius, 0, 2 * Math.PI);
  //       lyrPan.stroke();
  //     });
  //   }
  // }

  // // Build Hasse diagram and layout
  // const diagram = buildHasseDiagram(domainTree, codomainTree);
  // const hasseLayout = layoutHasse(diagram);

  // // Store morphism bounding boxes and centers for edge drawing
  // const morphBoxes: Map<
  //   number,
  //   {
  //     x: number;
  //     y: number;
  //     w: number;
  //     h: number;
  //     centerX: number;
  //     centerY: number;
  //   }
  // > = new Map();

  // // Draw each morphism at its dagre-computed position
  // for (let morphIdx = 0; morphIdx < diagram.nodes.length; morphIdx++) {
  //   const morph = diagram.nodes[morphIdx];
  //   const pos = hasseLayout.positions.get(morphIdx)!;

  //   const fgNodeCenters: Record<string, PointOnLayer> = {};
  //   const fgKeyedGroup: ((lyr: Layer) => void)[] = [];
  //   const r = drawBgSubtree(
  //     codomainTree,
  //     [domainTree],
  //     morph,
  //     fgNodeCenters,
  //     fgKeyedGroup,
  //   );

  //   // Center the morphism at the dagre position
  //   const morphX = curX + pos.x - r.w / 2;
  //   const morphY = curY + pos.y - r.h / 2;

  //   bgGrp.place(r.bgGrp, v(morphX, morphY));
  //   fgGrp.place(r.fgGrp, v(morphX, morphY));

  //   for (const task of fgKeyedGroup) {
  //     task(fgGrp);
  //   }

  //   // Store bounding box for edge drawing
  //   morphBoxes.set(morphIdx, {
  //     x: morphX,
  //     y: morphY,
  //     w: r.w,
  //     h: r.h,
  //     centerX: curX + pos.x,
  //     centerY: curY + pos.y,
  //   });
  // }

  // // Draw edges between morphisms in the Hasse diagram (on edge layer, behind everything)
  // for (const [from, to] of diagram.edges) {
  //   const fromBox = morphBoxes.get(from);
  //   const toBox = morphBoxes.get(to);

  //   if (fromBox && toBox) {
  //     edgeGrp.do(() => {
  //       edgeGrp.strokeStyle = "black";
  //       edgeGrp.lineWidth = 3;
  //       edgeGrp.beginPath();
  //       // Draw from center to center of morphisms
  //       edgeGrp.moveTo(fromBox.centerX, fromBox.centerY);
  //       edgeGrp.lineTo(toBox.centerX, toBox.centerY);
  //       edgeGrp.stroke();
  //     });
  //   }
  // }

  // // Draw white circles behind each morphism visualization
  // for (const [morphIdx, box] of morphBoxes.entries()) {
  //   whiteBackgroundLyr.do(() => {
  //     whiteBackgroundLyr.fillStyle = "white";
  //     whiteBackgroundLyr.beginPath();
  //     // Use the larger of width/height as diameter, add some padding
  //     const radius = Math.max(box.w, box.h) / 2 + 10;
  //     whiteBackgroundLyr.arc(box.centerX, box.centerY, radius, 0, Math.PI * 2);
  //     whiteBackgroundLyr.fill();
  //   });
  // }

  if (showClickablesDebug) {
    pointer.drawClickablesDebug(lyr);
  }

  // Draw all commands
  lyr.draw();
}

// Auto-resize canvas to match container
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    c.width = width;
    c.height = height;
    draw(); // Redraw immediately after resize
  }
});
resizeObserver.observe(cContainer);

// Main render loop
function drawLoop() {
  requestAnimationFrame(drawLoop);
  draw();
}

// Start the render loop
if (true) {
  drawLoop();
} else {
  draw();
}
