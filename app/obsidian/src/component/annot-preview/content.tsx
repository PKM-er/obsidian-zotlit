import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import type { AnnotProps } from "../atoms/annotation.js";
import { getColor, useImgSrc, useSelector } from "../atoms/derived.js";

const Content = ({ annotAtom }: AnnotProps) => {
  const type = useSelector(annotAtom, ({ type }) => type);
  let content;
  switch (type) {
    case AnnotationType.highlight:
      content = <TextExcerpt annotAtom={annotAtom} />;
      break;
    case AnnotationType.image:
      content = <PicExcerpt annotAtom={annotAtom} />;
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
const TextExcerpt = ({ annotAtom }: AnnotProps) => {
  const color = useSelector(annotAtom, getColor);
  const text = useSelector(annotAtom, ({ text }) => text);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <p>{text}</p>
    </blockquote>
  );
};
const PicExcerpt = ({ annotAtom }: AnnotProps) => {
  const imgSrc = useImgSrc(annotAtom);
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
