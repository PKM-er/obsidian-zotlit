export const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert Markdown citation" },
  { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

import type { RegularItemInfo } from "@obzt/database";
import type { Editor, EditorPosition } from "obsidian";
import { Keymap } from "obsidian";
import type { TemplateRenderer } from "@/services/template";

export const insertCitation = (
  { alt, item }: { item: RegularItemInfo; alt: boolean },
  range: Record<"start" | "end", EditorPosition> | undefined,
  editor: Editor,
  template: TemplateRenderer,
) => {
  if (!range) {
    const cursor = editor.getCursor();
    range = { start: cursor, end: cursor };
  }
  const citation = template.renderCitation(item, alt);
  editor.replaceRange(citation, range.start, range.end);
  editor.setCursor(
    editor.offsetToPos(editor.posToOffset(range.start) + citation.length),
  );
};

export const isShift = (evt: MouseEvent | KeyboardEvent) =>
  Keymap.isModifier(evt, "Shift");
