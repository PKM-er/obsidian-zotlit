import type { AnnotationInfo, ItemIDLibID } from "@obzt/database";
import { cacheActiveAtch } from "@obzt/database";
import { openModal } from "../../components/basic/modal";
import { chooseFileAtch } from "@/components/atch-suggest.js";
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

  const libId = plugin.database.settings.citationLibrary;
  const allAttachments = await plugin.databaseAPI.getAttachments(
    item.itemID,
    libId,
  );

  const attachment = await chooseFileAtch(allAttachments);
  if (attachment) {
    cacheActiveAtch(window.localStorage, item, attachment.itemID);
  }

  const annotations: AnnotationInfo[] = attachment
    ? await plugin.databaseAPI.getAnnotations(attachment.itemID, libId)
    : [];

  const tagsRecord = await plugin.databaseAPI.getTags([
    [item.itemID, libId],
    ...annotations.map((i): ItemIDLibID => [i.itemID, libId]),
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
