import { D } from "@mobily/ts-belt";
import type { AnnotsViewContextType, AnnotsViewStore } from "@obzt/components";
import type ZoteroPlugin from "@/zt-main";

export const getDragStartHandler =
  (plugin: ZoteroPlugin): AnnotsViewContextType["onDragStart"] =>
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

    const onEditorDrop = (evt: DragEvent) => {
      // check if drop event is triggered by this drag start event
      if (evt.dataTransfer?.getData(sourceTag) === timeStamp) {
        imgCacheImporter.flush();
      }
      app.workspace.off("editor-drop", onEditorDrop);
      window.removeEventListener("dragend", onDragEnd);
    };
    const onDragEnd = () => {
      imgCacheImporter.cancel();
      app.workspace.off("editor-drop", onEditorDrop);
    };

    const evtRef = app.workspace.on("editor-drop", (evt) => {
      if (evt.dataTransfer?.getData("drag-source") === timeStamp) {
        imgCacheImporter.flush();
      }
      app.workspace.offref(evtRef);
    });
    window.addEventListener("dragend", onDragEnd, { once: true });
    if (container) {
      evt.dataTransfer.setDragImage(container, 0, 0);
    }
  };

export type AnnotRendererProps = Pick<
  AnnotsViewStore,
  "doc" | "attachment" | "allAttachments" | "tags" | "annotations"
>;

export const getAnnotRenderer = (
  plugin: ZoteroPlugin,
): AnnotsViewContextType<AnnotRendererProps>["annotRenderer"] => ({
  storeSelector: (state) =>
    D.selectKeys(state, [
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

    return () =>
      plugin.templateRenderer.renderAnnot(
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
          sourcePath: doc.sourcePath,
        },
      );
  },
});
