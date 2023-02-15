import type { RegularItemInfo } from "@obzt/database";
import type {
  EditorPosition,
  Editor,
  EditorSuggestTriggerInfo,
} from "obsidian";
import { insertCitation, instructions, isShift } from "./basic";
import { ZoteroItemEditorSuggest } from "@/components/item-suggest";
import type { SearchResult } from "@/services/zotero-db/database";
import type ZoteroPlugin from "@/zt-main";

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
    const match = sub.match(/\[@([\w\- ]*)$/);
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
    suggestion: SearchResult,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) return;
    insertCitation(
      { item: suggestion.item, alt: isShift(evt) },
      this.context,
      this.context.editor,
      this.plugin.templateRenderer,
    );
  }
}
