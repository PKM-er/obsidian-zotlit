import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";
import { getColor, imgSrcAtom, useSelector } from "../atoms/derived.js";
import { ANNOT_PREVIEW_SCOPE } from "./atom.js";

const Content = forwardRef<HTMLDivElement, unknown>(function Content(
  _props,
  ref,
) {
  const type = useSelector(({ type }) => type);
  let content;
  switch (type) {
    case AnnotationType.highlight:
      content = <TextExcerpt />;
      break;
    case AnnotationType.image:
      content = <PicExcerpt />;
      break;
    case AnnotationType.note:
    case AnnotationType.ink:
      content = <>Unsupported Type: {AnnotationType[type]}</>;
      break;
    default:
      assertNever(type);
  }
  return (
    <div className="annot-excerpt" ref={ref}>
      {content}
    </div>
  );
});

const TextExcerpt = () => {
  const color = useSelector(getColor);
  const text = useSelector(({ text }) => text);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <p>{text}</p>
    </blockquote>
  );
};
const PicExcerpt = () => {
  const imgSrc = useAtomValue(imgSrcAtom, ANNOT_PREVIEW_SCOPE);
  const color = useSelector(getColor);
  const imgAlt = useSelector(
    ({ text, pageLabel }) => text ?? `Area Excerpt for Page ${pageLabel}`,
  );
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <img src={imgSrc} alt={imgAlt} />
    </blockquote>
  );
};

export default Content;
