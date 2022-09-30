import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";
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
  return (
    <div className="annot-header">
      <Icon icon={icon} color={color} className="annot-type-icon" />
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

const Icon = ({
  icon,
  size,
  className,
  color,
}: {
  icon: string;
  size?: number;
  color?: string | null;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const node = ref.current!;
    setIcon(node, icon, size);
    return () => {
      node.empty();
    };
  }, [icon, size]);
  const style = color ? { color } : undefined;
  return <div ref={ref} style={style} className={className} />;
};
