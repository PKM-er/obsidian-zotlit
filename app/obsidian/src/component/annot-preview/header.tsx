import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import { useAtomValue } from "jotai";
import { startCase } from "lodash-es";
import { Menu } from "obsidian";
import React, { useCallback } from "react";
import type { AnnotAtom, AnnotProps } from "../atoms/annotation";
import { getColor, getIcon, useSelector } from "../atoms/derived";
import { pluginAtom } from "../atoms/obsidian";
import { useIconRef } from "../icon";

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
  const annot = useAtomValue(annotAtom);
  const openMenu = useMemoizedFn((evt: React.MouseEvent) => {
    moreOptionsMenuHandler(annot, evt);
  });
  return (
    <div className="annot-header" onContextMenu={openMenu}>
      <div className="annot-action-container">
        <HeaderIcon annotAtom={annotAtom} />
        <MoreOptionsButton annotAtom={annotAtom} />
      </div>
      <div className="annot-header-space" />
      <Page annotAtom={annotAtom} />
    </div>
  );
};

const MoreOptionsButton = ({ annotAtom }: AnnotProps) => {
  const annot = useAtomValue(annotAtom);
  const openMenu = useMemoizedFn(
    (evt: React.MouseEvent | React.KeyboardEvent) => {
      moreOptionsMenuHandler(annot, evt);
    },
  );
  const [iconRef] = useIconRef<HTMLDivElement>("more-vertical");
  return (
    <div
      role="button"
      ref={iconRef}
      tabIndex={0}
      className="annot-header-more-options"
      aria-label="More Options"
      aria-label-delay="50"
      onClick={openMenu}
      onKeyDown={openMenu}
    />
  );
};

export default Header;

const moreOptionsMenuHandler = (
  annot: Annotation,
  evt: React.MouseEvent | React.KeyboardEvent,
) => {
  const menu = new Menu();
  app.workspace.trigger("zotero:open-annot-menu", annot, menu);
  if (evt.nativeEvent instanceof MouseEvent)
    menu.showAtMouseEvent(evt.nativeEvent);
  else {
    const rect = evt.currentTarget.getBoundingClientRect();
    menu.showAtPosition({
      x: rect.left,
      y: rect.bottom,
    });
  }
};
