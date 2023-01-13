import { useMemoizedFn } from "ahooks";
import type { RefObject } from "react";
import { useContext } from "react";
import { Obsidian } from "../../context";
import type { AnnotHelperArgsFull } from "./useAnnotHelperArgs";

export const useDragToInsert = (
  containerRef: RefObject<HTMLDivElement>,
  renderArgs: AnnotHelperArgsFull | null,
) => {
  const { plugin } = useContext(Obsidian);

  const onDragStart: React.DragEventHandler<HTMLDivElement> = useMemoizedFn(
    (evt) => {
      if (!renderArgs) {
        evt.dataTransfer.dropEffect = "none";
        return;
      }
      const { imgCacheImporter, templateRenderer } = plugin;
      const textToInsert = templateRenderer.renderAnnot(...renderArgs);
      evt.dataTransfer.setData("text/plain", textToInsert);
      const evtRef = app.workspace.on("editor-drop", (evt) => {
        if (evt.dataTransfer?.getData("text/plain") === textToInsert) {
          imgCacheImporter.flush();
        }
        app.workspace.offref(evtRef);
      });
      window.addEventListener("dragend", () => imgCacheImporter.cancel(), {
        once: true,
      });
      if (containerRef.current) {
        evt.dataTransfer.setDragImage(containerRef.current, 0, 0);
      }
      evt.dataTransfer.dropEffect = "copy";
    },
  );
  return { onDragStart, draggable: Boolean(renderArgs) };
};
