import "./style.less";

import type Fuse from "fuse.js";

import ZoteroDb from "../zotero-db";
import {
  Creator,
  isFullName,
  JournalArticleItem,
  RegularItem,
} from "../zotero-types";
import UnionRanges from "./union";

export type FuzzyMatch<T> = Fuse.FuseResult<T>;

const PRIMARY_MATCH_FIELD = "title";

export interface SuggesterBase {
  db: ZoteroDb;
}
export const getSuggestions = async (
  input: string,
  db: ZoteroDb,
): Promise<FuzzyMatch<RegularItem>[]> => {
  if (typeof input === "string" && input.trim().length > 0) {
    return await db.search(
      input.replace(/^\+|\+$/g, "").split(/[+]/g),
      PRIMARY_MATCH_FIELD,
      50,
    );
  } else {
    return await db.getAll(50);
  }
};
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function renderSuggestion(
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

/** highlight matches */
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
