import type {
  AttachmentInfo,
  AnnotationInfo,
  ItemIDLibID,
} from "@obzt/database";
import { cacheActiveAtch, isFileAttachment } from "@obzt/database";
import { AttachmentSelectModal } from "./atch-select.js";
import { ZoteroItemSuggestModal } from "@/components/suggester/index.js";
import type ZoteroPlugin from "@/zt-main.js";

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
    if (await this.plugin.noteFeatures.openNote(item, true)) return true;
    const { database } = this.plugin;
    const defaultLibId = database.settings.citationLibrary;
    const allAttachments = await database.api.getAttachments(
      item.itemID,
      defaultLibId,
    );
    let attachment: AttachmentInfo | null = null;
    const fileAttachments = allAttachments.filter(isFileAttachment);
    if (fileAttachments.length > 1) {
      // prompt for attachment selection
      attachment =
        (await new AttachmentSelectModal(fileAttachments).open())?.value.item ??
        null;
    } else {
      attachment = fileAttachments[0] ?? null;
    }

    if (attachment) {
      cacheActiveAtch(window.localStorage, item, attachment.itemID);
    }

    const annotations: AnnotationInfo[] = attachment
      ? await database.api.getAnnotations(attachment.itemID, defaultLibId)
      : [];

    const tagsRecord = await database.api.getTags([
      [item.itemID, defaultLibId],
      ...annotations.map((i): ItemIDLibID => [i.itemID, defaultLibId]),
    ]);

    const note = await this.plugin.noteFeatures.createNoteForDocItem(
      item,
      (template, ctx) =>
        template.renderNote(
          {
            docItem: item,
            attachment,
            tags: tagsRecord,
            allAttachments,
            annotations,
          },
          ctx,
        ),
    );
    await app.workspace.openLinkText(note.path, "", false);
    return true;
  }
}
