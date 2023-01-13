import type { AttachmentInfo, AnnotationInfo } from "@obzt/database";
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
    const { database } = this.plugin;
    const defaultLibId = database.settings.citationLibrary;
    const allAttachments = await database.api.getAttachments(
      item.itemID,
      defaultLibId,
    );
    let attachment: AttachmentInfo | null = null;
    if (allAttachments.length > 1) {
      // prompt for attachment selection
      attachment =
        (await new AttachmentSelectModal(allAttachments).open())?.value.item ??
        null;
    } else {
      attachment = allAttachments[0] ?? null;
    }

    const annotations: AnnotationInfo[] = attachment
      ? await database.api.getAnnotations(attachment.itemID, defaultLibId)
      : [];

    const tagsRecord = await database.api.getTags(
      [item.itemID, ...annotations.map((i) => i.itemID)],
      defaultLibId,
    );

    const note = await createNote(this.plugin, {
      docItem: item,
      attachment,
      tags: tagsRecord,
      allAttachments,
      annotations,
    });
    await app.workspace.openLinkText(note.path, "", false);
    return true;
  }
}
