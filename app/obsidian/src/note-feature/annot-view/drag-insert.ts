import type { ObsidianContext } from "@obzt/components";
import type ZoteroPlugin from "../../zt-main";

export const getDragStartHandler =
  (plugin: ZoteroPlugin): ObsidianContext["onDragStart"] =>
  (evt, render, container) => {
    if (!render) {
      evt.dataTransfer.dropEffect = "none";
      return;
    }
    const { imgCacheImporter } = plugin;
    const textToInsert = render();
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
    if (container) {
      evt.dataTransfer.setDragImage(container, 0, 0);
    }
    evt.dataTransfer.dropEffect = "copy";
  };
