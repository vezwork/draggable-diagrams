import React from "react";

/**
 * Walks a JSX tree and assigns paths to every element using data-path.
 * - Root gets "/"
 * - By default uses numerical indices for children (0, 1, 2, ...)
 * - If id is present, uses that as the absolute path
 * - Paths are stored as strings in data-path
 */
export function assignPaths(element: React.ReactElement): React.ReactElement {
  return assignPathsRecursive(element, "/");
}

function assignPathsRecursive(
  element: React.ReactElement,
  currentPath: string,
): React.ReactElement {
  // Check if this element has an id
  const props = element.props as any;
  const id = props.id;
  const elementPath: string = id ? id + "/" : currentPath;

  // Process children
  const children = React.Children.toArray(props.children);
  const newChildren = children.map((child, index) => {
    if (React.isValidElement(child)) {
      const childPath = elementPath + String(index) + "/";
      return assignPathsRecursive(child, childPath);
    }
    return child;
  });

  return React.cloneElement(
    element,
    {
      ...props,
      "data-path": elementPath,
    } as any,
    ...newChildren,
  );
}
