import { AnnotationType } from "@obzt/zotero-type";

export const useAnnotIcon = (type: AnnotationType) => {
  switch (type) {
    case AnnotationType.highlight:
      return "align-left";
    case AnnotationType.underline:
      return "underline";
    case AnnotationType.image:
      return "frame";
    case AnnotationType.text:
      return "text-select";
    case AnnotationType.note:
    case AnnotationType.ink:
    default:
      return "file-question";
  }
};
