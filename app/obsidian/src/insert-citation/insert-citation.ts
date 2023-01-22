import "./style.less";

import type { RegularItemInfo } from "@obzt/database";
import type {
  Editor,
  EditorPosition,
  EditorSuggestTriggerInfo,
} from "obsidian";

import type { FuzzyMatch } from "../suggester/index.js";
import {
  isAlternative,
  ZoteroItemEditorSuggest,
  ZoteroItemSuggestModal,
} from "../suggester/index.js";
import type { TemplateRenderer } from "../template";
import type ZoteroPlugin from "../zt-main.js";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert Markdown citation" },
  { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

export const insertCitation = (plugin: ZoteroPlugin) => (editor: Editor) =>
  new CitationSuggestModal(plugin).insertTo(editor);

class CitationSuggestModal extends ZoteroItemSuggestModal {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
  async insertTo(editor: Editor): Promise<boolean> {
    const result = await (this.promise ?? this.open());
    if (!result) return false;
    insertCitationTo(
      { item: result.value.item, alt: isAlternative(result.evt) },
      undefined,
      editor,
      this.plugin.templateRenderer,
    );
    return true;
  }
}

export class CitationEditorSuggest extends ZoteroItemEditorSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    if (!this.plugin.settings.suggester.citationEditorSuggester) return null;
    const line = editor.getLine(cursor.line),
      sub = line.substring(0, cursor.ch);
    const match = sub.match(/\[@([\w ]*)$/);
    if (!match) return null;
    const end = { ...cursor };
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
    suggestion: FuzzyMatch<RegularItemInfo>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) return;
    const { item } = suggestion;
    insertCitationTo(
      { item, alt: isAlternative(evt) },
      this.context,
      this.context.editor,
      this.plugin.templateRenderer,
    );
  }
}

const insertCitationTo = (
  { alt, item }: { item: RegularItemInfo; alt: boolean },
  range: Record<"start" | "end", EditorPosition> | undefined,
  editor: Editor,
  template: TemplateRenderer,
) => {
  const cursor = editor.getCursor();
  range = range ?? { start: cursor, end: cursor };
  const citation = template.renderCitation(item, alt);
  editor.replaceRange(citation, range.start, range.end);
  editor.setCursor(
    editor.offsetToPos(editor.posToOffset(range.start) + citation.length),
  );
};
