import { useMemoizedFn } from "ahooks";
import type { RefObject } from "react";
import { useContext } from "react";
import { Obsidian } from "../../context";

export const useDragToInsert = (
  containerRef: RefObject<HTMLDivElement>,
  render: (() => string) | null,
) => {
  const { onDragStart } = useContext(Obsidian);

  return {
    draggable: Boolean(render),
    onDragStart: useMemoizedFn((evt) => {
      onDragStart(evt, render, containerRef.current);
    }),
  };
};
