import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import { useMemoizedFn } from "ahooks";
import assertNever from "assert-never";
import cls from "classnames";
import { useAtomValue } from "jotai";
import { startCase } from "lodash-es";
import React from "react";
import { renderHTMLReact } from "../utils";
import type { AnnotAtom, AnnotProps } from "./atoms/annotation";
import { getColor, getIcon, useImgSrc, useSelector } from "./atoms/derived";
import { pluginAtom } from "./atoms/obsidian";
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

const HeaderIcon = ({ annotAtom }: AnnotProps) => {
  const icon = useSelector(annotAtom, (annot) => getIcon(annot));
  const color = useSelector(annotAtom, getColor);
  const type = useSelector(annotAtom, ({ type }) => type);
  const dragProps = useDrag(annotAtom);
  const [iconRef] = useIconRef<HTMLDivElement>(icon);
  return (
    <div
      ref={iconRef}
      {...dragProps}
      className="annot-type-icon"
      style={{ color }}
      aria-label={startCase(AnnotationType[type])}
      aria-label-delay="500"
    />
  );
};

const useDrag = (annotAtom: AnnotAtom) => {
  const annot = useAtomValue(annotAtom);
  const {
    settings: { literatureNoteTemplate },
  } = useAtomValue(pluginAtom);
  const onDragStart: React.DragEventHandler<HTMLDivElement> = useMemoizedFn(
    (evt) => {
      evt.dataTransfer.setData(
        "text/plain",
        literatureNoteTemplate.render("annotation", annot),
      );
      evt.dataTransfer.dropEffect = "copy";
    },
  );
  return { draggable: true, onDragStart };
};

const Header = ({ annotAtom }: AnnotProps) => {
  return (
    <div className="annot-header">
      <HeaderIcon annotAtom={annotAtom} />
      <div className="annot-header-space" />
      <Page annotAtom={annotAtom} />
    </div>
  );
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

const Comment = ({ annotAtom }: AnnotProps) => {
  const comment = useSelector(annotAtom, ({ comment }) => comment);
  return comment ? (
    <div className="annot-comment">
      <p {...renderHTMLReact(comment)} />
    </div>
  ) : null;
};

const Page = ({ annotAtom }: AnnotProps) => {
  const page = useSelector(annotAtom, ({ pageLabel }) => pageLabel);
  const backlink = useSelector(annotAtom, getBacklink);
  const pageText = page ? `Page ${page}` : "";

  if (backlink)
    return (
      <a
        className={cls("annot-page", "external-link")}
        href={backlink}
        aria-label={`Open Annotation In Zotero at Page ${page}`}
        aria-label-delay="500"
      >
        {pageText}
      </a>
    );
  else return <span className="annot-page">{pageText}</span>;
};
