import { D, pipe } from "@mobily/ts-belt";
import type { RegularItemInfoBase } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { Obsidian } from "../../context";

export const useDocHelper = (): RegularItemInfoBase | null => {
  const { store, buildDocItemHelper } = useContext(Obsidian);
  const { doc, allAttachments, tags, attachment } = useStore(
    store,
    (s) =>
      pipe(s, D.selectKeys(["allAttachments", "attachment", "tags", "doc"])),
    shallow,
  );

  if (!(doc && allAttachments && tags[doc.docItem.itemID])) {
    return null;
  }

  return buildDocItemHelper(
    doc.docItem,
    tags,
    attachment,
    doc.sourcePath,
    allAttachments,
  );
};
