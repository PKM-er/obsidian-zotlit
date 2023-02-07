import type {
  AttachmentInfo,
  AnnotationInfo,
  ItemIDLibID,
} from "@obzt/database";
import { cacheActiveAtch, isFileAttachment } from "@obzt/database";
import { openModal } from "../../components/basic/modal";
import { AttachmentPopupSuggest } from "@/components/atch-suggest.js";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest/popup.js";
import type ZoteroPlugin from "@/zt-main.js";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to open/create literature note" },
  // { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

class NoteQuickSwitch extends ZoteroItemPopupSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
}

export async function openNote(plugin: ZoteroPlugin): Promise<boolean> {
  const result = await openModal(new NoteQuickSwitch(plugin));
  if (!result) return false;
  const {
    value: { item },
  } = result;
  if (await plugin.noteFeatures.openNote(item, true)) return true;
  const { database } = plugin;
  const defaultLibId = database.settings.citationLibrary;
  const allAttachments = await database.api.getAttachments(
    item.itemID,
    defaultLibId,
  );

  let attachment: AttachmentInfo | null = null;
  const fileAttachments = allAttachments.filter(isFileAttachment);
  if (fileAttachments.length > 1) {
    // prompt for attachment selection
    const result = await openModal(new AttachmentPopupSuggest(fileAttachments));
    attachment = result?.value.item ?? null;
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

  const note = await plugin.noteFeatures.createNoteForDocItem(
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
