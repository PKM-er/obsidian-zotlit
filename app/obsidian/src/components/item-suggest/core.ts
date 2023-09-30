import type { RegularItemInfo, Creator } from "@obzt/database";
import { isCreatorFullName, isCreatorNameOnly } from "@obzt/database";
import type { JournalArticleItem } from "@obzt/zotero-type";

// import unionRanges from "@/utils/union.js";
import { setIcon } from "obsidian";
import type { SearchResult } from "@/services/zotero-db/database";
import type ZoteroPlugin from "@/zt-main.js";

export const CLASS_ID = "zt-citations";

export interface SuggesterBase {
  plugin: ZoteroPlugin;
}
export const getSuggestions = async (
  input: string,
  plugin: ZoteroPlugin,
): Promise<SearchResult[]> => {
  if (typeof input === "string" && input.trim().length > 0) {
    return await plugin.database.search(input);
  } else {
    return await plugin.database.getItemsOf(50);
  }
};
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function renderSuggestion(
  this: SuggesterBase,
  { item, fields }: SearchResult,
  el: HTMLElement,
): void {
  el.addClass("mod-complex");
  const contentEl = el
    .createDiv("suggestion-content")
    .createDiv("suggestion-title")
    .createSpan();
  const auxEl = el.createDiv("suggestion-aux");

  for (const field of fields) {
    const label = auxEl.createEl("kbd", "suggestion-hotkey");
    label.setAttribute("aria-label", field);
    switch (field) {
      case "title":
        setIcon(label, "type");
        break;
      case "creators":
        setIcon(label, "user");
        break;
      case "date":
        setIcon(label, "calendar");
        break;
      default:
        label.setText(field);
        break;
    }
  }

  const [title] = item.title ?? [];
  const titleEl = contentEl.createDiv({ cls: "title" });
  if (!(typeof title === "string" && title)) {
    titleEl.setText("Title missing");
  } /* else if (matches) {
    const indices =
      matches.length === 1
        ? matches[0].key === PRIMARY_MATCH_FIELD
          ? matches[0].indices
          : []
        : unionRanges(
            matches.flatMap((m) =>
              m.key === PRIMARY_MATCH_FIELD ? m.indices : [],
            ),
          );
    renderMatches(titleEl, title, indices);
  } */ else {
    titleEl.setText(title);
  }
  if (this.plugin.settings.current?.showCitekeyInSuggester && item.citekey) {
    contentEl.createDiv({ cls: "citekey", text: item.citekey });
  }
  if (isJournalArticleItem(item)) {
    contentEl.append(getArticleMeta(item));
  }
}

const isJournalArticleItem = (
  item: RegularItemInfo,
): item is JournalArticleItem<RegularItemInfo> =>
  item.itemType === "journalArticle";

const getArticleMeta = (item: JournalArticleItem<RegularItemInfo>) => {
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
    meta[key] &&
    to.createSpan({ cls: cls ?? key, text: meta[key] ?? undefined });
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
  const firstCreator = creators[0];
  let str =
    isCreatorFullName(firstCreator) || isCreatorNameOnly(firstCreator)
      ? firstCreator.lastName
      : "";
  if (creators.length > 1) str = str.trim() + " et al.";
  return str;
};

/** highlight matches */
// const renderMatches = (
//   el: HTMLElement,
//   text: string,
//   indices?: readonly Fuse.RangeTuple[],
//   offset?: number,
// ) => {
//   if (indices) {
//     if (offset === undefined) offset = 0;
//     let textIndex = 0;
//     for (
//       let rangeIndex = 0;
//       rangeIndex < indices.length && textIndex < text.length;
//       rangeIndex++
//     ) {
//       const range = indices[rangeIndex];
//       let start = range[0] + offset;
//       const end = range[1] + offset + 1; // patch for Fuse.RangeTuple
//       if (!(end <= 0)) {
//         if (start >= text.length) break;
//         if (start < 0) start = 0;
//         if (start !== textIndex)
//           el.appendText(text.substring(textIndex, start));
//         el.createSpan({
//           cls: "suggestion-highlight",
//           text: text.substring(start, end),
//         });
//         textIndex = end;
//       }
//     }
//     textIndex < text.length && el.appendText(text.substring(textIndex));
//   } else el.appendText(text);
// };
