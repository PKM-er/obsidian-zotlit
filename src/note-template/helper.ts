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
  typeof (item as AnnotationItem).annotationPosition?.pageIndex === "number";

export const Partial = {
  annot:
    "zotero://open-pdf/library/items/{{parentItem}}?page={{annotationPosition.pageIndex}}&annotation={{key}}",
  regular: "zotero://select/library/items/{{key}}",
  empty: "",
} as const;

export const Helpers: HelperDeclareSpec = {
  link: function (
    this: RegularItem | AnnotationItem | any,
  ): keyof typeof Partial {
    if (isRegularItem(this)) {
      return "regular";
    } else if (isAnnotationItem(this)) {
      return "annot";
    } else return "empty";
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
