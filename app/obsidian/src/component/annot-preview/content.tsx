import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { useAtomValue } from "jotai";
import { getColor, imgSrcAtom, useSelector } from "../atoms/derived.js";
import { annotAtom } from "./atom.js";

const Content = () => {
  const type = useSelector(annotAtom, ({ type }) => type);
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
  return <div className="annot-excerpt">{content}</div>;
};

const TextExcerpt = () => {
  const color = useSelector(annotAtom, getColor);
  const text = useSelector(annotAtom, ({ text }) => text);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <p>{text}</p>
    </blockquote>
  );
};
const PicExcerpt = () => {
  const imgSrc = useAtomValue(imgSrcAtom);
  const color = useSelector(annotAtom, getColor);
  const imgAlt = useSelector(
    annotAtom,
    ({ text, pageLabel }) => text ?? `Area Excerpt for Page ${pageLabel}`,
  );
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <img src={imgSrc} alt={imgAlt} />
    </blockquote>
  );
};

export default Content;
