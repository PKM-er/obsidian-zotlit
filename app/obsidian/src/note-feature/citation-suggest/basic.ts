import type { AttachmentInfo, RegularItemInfo } from "@obzt/database";
import type { EditorSuggestContext, TFile } from "obsidian";
import { Keymap } from "obsidian";
import {
  cacheAttachmentSelect,
  choosePDFAtch,
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
  const libId = plugin.database.settings.citationLibrary;

  const allAttachments = await plugin.databaseAPI.getAttachments(
    item.itemID,
    libId,
  );

  const allSelectedAtchIDs = new Set(getAtchIDsOf(file));
  const allSelectedAtchs = allAttachments.filter((a) =>
    allSelectedAtchIDs.has(a.itemID),
  );
  // if there is no selected attachment in the note, prompt the user to choose one
  let fallbackAtch: AttachmentInfo | undefined | null;
  if (allSelectedAtchs.length === 0) {
    fallbackAtch = await choosePDFAtch(allAttachments);
    if (fallbackAtch) {
      cacheAttachmentSelect(fallbackAtch, item);
      allSelectedAtchs.push(fallbackAtch);
    }
  }

  const extraByAtch = await getHelperExtraByAtch(
    item,
    { all: allAttachments, selected: allSelectedAtchs },
    template.plugin,
  );

  const citation = template.renderCitation(
    Object.values(extraByAtch)[0],
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
