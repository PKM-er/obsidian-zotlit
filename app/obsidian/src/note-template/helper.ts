/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { Annotation, GeneralItem, Item } from "@obzt/zotero-type";
import { nonRegularItemTypes } from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec, HelperOptions } from "handlebars";

import { getItemKeyGroupID } from "../note-index/index.js";

const isGeneralItem = (item: unknown): item is GeneralItem =>
  !nonRegularItemTypes.includes((item as Item).itemType as never) &&
  typeof (item as Item).key === "string";
const isAnnotationItem = (item: unknown): item is Annotation =>
  (item as Item).itemType === "annotation" && !!(item as Annotation).parentItem;

export const partial = {} as const;

export const helpers: HelperDeclareSpec = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backlink(this: GeneralItem | Annotation | any): string {
    let url: URL;
    const library =
      typeof this.groupID === "number" ? `groups/${this.groupID}` : "library";
    if (isGeneralItem(this)) {
      url = new URL(`zotero://select/${library}/items/${this.key}`);
    } else if (isAnnotationItem(this)) {
      url = new URL(`zotero://open-pdf/${library}/items/${this.parentItem}`);
      const page = toPage(this.pageLabel);
      if (page) url.searchParams.append("page", page.toString());
      if (this.key) url.searchParams.append("annotation", this.key);
    } else return "";
    return url.toString();
  },
  coalesce() {
    for (let i = 0; i < arguments.length - 1; i++) {
      // - 1 because last should be handlebars options var
      if (arguments[i]) {
        return arguments[i];
      }
    }
    return null;
  },
  filename(options: HelperOptions): string {
    return filenamify(options.fn(this), { replacement: "_" });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockID(this: Annotation | any): string {
    if (isAnnotationItem(this)) {
      let id = getItemKeyGroupID(this);
      const page = toPage(this.pageLabel);
      if (page) id += `p${page}`;
      return id;
    } else return "";
  },
};

const toPage = (pageLabel: string | null): number | null => {
  if (!pageLabel) return null;
  const page = parseInt(pageLabel, 10);
  if (Number.isInteger(page)) {
    return page;
  } else {
    return null;
  }
};
