import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";
import { getColor, imgSrcAtom, useSelector } from "../atoms/derived.js";
import { annotBaseAtom } from "./atom.js";

const Content = forwardRef<HTMLDivElement, unknown>(function Content(
  _props,
  ref,
) {
  const type = useSelector(annotBaseAtom, ({ type }) => type);
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
  const color = useSelector(annotBaseAtom, getColor);
  const text = useSelector(annotBaseAtom, ({ text }) => text);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <p>{text}</p>
    </blockquote>
  );
};
const PicExcerpt = () => {
  const imgSrc = useAtomValue(imgSrcAtom);
  const color = useSelector(annotBaseAtom, getColor);
  const imgAlt = useSelector(
    annotBaseAtom,
    ({ text, pageLabel }) => text ?? `Area Excerpt for Page ${pageLabel}`,
  );
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <img src={imgSrc} alt={imgAlt} />
    </blockquote>
  );
};

export default Content;
