import "./style.less";

import { Editor, EditorPosition, EditorSuggestTriggerInfo } from "obsidian";

import NoteTemplate from "../note-template";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import { FuzzyMatch, isAlternative } from "./core";
import ZoteroItemSuggester from "./editor-suggest";
import ZoteroItemSelector from "./modal";

const Instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert Markdown citation" },
  { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

export const insertCitation = (plugin: ZoteroPlugin) => (editor: Editor) =>
  new CitationSuggesterModal(plugin).insertTo(editor);

class CitationSuggesterModal extends ZoteroItemSelector {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(Instructions);
  }
  async insertTo(editor: Editor): Promise<boolean> {
    const result = await (this.promise ?? this.open());
    if (!result) return false;
    insertCitationTo(
      result,
      undefined,
      editor,
      this.plugin.settings.literatureNoteTemplate,
    );
    return true;
  }
}

export class CitationSuggester extends ZoteroItemSuggester {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(Instructions);
  }
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    if (!this.plugin.settings.citationEditorSuggester) return null;
    const line = editor.getLine(cursor.line),
      sub = line.substring(0, cursor.ch);
    const match = sub.match(/(?:\[@)([\w ]*)$/);
    if (!match) return null;
    let end = { ...cursor };
    // if `]` is next to cursor (auto-complete), include it to replace range as well
    if (line[cursor.ch] === "]") end.ch += 1;
    return {
      end,
      start: {
        ch: match.index as number,
        line: cursor.line,
      },
      query: match[1],
    };
  }

  selectSuggestion(
    suggestion: FuzzyMatch<RegularItem>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) return;
    const { item } = suggestion;
    insertCitationTo(
      { item, alt: isAlternative(evt) },
      this.context,
      this.context.editor,
      this.plugin.settings.literatureNoteTemplate,
    );
  }
}

const insertCitationTo = (
  { alt, item }: { item: RegularItem; alt: boolean },
  range: Record<"start" | "end", EditorPosition> | undefined,
  editor: Editor,
  template: NoteTemplate,
) => {
  const cursor = editor.getCursor();
  range = range ?? { start: cursor, end: cursor };
  const citation = template.render(alt ? "altMdCite" : "mdCite", item);
  editor.replaceRange(citation, range.start, range.end);
  editor.setCursor(
    editor.offsetToPos(editor.posToOffset(range.start) + citation.length),
  );
};
