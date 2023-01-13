import { D, pipe } from "@mobily/ts-belt";
import type { AnnotationInfo, AttachmentInfo } from "@obzt/database";
import { useContext } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { AnnotationExtra, Context } from "../../../template/helper";
import type { HelperExtra } from "../../../template/helper/to-helper";
import { Obsidian } from "../../context";

export const useAnnotHelperArgs = ({
  annotation,
  attachment,
  sourcePath,
}: {
  annotation: AnnotationInfo;
  attachment: AttachmentInfo;
  sourcePath: string;
}): Status => {
  const { plugin, view } = useContext(Obsidian),
    props = useStore(
      view.store,
      (s) =>
        pipe(
          s,
          D.selectKeys(["allAttachments", "annotations", "tags"]),
          D.set("docItem", s.doc?.docItem),
        ),
      shallow,
    );

  if (!(props.tags[annotation.itemID] && attachment)) {
    return { status: 0, args: null };
  }
  if (!(props.docItem && props.allAttachments && props.annotations)) {
    return {
      status: 1,
      args: [
        annotation,
        { attachment, tags: props.tags },
        { plugin, sourcePath },
      ],
    };
  }
  return {
    status: 2,
    args: [
      annotation,
      {
        attachment,
        tags: props.tags,
        allAttachments: props.allAttachments,
        annotations: props.annotations,
        docItem: props.docItem,
      },
      { plugin, sourcePath },
    ],
  };
};

type Status =
  | { status: 0; args: null }
  | { status: 1; args: AnnotHelperArgsPartial }
  | { status: 2; args: AnnotHelperArgsFull };

export type AnnotHelperArgsFull = [AnnotationInfo, HelperExtra, Context];
export type AnnotHelperArgsPartial = [AnnotationInfo, AnnotationExtra, Context];
