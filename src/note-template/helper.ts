/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { HelperDeclareSpec, TemplateDelegate } from "handlebars";

import { getItemKeyGroupID } from "../note-index/index";
import type { AnnotationItem, Item, RegularItem } from "../zotero-types";
import { NonRegularItemTypes } from "../zotero-types";

const isRegularItem = (item: any): item is RegularItem =>
  !NonRegularItemTypes.includes((item as Item).itemType as any) &&
  typeof (item as Item).key === "string";
const isAnnotationItem = (item: any): item is AnnotationItem =>
  (item as Item).itemType === "annotation" &&
  typeof (item as AnnotationItem).parentItem === "string" &&
  (!!(item as AnnotationItem).key ||
    typeof (item as AnnotationItem).annotationPosition?.pageIndex === "number");

export const Partial = {} as const;

export const Helpers: HelperDeclareSpec = {
  backlink: function (this: RegularItem | AnnotationItem | any): string {
    let url: URL;
    const target =
      typeof this.groupID === "number" ? `groups/${this.groupID}` : "library";
    if (isRegularItem(this)) {
      url = new URL(`zotero://select/${target}/items/${this.key}`);
    } else if (isAnnotationItem(this)) {
      url = new URL(`zotero://open-pdf/${target}/items/${this.parentItem}`);
      if (typeof this.annotationPosition?.pageIndex === "number")
        url.searchParams.append(
          "page",
          this.annotationPosition.pageIndex.toString(),
        );
      if (this.key) url.searchParams.append("annotation", this.key);
    } else return "";
    return url.toString();
  },
  coalesce: function () {
    for (var i = 0; i < arguments.length - 1; i++) {
      // - 1 because last should be handlebars options var
      if (arguments[i]) {
        return arguments[i];
      }
    }
    return null;
  },
  blockID: function (this: AnnotationItem | any): string {
    if (isAnnotationItem(this)) {
      let id = getItemKeyGroupID(this);
      if (typeof this.annotationPosition.pageIndex === "number")
        id += `p${this.annotationPosition.pageIndex}`;
      return id;
    } else return "";
  },
};
