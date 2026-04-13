import type { AttachmentInfo, RegularItemInfo } from "@obzt/database";
import type { EditorSuggestContext, TFile } from "obsidian";
import { Keymap, Notice } from "obsidian";
import {
  cacheAttachmentSelect,
  chooseAnnotAtch,
} from "@/components/atch-suggest";
import { getAtchIDsOf } from "@/services/note-index/utils";
import type { TemplateRenderer } from "@/services/template";
import { getHelperExtraByAtch } from "../update-note";

export async function insertCitation(
  { alt, item }: { item: RegularItemInfo; alt: boolean },
  {
    start,
    end,
    editor,
    file,
  }: Pick<EditorSuggestContext, "start" | "end" | "editor"> & {
    file: TFile | null;
  },
  template: TemplateRenderer,
) {
  const { plugin } = template;
  const libId = plugin.settings.libId;
  let docItem = item;

  // Search results come from the in-memory index; refresh once if citekey is stale.
  if (!docItem.citekey) {
    const [freshItem] = await plugin.databaseAPI.getItems(
      [[item.itemID, libId]],
      true,
    );
    if (freshItem) {
      docItem = freshItem;
    }
  }

  if (!docItem.citekey) {
    new Notice("Selected item has no citekey/citationKey in Zotero.");
    return;
  }

  const allAttachments = await plugin.databaseAPI.getAttachments(
    docItem.itemID,
    libId,
  );

  const allSelectedAtchIDs = new Set(
    getAtchIDsOf(file, plugin.app.metadataCache),
  );
  const allSelectedAtchs = allAttachments.filter((a) =>
    allSelectedAtchIDs.has(a.itemID),
  );
  // if there is no selected attachment in the note, prompt the user to choose one
  let fallbackAtch: AttachmentInfo | undefined | null;
  if (allSelectedAtchs.length === 0) {
    fallbackAtch = await chooseAnnotAtch(allAttachments, plugin.app);
    if (fallbackAtch) {
      cacheAttachmentSelect(fallbackAtch, item);
      allSelectedAtchs.push(fallbackAtch);
    }
  }

  const notes = await plugin.databaseAPI
    .getNotes(docItem.itemID, libId)
    .then((notes) => plugin.noteParser.normalizeNotes(notes));
  const extraByAtch = await getHelperExtraByAtch(
    docItem,
    { all: allAttachments, selected: allSelectedAtchs, notes },
    template.plugin,
  );

  const citation = template.renderCitations(
    Object.values(extraByAtch),
    { plugin: template.plugin },
    alt,
  );
  editor.replaceRange(citation, start, end);
  editor.setCursor(
    editor.offsetToPos(editor.posToOffset(start) + citation.length),
  );
}

export const isShift = (evt: MouseEvent | KeyboardEvent) =>
  Keymap.isModifier(evt, "Shift");
