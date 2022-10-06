/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { toPage } from "@obzt/common";
import type { Annotation, GeneralItem } from "@obzt/zotero-type";
import { isAnnotationItem, getBacklink } from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec, HelperOptions } from "handlebars";

import { getItemKeyGroupID } from "../note-index/index.js";

export const partial = {} as const;

export const helpers: HelperDeclareSpec = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backlink(this: GeneralItem | Annotation | any): string {
    return getBacklink(this);
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

export const renderFilename = (name: string) =>
  filenamify(name, { replacement: "_" });
