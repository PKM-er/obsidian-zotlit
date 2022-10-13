import type { AttachmentInfo } from "@obzt/database";
import type {
  AnnotationWithTags,
  ItemWithAnnots,
} from "../note-template/const.js";
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

    const attachments = await this.plugin.db.getAttachments(item.itemID);
    let selectedAtch: AttachmentInfo | null = null;
    if (attachments.length > 1) {
      // prompt for attachment selection
      selectedAtch =
        (await new AttachmentSelectModal(attachments).open())?.value.item ??
        null;
    } else {
      selectedAtch = attachments[0] ?? null;
    }

    let annotations: AnnotationWithTags[] = [];
    if (selectedAtch) {
      const attachment = selectedAtch;
      annotations = (
        await this.plugin.db.getAnnotsWithTags(selectedAtch.itemID)
      ).map((a) => {
        const atch = a as AnnotationWithTags;
        atch.attachment = attachment;
        return atch;
      });
    }

    const itemWithAnnots: ItemWithAnnots = {
      ...item,
      attachments,
      selectedAtch,
      annotations,
    };

    const note = await createNote(this.plugin, itemWithAnnots);
    await app.workspace.openLinkText(note.path, "", false);
    return true;
  }
}
