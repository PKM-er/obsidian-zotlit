import Fuse from "fuse.js";
import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  SuggestModal,
} from "obsidian";

import PackManager from "../icon-packs/pack-manager";
import { FuzzyMatch, IconInfo } from "../icon-packs/types";
import IconSC from "../isc-main";
import UnionRanges from "./union";

const CLASS_ID = "isc";

interface SuggesterBase {
  packManager: PackManager;
}
const getSuggestions = (input: string, packManager: PackManager) => {
  if (typeof input === "string" && input.trim().length > 0) {
    return packManager.search(input.replace(/^\+|\+$/g, "").split(/[+]/g));
  } else {
    return packManager.getAllIds();
  }
};
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function renderSuggestion(
  this: SuggesterBase,
  suggestion: FuzzyMatch<IconInfo>,
  el: HTMLElement,
): void {
  const { id, name } = suggestion.item,
    { matches } = suggestion,
    result = this.packManager.getIcon(id);
  if (!result) throw new TypeError("Failed to get icon for key: " + id);

  const icon = result;
  const shortcode = el;
  if (matches) {
    const indices =
      matches.length === 1
        ? matches[0].key === "name"
          ? matches[0].indices
          : []
        : UnionRanges(
            matches.flatMap((m) => (m.key === "name" ? m.indices : [])),
          );
    renderMatches(shortcode, name.replace(/[_-]/g, " "), indices);
  } else {
    shortcode.setText(name.replace(/[_-]/g, " "));
  }
  el.createSpan({ cls: `suggestion-flair` }, (el) =>
    typeof icon === "string" ? (el.textContent = icon) : el.appendChild(icon),
  );
}

export class EmojiSuggesterModal
  extends SuggestModal<FuzzyMatch<IconInfo>>
  implements SuggesterBase
{
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.modalEl.addClass(CLASS_ID);
  }
  get packManager() {
    return this.plugin.packManager;
  }

  getSuggestions(input: string) {
    return getSuggestions(input, this.packManager);
  }
  renderSuggestion = renderSuggestion;

  // Promisify the modal
  resolve: ((value: IconInfo | null) => void) | null = null;
  open(): Promise<IconInfo | null> {
    super.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  onClose() {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  onChooseSuggestion(suggestion: FuzzyMatch<IconInfo>): void {
    // console.log(suggestion);
  }
  selectSuggestion(
    value: FuzzyMatch<IconInfo> | null,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (this.resolve) {
      if (value?.item) {
        this.resolve(value.item);
      } else {
        this.resolve(null);
      }
      this.resolve = null;
    }

    super.selectSuggestion(value as any, evt);
  }
}

export class EmojiSuggester
  extends EditorSuggest<FuzzyMatch<IconInfo>>
  implements SuggesterBase
{
  constructor(public plugin: IconSC) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }

  get packManager() {
    return this.plugin.packManager;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    if (!this.plugin.settings.suggester) return null;
    const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
    const match = sub.match(/(?::|：：)([^:\s]+$)/);
    if (!match) return null;
    const prevSC = (match.input as string)
      .substring(0, match.index)
      .match(/:([^\s:]+$)/);
    if (prevSC && this.packManager.hasIcon(prevSC[1])) return null;
    return {
      end: cursor,
      start: {
        ch: match.index as number,
        line: cursor.line,
      },
      query: match[1],
    };
  }

  getSuggestions(context: EditorSuggestContext) {
    return getSuggestions(context.query, this.packManager);
  }

  renderSuggestion = renderSuggestion;
  selectSuggestion(suggestion: FuzzyMatch<IconInfo>): void {
    if (!this.context) return;
    const { id, pack } = suggestion.item;
    this.context.editor.replaceRange(
      this.plugin.settings.code2emoji && pack === "emoji"
        ? (this.packManager.getIcon(id) as string)
        : `:${id}:` + (this.plugin.settings.spaceAfterSC ? " " : ""),
      this.context.start,
      this.context.end,
    );
  }
}

const renderMatches = (
  el: HTMLElement,
  text: string,
  indices?: readonly Fuse.RangeTuple[],
  offset?: number,
) => {
  if (indices) {
    if (offset === undefined) offset = 0;
    let textIndex = 0;
    for (
      let rangeIndex = 0;
      rangeIndex < indices.length && textIndex < text.length;
      rangeIndex++
    ) {
      let range = indices[rangeIndex],
        start = range[0] + offset,
        end = range[1] + offset + 1; // patch for Fuse.RangeTuple
      if (!(end <= 0)) {
        if (start >= text.length) break;
        if (start < 0) start = 0;
        if (start !== textIndex)
          el.appendText(text.substring(textIndex, start));
        el.createSpan({
          cls: "suggestion-highlight",
          text: text.substring(start, end),
        });
        textIndex = end;
      }
    }
    textIndex < text.length && el.appendText(text.substring(textIndex));
  } else el.appendText(text);
};
