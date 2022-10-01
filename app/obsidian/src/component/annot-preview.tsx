import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { renderHTMLReact } from "../utils";
import type { AnnotProps } from "./atoms";
import { useDerivedAtom } from "./atoms";
import {
  getTypeAtom,
  getIconAtom,
  getColorAtom,
  getPageAtom,
  getTextAtom,
  getImgSrcAtom,
  getImgAltAtom,
  getCommentAtom,
} from "./derived-atom";
import { useIconRef } from "./icon";

export const AnnotationPreview = ({ annotAtom: atom }: AnnotProps) => {
  return (
    <div className="annot-preview">
      <Header annotAtom={atom} />
      <AnnotContent annotAtom={atom} />
      <Comment annotAtom={atom} />
    </div>
  );
};

const AnnotContent = ({ annotAtom }: AnnotProps) => {
  const type = useDerivedAtom(annotAtom, getTypeAtom);
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

const Header = ({ annotAtom }: AnnotProps) => {
  const icon = useDerivedAtom(annotAtom, getIconAtom);
  const color = useDerivedAtom(annotAtom, getColorAtom);
  const page = useDerivedAtom(annotAtom, getPageAtom);
  const type = useDerivedAtom(annotAtom, getTypeAtom);
  const [iconRef] = useIconRef<HTMLDivElement>(icon);
  return (
    <div className="annot-header">
      <div
        ref={iconRef}
        className="annot-type-icon"
        style={{ color }}
        aria-label={AnnotationType[type]}
        aria-label-delay="50"
      />
      <div className="annot-header-space" />
      <span className="annot-page">Page {page}</span>
    </div>
  );
};

const TextExcerpt = ({ annotAtom }: AnnotProps) => {
  const color = useDerivedAtom(annotAtom, getColorAtom);
  const text = useDerivedAtom(annotAtom, getTextAtom);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <p>{text}</p>
    </blockquote>
  );
};

const PicExcerpt = ({ annotAtom }: AnnotProps) => {
  const imgSrc = useDerivedAtom(annotAtom, getImgSrcAtom);
  const color = useDerivedAtom(annotAtom, getColorAtom);
  const imgAlt = useDerivedAtom(annotAtom, getImgAltAtom);
  return (
    <blockquote style={{ borderColor: color ?? undefined }}>
      <img src={imgSrc} alt={imgAlt} />
    </blockquote>
  );
};

const Comment = ({ annotAtom }: AnnotProps) => {
  const comment = useDerivedAtom(annotAtom, getCommentAtom);
  return comment ? (
    <div className="annot-comment">
      <p {...renderHTMLReact(comment)} />
    </div>
  ) : null;
};
