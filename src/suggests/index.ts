import "./style.less";

import Fuse from "fuse.js";
import {
  debounce,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  SuggestModal,
} from "obsidian";

import ZoteroDb from "../zotero-db";
import {
  Creator,
  isFullName,
  JournalArticleItem,
  RegularItem,
} from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import UnionRanges from "./union";

const CLASS_ID = "zt-citations";
type FuzzyMatch<T> = Fuse.FuseResult<T>;

const PRIMARY_MATCH_FIELD = "title";

interface SuggesterBase {
  db: ZoteroDb;
}
const getSuggestions = (
  input: string,
  db: ZoteroDb,
): Fuse.FuseResult<RegularItem>[] => {
  if (!db.fuse) return [];
  if (typeof input === "string" && input.trim().length > 0) {
    return db.search(
      input.replace(/^\+|\+$/g, "").split(/[+]/g),
      PRIMARY_MATCH_FIELD,
      50,
    );
  } else {
    return db.getAll(50);
  }
};
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function renderSuggestion(
  this: SuggesterBase,
  suggestion: FuzzyMatch<RegularItem>,
  el: HTMLElement,
): void {
  const item = suggestion.item as JournalArticleItem;
  const title = item[PRIMARY_MATCH_FIELD],
    { matches } = suggestion;

  const titleEl = el.createDiv({ cls: "title" });
  if (!title) {
    titleEl.setText("Title missing");
  } else if (matches) {
    const indices =
      matches.length === 1
        ? matches[0].key === PRIMARY_MATCH_FIELD
          ? matches[0].indices
          : []
        : UnionRanges(
            matches.flatMap((m) =>
              m.key === PRIMARY_MATCH_FIELD ? m.indices : [],
            ),
          );
    renderMatches(titleEl, title, indices);
  } else {
    titleEl.setText(title);
  }
  el.append(getArticleMeta(item));
}

const getArticleMeta = (item: JournalArticleItem) => {
  const { creators, date, publicationTitle, volume, issue, pages } = item;
  const meta = {
    creators: creatorToString(creators),
    date,
    publication: publicationTitle,
    volume,
    issue,
    pages,
  };
  const newSpan = (to: HTMLElement, key: keyof typeof meta, cls?: string) =>
    meta[key] && to.createSpan({ cls: cls ?? key, text: meta[key] });
  return createDiv({ cls: "meta" }, (main) => {
    if (meta.creators || meta.date)
      main.createSpan({ cls: "author-year" }, (ay) => {
        newSpan(ay, "creators");
        newSpan(ay, "date");
      });

    newSpan(main, "publication");
    if (meta.volume || meta.issue)
      main.createSpan({ cls: "vol-issue" }, (vi) => {
        newSpan(vi, "volume");
        newSpan(vi, "issue");
      });
    newSpan(main, "pages");
  });
};
const creatorToString = (creators: Creator[] | undefined) => {
  if (!creators || !creators[0]) return "";
  let firstCreator = creators[0];
  let str = isFullName(firstCreator)
    ? firstCreator.lastName
    : firstCreator.name;
  if (creators.length > 1) str = str.trim() + " et al.";
  return str;
};

export class CitationSuggesterModal
  extends SuggestModal<FuzzyMatch<RegularItem>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.modalEl.addClass(CLASS_ID);
  }
  get db() {
    return this.plugin.db;
  }

  suggestCache: ReturnType<typeof getSuggestions>[] = [];
  getSuggestions(input: string) {
    return getSuggestions(input, this.db);
  }
  debouncedGetSuggestions = debounce((input: string) => {
    this.suggestCache = this.getSuggestions(input);
  }, 500, true);

  renderSuggestion = renderSuggestion.bind(this);

  // Promisify the modal
  resolve: ((value: RegularItem | null) => void) | null = null;
  open(): Promise<RegularItem | null> {
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

  onChooseSuggestion(suggestion: FuzzyMatch<RegularItem>): void {
    // console.log(suggestion);
  }
  selectSuggestion(
    value: FuzzyMatch<RegularItem> | null,
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

export class CitationSuggester
  extends EditorSuggest<FuzzyMatch<RegularItem>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }

  get db() {
    return this.plugin.db;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    throw new Error("Method not implemented.");
    // if (!this.plugin.settings.suggester) return null;
    // const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
    // const match = sub.match(/(?::|：：)([^:\s]+$)/);
    // if (!match) return null;
    // const prevSC = (match.input as string)
    //   .substring(0, match.index)
    //   .match(/:([^\s:]+$)/);
    // if (prevSC && this.db.hasIcon(prevSC[1])) return null;
    // return {
    //   end: cursor,
    //   start: {
    //     ch: match.index as number,
    //     line: cursor.line,
    //   },
    //   query: match[1],
    // };
  }

  getSuggestions(context: EditorSuggestContext) {
    return getSuggestions(context.query, this.db);
  }

  renderSuggestion = renderSuggestion.bind(this);
  selectSuggestion(suggestion: FuzzyMatch<RegularItem>): void {
    throw new Error("Method not implemented.");
    // if (!this.context) return;
    // const { id, pack } = suggestion.item;
    // this.context.editor.replaceRange(
    //   this.plugin.settings.code2emoji && pack === "emoji"
    //     ? (this.db.getIcon(id) as string)
    //     : `:${id}:` + (this.plugin.settings.spaceAfterSC ? " " : ""),
    //   this.context.start,
    //   this.context.end,
    // );
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
