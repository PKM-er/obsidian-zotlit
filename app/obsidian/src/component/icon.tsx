import { setIcon } from "obsidian";
import { useCallback, useRef } from "react";

export const useIconRef = <E extends HTMLElement = HTMLElement>(
  icon: string,
  size?: number,
) => {
  const ref = useRef<E | null>(null);
  const setRef = useCallback(
    (node: E) => {
      if (ref.current) {
        // Make sure to cleanup any events/references added to the last instance
        ref.current.empty();
      }

      if (node) {
        // Check if a node is actually passed. Otherwise node would be null.
        // You can now do what you need to, addEventListeners, measure, etc.
        setIcon(node, icon, size);
      }

      // Save a reference to the node
      ref.current = node;
    },
    [icon, size],
  );

  return [setRef];
};
