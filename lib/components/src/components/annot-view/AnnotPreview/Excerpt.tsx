import type { AnnotationInfo } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import { assertNever } from "assert-never";
import { memo } from "react";
import ImgExcerpt from "./ImgExcerpt";

type ExcerptProps = Pick<AnnotationInfo, "type" | "text" | "pageLabel"> & {
  imgSrc?: string;
};

export default memo(function Excerpt({
  type,
  text,
  pageLabel,
  imgSrc,
}: ExcerptProps) {
  switch (type) {
    case AnnotationType.highlight:
      return <p>{text}</p>;
    case AnnotationType.image:
      if (!imgSrc) throw new Error("imgSrc is required for image annotation");
      return <ImgExcerpt src={imgSrc} pageLabel={pageLabel} text={text} />;
    case AnnotationType.note:
    case AnnotationType.ink:
      return <>Unsupported Type: {AnnotationType[type]}</>;
    default:
      assertNever(type);
  }
});
