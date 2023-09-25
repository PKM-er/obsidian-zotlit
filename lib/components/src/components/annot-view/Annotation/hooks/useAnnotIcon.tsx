import { AnnotationType } from "@obzt/zotero-type";
import { assertNever } from "assert-never";

export const useAnnotIcon = (type: AnnotationType) => {
  switch (type) {
    case AnnotationType.highlight:
      return "align-left";
    case AnnotationType.underline:
      return "underline";
    case AnnotationType.image:
      return "frame";
    case AnnotationType.note:
    case AnnotationType.ink:
      return "file-question";
    default:
      assertNever(type);
  }
};
