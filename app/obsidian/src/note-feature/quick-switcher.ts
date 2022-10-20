import type { AttachmentInfo } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { ZoteroItemSuggestModal } from "../suggester/index.js";
import type ZoteroPlugin from "../zt-main.js";
import { AttachmentSelectModal } from "./atch-select.js";
import { createNote, openNote } from "./open-create.js";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to open/create literature note" },
  // { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

export class CitationSuggestModal extends ZoteroItemSuggestModal {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
  async goToNote(): Promise<boolean> {
    const result = await (this.promise ?? this.open());
    if (!result) return false;
    const { item } = result.value;
    if (await openNote(this.plugin, item, true)) return true;

    const allAttachments = await this.plugin.db.getAttachments(item.itemID);
    let attachment: AttachmentInfo | null = null;
    if (allAttachments.length > 1) {
      // prompt for attachment selection
      attachment =
        (await new AttachmentSelectModal(allAttachments).open())?.value.item ??
        null;
    } else {
      attachment = allAttachments[0] ?? null;
    }

    const annotations: Annotation[] = attachment
      ? await this.plugin.db.getAnnotations(attachment.itemID)
      : [];

    const tagsRecord = await this.plugin.db.getTags([
      item.itemID,
      ...annotations.map((i) => i.itemID),
    ]);

    const note = await createNote(this.plugin, item, {
      attachment,
      tags: tagsRecord[item.itemID],
      allAttachments,
      annotations: annotations.map((a) => [
        a,
        { attachment, tags: tagsRecord[a.itemID] },
      ]),
    });
    await app.workspace.openLinkText(note.path, "", false);
    return true;
  }
}
