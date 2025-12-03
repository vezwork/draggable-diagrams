import { cloneElement } from "react";
import { Svgx, updateElement } from ".";
import { assert } from "../utils";

export type HoistedSvgx = Map<string, Svgx>;

const accumulatedTransformProp = "data-accumulated-transform";

/**
 * Step 1: Walks the SVG tree and adds data-accumulated-transform to all elements.
 * Accumulates transform attributes from parent <g> nodes.
 */
export function accumulateTransforms(element: Svgx): Svgx {
  return walkAndAccumulateTransforms(element, "");
}

function walkAndAccumulateTransforms(
  element: Svgx,
  accumulatedTransform: string
): Svgx {
  const props = element.props as any;
  const elementTransform = props.transform || "";
  const newAccumulatedTransform = combineTransforms(
    accumulatedTransform,
    elementTransform
  );

  return updateElement(
    element,
    (child) => walkAndAccumulateTransforms(child, newAccumulatedTransform),
    {
      [accumulatedTransformProp as any]: newAccumulatedTransform || undefined,
    }
  );
}

/**
 * Step 2: Partially flattens an SVG tree by pulling nodes with IDs
 * to the top level. Reads data-accumulated-transform and sets it as
 * transform for extracted nodes. Returns a map of elements keyed by
 * their id.
 * - Key "" contains the root with extracted nodes removed (or is not
 *   set if root has an ID)
 * - Extracted nodes are removed from their parents
 * - Recurses into nodes with IDs to find deeper IDs
 */
export function hoistSvg(element: Svgx): HoistedSvgx {
  const result: HoistedSvgx = new Map();
  const rootWithExtractedRemoved = extractIdNodes(element, result);
  if (rootWithExtractedRemoved) {
    result.set("", rootWithExtractedRemoved);
  }
  return result;
}

/**
 * Recursively extracts nodes with IDs into hoistedSvg map. Returns
 * the element with extracted children removed (or null if this
 * element itself has an ID and is extracted).
 */
function extractIdNodes(element: Svgx, hoistedSvg: HoistedSvgx): Svgx | null {
  const props = element.props as any;

  // Validate: data-z-index can only be set on nodes with ids
  if (props["data-z-index"] !== undefined && !props.id) {
    throw new Error(
      `data-z-index can only be set on elements with an id attribute. Found data-z-index="${props["data-z-index"]}" on <${element.type}> without id.`
    );
  }

  const newElement = updateElement(element, (child) =>
    extractIdNodes(child, hoistedSvg)
  );

  if (props.id) {
    assert(
      !hoistedSvg.has(props.id),
      `Duplicate id "${props.id}" found in SVG tree. Each element must have a unique id.`
    );

    const accumulatedTransform = props[accumulatedTransformProp];
    const elementToHoist = cloneElement(newElement, {
      transform: accumulatedTransform || undefined,
    });

    hoistedSvg.set(props.id, elementToHoist);
    return null;
  } else {
    return newElement;
  }
}

export function getAccumulatedTransform(element: Svgx): string | undefined {
  const props = element.props as any;
  return props[accumulatedTransformProp];
}

function combineTransforms(t1: string, t2: string): string {
  if (!t1 && !t2) return "";
  if (!t1) return t2;
  if (!t2) return t1;
  return t1 + " " + t2;
}
