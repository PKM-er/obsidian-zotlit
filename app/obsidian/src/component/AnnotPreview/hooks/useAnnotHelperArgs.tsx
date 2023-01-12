import type { AnnotationInfo, AttachmentInfo, TagInfo } from "@obzt/database";
import { useContext } from "react";
import type { AnnotationExtra, Context } from "../../../template/helper";
import { Obsidian } from "../../context";

export const useAnnotHelperArgs = ({
  annotation,
  tags,
  attachment,
  sourcePath,
}: {
  sourcePath: string;
  annotation: AnnotationInfo;
  attachment: AttachmentInfo | null;
  tags: TagInfo[] | undefined;
}): AnnotHelperArgs | null => {
  const { plugin } = useContext(Obsidian);
  if (!tags) return null;
  return [annotation, { attachment, tags }, { plugin, sourcePath }];
};

export type AnnotHelperArgs = [AnnotationInfo, AnnotationExtra, Context];
