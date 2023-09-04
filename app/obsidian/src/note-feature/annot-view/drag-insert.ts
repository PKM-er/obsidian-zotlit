import { selectKeys } from "@mobily/ts-belt/Dict";
import type { AnnotViewContextType } from "@obzt/components";
import { isMarkdownFile } from "@/utils";
import type ZoteroPlugin from "@/zt-main";
import type { AnnotViewStoreValues } from "./store";

export const getDragStartHandler =
  (plugin: ZoteroPlugin): AnnotViewContextType["onDragStart"] =>
  (evt, render, container) => {
    // if (!render) {
    //   evt.dataTransfer.dropEffect = "none";
    //   return;
    // }
    const { imgCacheImporter } = plugin;

    const timeStamp = String(evt.timeStamp);
    const sourceTag = "drag-source";
    evt.dataTransfer.setData("text/plain", render());
    evt.dataTransfer.setData(sourceTag, timeStamp);
    evt.dataTransfer.dropEffect = "copy";

    const window = (evt.target as HTMLElement).win;
    const { workspace } = plugin.app;

    const onEditorDrop = (evt: DragEvent) => {
      // check if drop event is triggered by this drag start event
      if (evt.dataTransfer?.getData(sourceTag) === timeStamp) {
        imgCacheImporter.flush();
      }
      workspace.off("editor-drop", onEditorDrop);
      window.removeEventListener("dragend", onDragEnd);
    };
    const onDragEnd = () => {
      imgCacheImporter.cancel();
      workspace.off("editor-drop", onEditorDrop);
    };

    const evtRef = workspace.on("editor-drop", (evt) => {
      if (evt.dataTransfer?.getData("drag-source") === timeStamp) {
        imgCacheImporter.flush();
      }
      workspace.offref(evtRef);
    });
    window.addEventListener("dragend", onDragEnd, { once: true });
    if (container) {
      evt.dataTransfer.setDragImage(container, 0, 0);
    }
  };

export type AnnotRendererProps = Pick<
  AnnotViewStoreValues,
  "doc" | "attachment" | "allAttachments" | "tags" | "annotations"
>;

export const getAnnotRenderer = (
  plugin: ZoteroPlugin,
): AnnotViewContextType<AnnotRendererProps>["annotRenderer"] => ({
  storeSelector: (state) =>
    selectKeys(state, [
      "doc",
      "attachment",
      "allAttachments",
      "tags",
      "annotations",
    ]),
  get: (annotation, { allAttachments, attachment, doc, tags, annotations }) => {
    if (
      !allAttachments ||
      !attachment ||
      !doc ||
      !tags[annotation.itemID] ||
      !annotations
    )
      return null;

    return () => {
      const activeFile = plugin.app.workspace.getActiveFile();
      const sourcePath =
        activeFile && isMarkdownFile(activeFile) ? activeFile.path : null;
      return plugin.templateRenderer.renderAnnot(
        annotation,
        {
          tags,
          attachment,
          allAttachments,
          annotations,
          docItem: doc.docItem,
        },
        {
          plugin,
          sourcePath,
          // disable merge, already handled in store
          merge: false,
        },
      );
    };
  },
});
