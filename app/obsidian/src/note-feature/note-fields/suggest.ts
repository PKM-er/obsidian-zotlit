import { use } from "@ophidian/core";
import * as Eta from "eta";
import type {
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  SearchResult,
  TFile,
} from "obsidian";
import { prepareFuzzySearch, EditorSuggest } from "obsidian";
import { NoteFieldsSettings } from "./settings";
import log from "@/log";
import { isLiteratureNote } from "@/services/note-index";
import ZoteroPlugin from "@/zt-main";
// >:noteFields
const pattern = /^\s*>\s*:(\w*)$/;

interface Result extends SearchResult {
  field: string;
  query: string;
}

export class NoteFieldsSuggest extends EditorSuggest<Result> {
  use = use.this;
  settings = this.use(NoteFieldsSettings);
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null,
  ): EditorSuggestTriggerInfo | null {
    if (
      !this.settings.noteFieldsSuggester ||
      !this.settings.noteFields.size ||
      !file ||
      !isLiteratureNote(file)
    )
      return null;

    const start = { line: cursor.line, ch: 0 },
      beforeCursor = editor.getRange(start, cursor);

    if (!pattern.test(beforeCursor)) return null;
    const [, keyword] = beforeCursor.match(pattern)!;

    return {
      start,
      end: cursor,
      query: keyword,
    };
  }

  getSuggestions(context: EditorSuggestContext): Result[] {
    const { query } = context;
    const { noteFields } = this.settings;
    if (!query)
      return [...noteFields.keys()].map((field) => ({
        field,
        matches: [],
        score: 0,
        query: field,
      }));
    const search = prepareFuzzySearch(query);
    const searchResults = [...noteFields.entries()].flatMap(([field, v]) => {
      // if no search keyword specified, fallback to field name
      const query = v.keyword ? v.keyword : field;
      const result = search(query);
      if (!result) return [];
      return [{ field, query, ...result }];
    });
    return searchResults.sort((a, b) => b.score - a.score);
  }
  selectSuggestion({ field }: Result, _evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      log.error(
        "No context available in NoteFieldsSuggest when selecting suggestion",
      );
      return;
    }
    const { noteFields } = this.settings;
    const { start, end, editor } = this.context;
    const template = noteFields.get(field)?.template;
    if (!template) {
      log.error("No template found for field", field);
      return;
    }
    const toInsert = Eta.render(template, { field }) as string;
    editor.replaceRange(toInsert, start, end);
  }
  renderSuggestion({ query, matches }: Result, el: HTMLElement): void {
    let offset = 0;
    for (const [start, end] of matches) {
      if (offset < start) {
        el.appendText(query.slice(offset, start));
      }
      el.createSpan({
        text: query.slice(start, end),
        cls: "suggestion-highlight",
      });
      offset = end;
    }
    if (offset < query.length) {
      el.appendText(query.slice(offset));
    }
  }
}

use.def(NoteFieldsSuggest, () => new NoteFieldsSuggest(use(ZoteroPlugin).app));
