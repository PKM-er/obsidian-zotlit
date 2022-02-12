/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type { HelperDeclareSpec, TemplateDelegate } from "handlebars";

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
    if (isRegularItem(this)) {
      url = new URL("zotero://select/library/items/" + this.key);
    } else if (isAnnotationItem(this)) {
      url = new URL("zotero://open-pdf/library/items/" + this.parentItem);
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
};
