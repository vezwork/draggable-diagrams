/**
 * Converts a DOM element tree to React JSX elements.
 * Useful for converting rendered SVG DOM nodes back to JSX.
 */

import React from "react";
import { Svgx } from "./svgx";
import { assert } from "./utils";

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert DOM attribute name to React prop name
 */
function attrNameToReactProp(attrName: string): string {
  // Special cases
  if (attrName === "class") return "className";
  if (attrName === "for") return "htmlFor";

  // data-* and aria-* attributes stay as-is in React
  if (attrName.startsWith("data-") || attrName.startsWith("aria-")) {
    return attrName;
  }

  // Convert kebab-case to camelCase for all other attributes
  return kebabToCamel(attrName);
}

/**
 * Parse a style string into a React style object
 * e.g., "background-color: red; font-size: 12px" -> { backgroundColor: 'red', fontSize: '12px' }
 */
function parseStyleString(styleStr: string): Record<string, string> {
  const style: Record<string, string> = {};
  const declarations = styleStr.split(";").filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(":");
    if (colonIndex === -1) continue;

    const property = decl.slice(0, colonIndex).trim();
    const value = decl.slice(colonIndex + 1).trim();

    // Convert CSS property to camelCase (background-color -> backgroundColor)
    const camelProperty = kebabToCamel(property);
    style[camelProperty] = value;
  }

  return style;
}

export function domToJsx(element: Element): React.ReactElement {
  const tagName = element.tagName.toLowerCase();

  // Convert attributes
  const props: Record<string, string | Record<string, string>> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    // Special handling for style attribute
    if (attr.name === "style") {
      props.style = parseStyleString(attr.value);
    } else {
      const reactName = attrNameToReactProp(attr.name);
      props[reactName] = attr.value;
    }
  }

  // Convert children
  const children: React.ReactNode[] = [];
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToJsx(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        children.push(text);
      }
    }
  }

  return React.createElement(tagName, props, ...children);
}

/**
 * Parse viewBox attribute string into components
 */
export function parseViewBox(viewBox: string | null): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} | null {
  if (!viewBox) return null;
  const parts = viewBox.trim().split(/\s+/);
  if (parts.length !== 4) return null;
  return {
    minX: parseFloat(parts[0]),
    minY: parseFloat(parts[1]),
    width: parseFloat(parts[2]),
    height: parseFloat(parts[3]),
  };
}

/**
 * Calculate transform to simulate SVG viewBox effect
 */
export function calculateViewBoxTransform(svg: SVGSVGElement): string {
  const width = parseFloat(svg.getAttribute("width") || "0");
  const height = parseFloat(svg.getAttribute("height") || "0");
  const viewBox = parseViewBox(svg.getAttribute("viewBox"));

  if (!viewBox || !width || !height) {
    return "";
  }

  const scaleX = width / viewBox.width;
  const scaleY = height / viewBox.height;
  const translateX = -viewBox.minX;
  const translateY = -viewBox.minY;

  // Apply translate first, then scale
  return `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`;
}

/**
 * Extracts the contents of the SVG element from a container div and converts children to JSX.
 * Returns a <g> element with a transform that accounts for the original SVG's viewBox.
 */
export function extractSvgContentsAsJsx(container: HTMLElement): Svgx {
  const svg = container.querySelector("svg");
  assert(!!svg, "No SVG element found in container");

  // Calculate transform to simulate viewBox effect
  const transform = calculateViewBoxTransform(svg);

  // Convert children
  const children: React.ReactNode[] = [];
  for (let i = 0; i < svg.childNodes.length; i++) {
    const child = svg.childNodes[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToJsx(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        children.push(text);
      }
    }
  }

  // Return <g> with transform
  return React.createElement("g", transform ? { transform } : {}, ...children);
}
