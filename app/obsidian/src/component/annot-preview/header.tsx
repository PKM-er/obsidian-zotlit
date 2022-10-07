import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import { useAtomValue } from "jotai";
import { startCase } from "lodash-es";
import { Menu } from "obsidian";
import { getColor, getIcon, useSelector } from "../atoms/derived";
import { pluginAtom } from "../atoms/obsidian";
import { useIconRef } from "../icon";
import { AnnotDetailsToggle } from "../item-view/item-details-toggle";
import { annotAtom, annotBaseAtom } from "./atom";

const HeaderIcon = () => {
  const icon = useSelector(annotBaseAtom, (annot) => getIcon(annot));
  const color = useSelector(annotBaseAtom, getColor);
  const type = useSelector(annotBaseAtom, ({ type }) => type);
  const dragProps = useDrag();
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
const Page = () => {
  const page = useSelector(annotBaseAtom, ({ pageLabel }) => pageLabel);
  const backlink = useSelector(annotBaseAtom, getBacklink);
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
const useDrag = () => {
  const annot = useAtomValue(annotAtom);
  const {
    settings: { literatureNoteTemplate },
  } = useAtomValue(pluginAtom);
  const onDragStart: React.DragEventHandler<HTMLDivElement> = useMemoizedFn(
    (evt) => {
      if (annot.state === "hasData") {
        evt.dataTransfer.setData(
          "text/plain",
          literatureNoteTemplate.render("annotation", annot.data),
        );
        evt.dataTransfer.dropEffect = "copy";
      } else {
        evt.dataTransfer.dropEffect = "none";
      }
    },
  );
  if (annot.state === "hasData") {
    return { draggable: true, onDragStart };
  } else {
    return { draggable: false, onDragStart };
  }
};

const Header = () => {
  const annot = useAtomValue(annotBaseAtom);
  const openMenu = useMemoizedFn((evt: React.MouseEvent) => {
    moreOptionsMenuHandler(annot, evt);
  });
  return (
    <div className="annot-header" onContextMenu={openMenu}>
      <div className="annot-action-container">
        <HeaderIcon />
        <AnnotDetailsToggle />
        <MoreOptionsButton />
      </div>
      <div className="annot-header-space" />
      <Page />
    </div>
  );
};

const MoreOptionsButton = () => {
  const annot = useAtomValue(annotBaseAtom);
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
