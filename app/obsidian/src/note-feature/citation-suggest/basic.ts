import type { AttachmentInfo, RegularItemInfo } from "@obzt/database";
import type { EditorSuggestContext, TFile } from "obsidian";
import { Keymap } from "obsidian";
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

  const allAttachments = await plugin.databaseAPI.getAttachments(
    item.itemID,
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
    .getNotes(item.itemID, libId)
    .then((notes) => plugin.noteParser.normalizeNotes(notes));
  const extraByAtch = await getHelperExtraByAtch(
    item,
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
