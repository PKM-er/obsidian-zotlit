/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { AnnotationItem, Item, RegularItem } from "@obzt/zotero-type";
import { nonRegularItemTypes } from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec, HelperOptions } from "handlebars";

import { getItemKeyGroupID } from "../note-index/index.js";

const isRegularItem = (item: unknown): item is RegularItem =>
  !nonRegularItemTypes.includes((item as Item).itemType as never) &&
  typeof (item as Item).key === "string";
const isAnnotationItem = (item: unknown): item is AnnotationItem =>
  (item as Item).itemType === "annotation" &&
  typeof (item as AnnotationItem).parentItem === "string" &&
  (!!(item as AnnotationItem).key ||
    typeof (item as AnnotationItem).position?.pageIndex === "number");

export const partial = {} as const;

export const helpers: HelperDeclareSpec = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backlink(this: RegularItem | AnnotationItem | any): string {
    let url: URL;
    const target =
      typeof this.groupID === "number" ? `groups/${this.groupID}` : "library";
    if (isRegularItem(this)) {
      url = new URL(`zotero://select/${target}/items/${this.key}`);
    } else if (isAnnotationItem(this)) {
      url = new URL(`zotero://open-pdf/${target}/items/${this.parentItem}`);
      if (typeof this.position?.pageIndex === "number")
        url.searchParams.append("page", this.position.pageIndex.toString());
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
  blockID(this: AnnotationItem | any): string {
    if (isAnnotationItem(this)) {
      let id = getItemKeyGroupID(this);
      if (typeof this.position.pageIndex === "number")
        id += `p${this.position.pageIndex}`;
      return id;
    } else return "";
  },
};
