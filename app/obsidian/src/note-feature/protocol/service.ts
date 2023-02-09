import type { AnnotationsQuery, ItemsQuery } from "@obzt/protocol";
import { parseQuery } from "@obzt/protocol";
import { Service } from "@ophidian/core";
import { Notice } from "obsidian";
import ZoteroPlugin from "@/zt-main";

export class ProtocolHandler extends Service {
  plugin = this.use(ZoteroPlugin);

  onload(): void {
    this.registerEvent(
      this.plugin.server.on("zotero/open", (p) => this.onZtOpen(parseQuery(p))),
    );
    this.registerEvent(
      this.plugin.server.on("zotero/export", (p) =>
        this.onZtExport(parseQuery(p)),
      ),
    );
  }
  async onZtOpen(query: AnnotationsQuery | ItemsQuery) {
    if (query.type === "annotation") {
      new Notice("Not implemented yet");
      return;
    }
    if (query.items.length < 1) {
      new Notice("No items to open");
      return;
    }
    await this.plugin.noteFeatures.openNote(query.items[0]);
  }
  async onZtExport(query: AnnotationsQuery | ItemsQuery) {
    if (query.type === "annotation") {
      new Notice("Not implemented yet");
      return;
    }
    if (query.items.length < 1) {
      new Notice("No items to open");
    } else if (query.items.length > 1) {
      new Notice("Multiple items not yet supported");
    }
    const { libraryID, id } = query.items[0];
    const [docItem] = await this.plugin.databaseAPI.getItems([[id, libraryID]]);
    if (!docItem) {
      new Notice("Item not found: " + id);
      return;
    }
    const notePath = await this.plugin.noteFeatures.createNoteForDocItemFull(
      docItem,
    );
    await this.plugin.app.workspace.openLinkText(notePath, "", false, {
      active: true,
    });
  }
}
