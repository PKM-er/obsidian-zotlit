import type {
  EditorPosition,
  Editor,
  EditorSuggestTriggerInfo,
} from "obsidian";
import { ZoteroItemEditorSuggest } from "@/components/item-suggest";
import type { SearchResult } from "@/services/zotero-db/database";
import type ZoteroPlugin from "@/zt-main";
import { insertCitation } from "./basic";

export const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert primary Markdown citation" },
  { command: "↵ (end with /)", purpose: "Insert secondary Markdown citation" },
];

interface EditorPositionWithAlt extends EditorPosition {
  alt?: boolean;
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
    if (!this.plugin.settings.current?.citationEditorSuggester) return null;
    const line = editor.getLine(cursor.line),
      sub = line.substring(0, cursor.ch);
    const match = sub.match(/\[@([\w\- ]*)\/?$/);
    if (!match) return null;
    const end = { ...cursor };
    // if `]` is next to cursor (auto-complete), include it to replace range as well
    if (line[cursor.ch] === "]") end.ch += 1;
    return {
      end,
      start: {
        ch: match.index as number,
        line: cursor.line,
        alt: Boolean(match[0]?.endsWith("/")),
      } as EditorPositionWithAlt,
      query: match[1],
    };
  }

  selectSuggestion(
    suggestion: SearchResult,
    // evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) return;
    insertCitation(
      {
        item: suggestion.item,
        alt: (this.context.start as EditorPositionWithAlt).alt ?? false,
      },
      this.context,
      this.plugin.templateRenderer,
    );
  }
}
