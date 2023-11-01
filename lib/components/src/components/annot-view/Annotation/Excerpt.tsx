import type { AnnotationInfo } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
// import { assertNever } from "assert-never";
import { memo } from "react";
import ImgExcerpt from "./ImgExcerpt";

type ExcerptProps = Pick<AnnotationInfo, "type" | "text" | "pageLabel"> & {
  imgSrc?: string;
  collapsed: boolean;
};

export default memo(function Excerpt({
  type,
  text,
  pageLabel,
  imgSrc,
  collapsed,
}: ExcerptProps) {
  switch (type) {
    case AnnotationType.highlight:
    case AnnotationType.underline:
    case AnnotationType.text:
      return <p className="select-text">{text}</p>;
    case AnnotationType.image:
      if (!imgSrc) throw new Error("imgSrc is required for image annotation");
      return (
        <ImgExcerpt
          collapsed={collapsed}
          src={imgSrc}
          pageLabel={pageLabel}
          text={text}
        />
      );
    // case AnnotationType.note:
    // case AnnotationType.ink:
    default:
      return <>Unsupported Type: {AnnotationType[type] ?? type}</>;
  }
});
