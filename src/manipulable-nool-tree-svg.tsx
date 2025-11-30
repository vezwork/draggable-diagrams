import _ from "lodash";
import { DragSpec, straightTo } from "./DragSpec";
import { SvgElem } from "./jsx-flatten";
import { ManipulableSvg, translate } from "./manipulable-svg";
import { insertImm, removeImm, setImm } from "./utils";

type NoolTree = {
  id: string;
  label: string;
  children: NoolTree[];
};

function isOp(node: NoolTree): boolean {
  return node.label === "+" || node.label === "×";
}

function isBinaryOp(node: NoolTree): boolean {
  return isOp(node) && node.children.length === 2;
}

type NoolTreeConfig = {
  commutativity: boolean;
  pullUpOp: boolean;
  pullDownOp: boolean;
  pullUpTail: boolean;
  pullDownTail: boolean;
};

const defaultConfig: NoolTreeConfig = {
  commutativity: true,
  pullUpOp: false,
  pullDownOp: false,
  pullUpTail: true,
  pullDownTail: true,
};

export const manipulableNoolTreeSvg: ManipulableSvg<NoolTree> = ({
  state,
  draggable,
}) => {
  return renderNoolTree(state, state, draggable, defaultConfig).element;
};

function renderNoolTree(
  rootState: NoolTree,
  tree: NoolTree,
  draggable: any,
  config: NoolTreeConfig,
): {
  element: SvgElem;
  w: number;
  h: number;
  id: string;
} {
  const GAP = 10;
  const PADDING = 5;
  const LABEL_WIDTH = 20;
  const LABEL_MIN_HEIGHT = 20;

  const renderedChildren = tree.children.map((child) =>
    renderNoolTree(rootState, child, draggable, config),
  );

  const renderedChildrenElements: SvgElem[] = [];
  let childY = 0;
  for (const childR of renderedChildren) {
    renderedChildrenElements.push(
      <g transform={translate(0, childY)}>{childR.element}</g>,
    );
    childY += childR.h + GAP;
  }

  const innerW =
    LABEL_WIDTH +
    (renderedChildren.length > 0
      ? GAP + _.max(renderedChildren.map((c) => c.w))!
      : 0);
  const innerH =
    renderedChildren.length > 0
      ? _.sumBy(renderedChildren, (c) => c.h) +
        GAP * (renderedChildren.length - 1)
      : LABEL_MIN_HEIGHT;

  const element = (
    <g id={tree.id}>
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={innerW + PADDING * 2}
        height={innerH + PADDING * 2}
        stroke="gray"
        strokeWidth={1}
        fill="none"
      />
      {/* Label - draggable text */}
      {draggable(
        <text
          x={PADDING + LABEL_WIDTH / 2}
          y={PADDING + innerH / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={20}
          fill="black"
        >
          {tree.label}
        </text>,
        () => dragTargets(rootState, tree.id, config),
      )}
      {/* Children */}
      {renderedChildren.length > 0 && (
        <g transform={translate(PADDING + LABEL_WIDTH + GAP, PADDING)}>
          {renderedChildrenElements}
        </g>
      )}
    </g>
  );

  return {
    element,
    w: innerW + PADDING * 2,
    h: innerH + PADDING * 2,
    id: tree.id,
  };
}

function dragTargets(
  rootState: NoolTree,
  draggedKey: string,
  config: NoolTreeConfig,
): DragSpec<NoolTree> {
  function walk(
    currentTree: NoolTree,
    replaceNode: (newNode: NoolTree) => void,
  ) {
    // commutativity
    if (config.commutativity && isOp(currentTree)) {
      const childIdx = currentTree.children.findIndex(
        (c) => c.id === draggedKey,
      );
      if (childIdx !== -1) {
        const dragged = currentTree.children[childIdx];
        const childrenWithoutDragged = removeImm(
          currentTree.children,
          childIdx,
        );
        _.range(0, childrenWithoutDragged.length + 1).forEach((insertIdx) => {
          if (insertIdx === childIdx) return;
          replaceNode({
            ...currentTree,
            children: insertImm(childrenWithoutDragged, insertIdx, dragged),
          });
        });
      }
    }

    // pull up op to associate
    if (config.pullUpOp && isBinaryOp(currentTree)) {
      const childIdx = currentTree.children.findIndex(
        (c) => c.id === draggedKey,
      );
      if (childIdx !== -1) {
        const dragged = currentTree.children[childIdx];
        if (dragged.label === currentTree.label && isBinaryOp(dragged)) {
          if (childIdx === 0) {
            replaceNode({
              ...dragged,
              children: [
                dragged.children[0],
                {
                  ...currentTree,
                  children: [dragged.children[1], currentTree.children[1]],
                },
              ],
            });
          } else {
            replaceNode({
              ...dragged,
              children: [
                {
                  ...currentTree,
                  children: [currentTree.children[0], dragged.children[0]],
                },
                dragged.children[1],
              ],
            });
          }
        }
      }
    }

    // pull down op to associate
    if (
      config.pullDownOp &&
      currentTree.id === draggedKey &&
      isBinaryOp(currentTree)
    ) {
      const child0 = currentTree.children[0];
      if (isBinaryOp(child0) && child0.label === currentTree.label) {
        replaceNode({
          ...child0,
          children: [
            child0.children[0],
            {
              ...currentTree,
              children: [child0.children[1], currentTree.children[1]],
            },
          ],
        });
      }
      const child1 = currentTree.children[1];
      if (isBinaryOp(child1) && child1.label === currentTree.label) {
        replaceNode({
          ...child1,
          children: [
            {
              ...currentTree,
              children: [currentTree.children[0], child1.children[0]],
            },
            child1.children[1],
          ],
        });
      }
    }

    // pull up "tail" to associate
    if (config.pullUpTail && isBinaryOp(currentTree)) {
      const child0 = currentTree.children[0];
      if (isBinaryOp(child0) && child0.label === currentTree.label) {
        const grandchild0 = child0.children[0];
        if (grandchild0.id === draggedKey) {
          replaceNode({
            ...child0,
            children: [
              grandchild0,
              {
                ...currentTree,
                children: [child0.children[1], currentTree.children[1]],
              },
            ],
          });
        }
      }
      const child1 = currentTree.children[1];
      if (isBinaryOp(child1) && child1.label === currentTree.label) {
        const grandchild1 = child1.children[1];
        if (grandchild1.id === draggedKey) {
          replaceNode({
            ...child1,
            children: [
              {
                ...currentTree,
                children: [currentTree.children[0], child1.children[0]],
              },
              grandchild1,
            ],
          });
        }
      }
    }

    // pull down "tail" to associate
    if (config.pullDownTail && isBinaryOp(currentTree)) {
      const [child0, child1] = currentTree.children;
      if (
        isBinaryOp(child0) &&
        child0.label === currentTree.label &&
        child1.id === draggedKey
      ) {
        replaceNode({
          ...child0,
          children: [
            child0.children[0],
            {
              ...currentTree,
              children: [child0.children[1], child1],
            },
          ],
        });
      }
      if (
        isBinaryOp(child1) &&
        child1.label === currentTree.label &&
        child0.id === draggedKey
      ) {
        replaceNode({
          ...child1,
          children: [
            {
              ...currentTree,
              children: [child0, child1.children[0]],
            },
            child1.children[1],
          ],
        });
      }
    }

    // recurse
    currentTree.children.forEach((child, childIdx) =>
      walk(child, (newChild) =>
        replaceNode({
          ...currentTree,
          children: setImm(currentTree.children, childIdx, newChild),
        }),
      ),
    );
  }

  const spec: DragSpec<NoolTree> = [];
  walk(rootState, (newTree) => {
    spec.push(straightTo(newTree));
  });
  return spec;
}

export const stateNoolTree1: NoolTree = {
  id: "root",
  label: "+",
  children: [
    {
      id: "root-1",
      label: "+",
      children: [
        {
          id: "root-1-1",
          label: "+",
          children: [
            { id: "root-1-1-1", label: "⛅", children: [] },
            {
              id: "root-1-1-2",
              label: "-",
              children: [{ id: "root-1-1-2-1", label: "🍄", children: [] }],
            },
          ],
        },
        { id: "root-1-2", label: "🍄", children: [] },
      ],
    },
    {
      id: "root-2",
      label: "+",
      children: [
        {
          id: "root-2-1",
          label: "×",
          children: [
            { id: "root-2-1-1", label: "🎲", children: [] },
            { id: "root-2-1-2", label: "🦠", children: [] },
          ],
        },
        {
          id: "root-2-2",
          label: "×",
          children: [
            { id: "root-2-2-1", label: "🎲", children: [] },
            { id: "root-2-2-2", label: "🐝", children: [] },
          ],
        },
      ],
    },
  ],
};

export const stateNoolTree2: NoolTree = {
  id: "+1",
  label: "+",
  children: [
    {
      id: "+2",
      label: "+",
      children: [
        { id: "A", label: "A", children: [] },
        { id: "B", label: "B", children: [] },
      ],
    },
    {
      id: "+3",
      label: "+",
      children: [
        { id: "C", label: "C", children: [] },
        { id: "D", label: "D", children: [] },
      ],
    },
  ],
};
