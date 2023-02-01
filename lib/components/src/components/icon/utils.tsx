import type React from "react";
import { useCallback, useContext, useRef } from "react";
import { ObsidianContext } from "../obsidian";

/**
 * @see https://github.com/gregberge/react-merge-refs/blob/main/src/index.tsx
 */
export function mergeRefs<T = any>(
  ...refs: React.Ref<T>[]
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}
export const useIconRef = <E extends HTMLElement = HTMLElement>(
  icon: string,
  size?: string | number,
) => {
  const { setIcon } = useContext(ObsidianContext);
  const ref = useRef<E | null>(null);
  const setRef = useCallback(
    (node: E) => {
      if (ref.current) {
        // Make sure to cleanup any events/references added to the last instance
        empty.call(ref.current);
      }

      if (node) {
        // Check if a node is actually passed. Otherwise node would be null.
        // You can now do what you need to, addEventListeners, measure, etc.
        setIcon(node, icon);
        size &&
          node.firstElementChild instanceof SVGSVGElement &&
          node.firstElementChild.style.setProperty(
            "--icon-size",
            typeof size === "number" || !Number.isNaN(Number(size))
              ? `${size}px`
              : size,
          );
      }

      // Save a reference to the node
      ref.current = node;
    },
    [icon, size, setIcon],
  );

  return setRef;
};

function empty(this: Node) {
  for (; this.lastChild; ) this.removeChild(this.lastChild);
}
