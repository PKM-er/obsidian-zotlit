import { D, pipe } from "@mobily/ts-belt";
import type { RegularItemInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type {
  RegularItemInfoExtra,
  Context,
  HelperExtra,
} from "../../../template/helper";
import { withDocItemHelper } from "../../../template/helper";
import { Obsidian } from "../../context";

export const useDocHelperArgs = (): Status => {
  const { view } = useContext(Obsidian);
  const params = useStore(
    view.store,
    (s) =>
      pipe(
        s,
        D.selectKeys([
          "tags",
          "allAttachments",
          "attachment",
          "annotations",
          "doc",
        ]),
      ),
    shallow,
  );

  const { plugin } = useContext(Obsidian);
  if (
    !(
      params.doc?.docItem &&
      params.allAttachments &&
      params.tags[params.doc.docItem.itemID]
    )
  ) {
    return {
      status: 0,
      args: null,
    };
  }

  const ctx = { plugin, sourcePath: params.doc.sourcePath };
  if (!params.annotations) {
    return {
      status: 1,
      args: [
        params.doc.docItem,
        {
          attachment: params.attachment,
          allAttachments: params.allAttachments,
          tags: params.tags,
        },
        ctx,
      ],
    };
  }
  return {
    status: 2,
    args: [
      params.doc.docItem,
      {
        annotations: params.annotations,
        attachment: params.attachment,
        allAttachments: params.allAttachments,
        tags: params.tags,
        docItem: params.doc.docItem,
      },
      ctx,
    ],
  };
};

export const useItemDetails = (renderArgs: DocHelperArgsPartial | null) => {
  if (!renderArgs) return null;
  return withDocItemHelper(...renderArgs);
};

type Status =
  | { status: 0; args: null }
  | { status: 1; args: DocHelperArgsPartial }
  | { status: 2; args: DocHelperArgsFull };

export type DocHelperArgsFull = [RegularItemInfo, HelperExtra, Context];
export type DocHelperArgsPartial = [
  RegularItemInfo,
  RegularItemInfoExtra,
  Context,
];
