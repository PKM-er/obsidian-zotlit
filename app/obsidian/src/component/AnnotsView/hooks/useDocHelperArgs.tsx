import type { RegularItemInfo, TagInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { RegularItemInfoExtra, Context } from "../../../template/helper";
import { withItemHelper } from "../../../template/helper/item";
import { Obsidian } from "../../context";

export const useDocHelperArgs = (): DocHelperArgs | null => {
  const { view } = useContext(Obsidian);
  const params = useStore(
    view.store,
    ({ doc, tags, allAttachments, attachment }) => {
      return {
        doc,
        tags: tags[doc?.docItem.itemID ?? -1] as TagInfo[] | undefined,
        allAttachments,
        attachment,
      };
    },
    shallow,
  );

  const { plugin } = useContext(Obsidian);
  if (!params.doc || !params.allAttachments || !params.tags) return null;
  return [
    params.doc.docItem,
    {
      attachment: params.attachment,
      allAttachments: params.allAttachments,
      tags: params.tags ?? [],
    },
    { plugin, sourcePath: params.doc.sourcePath },
  ];
};

export type DocHelperArgs = [RegularItemInfo, RegularItemInfoExtra, Context];

export const useItemDetails = (renderArgs: DocHelperArgs | null) => {
  if (!renderArgs) return null;
  return withItemHelper(...renderArgs);
};
