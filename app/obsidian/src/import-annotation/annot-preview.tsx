import type { Annotation } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import DOMPurify from "dompurify";
import { setIcon } from "obsidian";
import { useContext, useEffect, useRef } from "preact/hooks";
import { AnnotationContext } from "./annot-list";

declare global {
  // eslint-disable-next-line no-var
  var DOMPurify: typeof DOMPurify;
}

export const AnnotationPreview = ({
  annotation: annot,
}: {
  annotation: Annotation;
}) => {
  return (
    <div className="annot-preview">
      <Header annot={annot} />
      <AnnotContent annot={annot} />
      <Comment comment={annot.comment} />
    </div>
  );
};

const AnnotContent = ({ annot }: { annot: Annotation }) => {
  let content;
  switch (annot.type) {
    case AnnotationType.highlight:
      content = <TextExcerpt annot={annot} />;
      break;
    case AnnotationType.image:
      content = <PicExcerpt annot={annot} />;
      break;
    case AnnotationType.note:
    case AnnotationType.ink:
      content = <>Unsupported Type: {AnnotationType[annot.type]}</>;
      break;
    default:
      assertNever(annot.type);
  }
  return <div className="annot-excerpt">{content}</div>;
};

const Header = ({
  annot: { color, type, pageLabel },
}: {
  annot: Annotation;
}) => {
  let icon: string;
  switch (type) {
    case AnnotationType.highlight:
      icon = "align-left";
      break;
    case AnnotationType.image:
      icon = "box-select";
      break;
    case AnnotationType.note:
    case AnnotationType.ink:
      icon = "file-question";
      break;
    default:
      assertNever(type);
  }
  return (
    <div className="annot-header">
      <Icon icon={icon} color={color} className="annot-type-icon" />
      <span className="annot-page">Page {pageLabel}</span>
    </div>
  );
};

const TextExcerpt = ({ annot: { text, color } }: { annot: Annotation }) => {
  const renderText =
    text && text.length > 100 ? text.substring(0, 100) + "..." : text ?? "";

  return (
    <blockquote style={{ borderColor: color }}>
      <p>{renderText}</p>
    </blockquote>
  );
};

const PicExcerpt = ({ annot }: { annot: Annotation }) => {
  const { zoteroDataDir } = useContext(AnnotationContext);
  const path = getCacheImagePath(annot, zoteroDataDir);
  return (
    <blockquote style={{ borderColor: annot.color }}>
      <img
        src={`app://local${path}`}
        alt={annot.text ?? `Area Excerpt for Page ${annot.pageLabel}`}
      />
    </blockquote>
  );
};

const Comment = ({ comment }: { comment: string | null }) => {
  return comment ? (
    <div className="annot-comment">
      <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment) }} />
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
  color?: string;
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
  return <div ref={ref} style={{ color }} className={className} />;
};
