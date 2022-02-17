import "./style.less";

import {
  debounce,
  Editor,
  EditorPosition,
  EditorRange,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  SuggestModal,
} from "obsidian";

import NoteTemplate from "../note-template";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import {
  FuzzyMatch,
  getSuggestions,
  renderSuggestion,
  SuggesterBase,
} from "./core";

const CLASS_ID = "zt-citations";

export const insertCitation = (plugin: ZoteroPlugin) => (editor: Editor) =>
  new CitationSuggesterModal(plugin).insertTo(editor);

type ModalResult = { item: RegularItem; alt: boolean };
class CitationSuggesterModal
  extends SuggestModal<FuzzyMatch<RegularItem>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.modalEl.addClass(CLASS_ID);
    this.setInstructions(Instructions);
  }
  get db() {
    return this.plugin.db;
  }

  // @ts-ignore
  getSuggestions(input: string) {
    return getSuggestions(input, this.db);
  }

  initial = true;
  async _updateSuggestions() {
    let input = this.inputEl.value,
      suggestions = await this.getSuggestions(input);
    if (0 !== suggestions.length) {
      let n = this.limit;
      n && n > 0 && (suggestions = suggestions.slice(0, n)),
        (this as any).chooser.setSuggestions(suggestions);
    } else
      input
        ? this.onNoSuggestion()
        : (this as any).chooser.setSuggestions(null);
  }
  debouncedUpdate = debounce(this._updateSuggestions, 250, true);
  updateSuggestions() {
    if (this.initial) {
      this._updateSuggestions();
      this.initial = false;
    } else this.debouncedUpdate();
  }

  renderSuggestion = renderSuggestion.bind(this);

  // Promisify the modal
  resolve: ((value: ModalResult | null) => void) | null = null;
  promise: Promise<ModalResult | null> | null = null;
  open(): Promise<ModalResult | null> {
    super.open();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    return this.promise;
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
  onClose() {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  onChooseSuggestion(): void {
    // console.log(suggestion);
  }
  selectSuggestion(
    value: FuzzyMatch<RegularItem> | null,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (this.resolve) {
      if (value?.item) {
        this.resolve({ item: value.item, alt: isAlternative(evt) });
      } else {
        this.resolve(null);
      }
      this.resolve = null;
    }

    super.selectSuggestion(value as any, evt);
  }
}

export class CitationSuggester
  extends EditorSuggest<FuzzyMatch<RegularItem>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
    this.setInstructions(Instructions);
  }

  get db() {
    return this.plugin.db;
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

  getSuggestions(context: EditorSuggestContext) {
    return getSuggestions(context.query, this.db);
  }

  renderSuggestion = renderSuggestion.bind(this);
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
  { alt, item }: ModalResult,
  range: Record<"start" | "end", EditorPosition> | undefined,
  editor: Editor,
  template: NoteTemplate,
) => {
  const cursor = editor.getCursor();
  range = range ?? { start: cursor, end: cursor };
  const citation = template.render(alt ? "altMdCite" : "mdCite", item);
  editor.replaceRange(citation, range.start, range.end);
  editor.setCursor(editor.posToOffset(range.start) + citation.length);
};

const isAlternative = (evt: KeyboardEvent | MouseEvent) => evt.shiftKey;
const Instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert Markdown citation" },
  { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];
