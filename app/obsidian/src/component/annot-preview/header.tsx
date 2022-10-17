import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import { useMemoizedFn } from "ahooks";
import cls from "classnames";
import { useAtomValue } from "jotai";
import { startCase } from "lodash-es";
import { Menu } from "obsidian";
import type { RefObject } from "react";
import { activeAtchAtom } from "../atoms/attachment";
import { getColor, getIcon, useSelector } from "../atoms/derived";
import { pluginAtom } from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";
import { useIconRef } from "../icon";
import { AnnotDetailsToggle } from "../item-view/item-details-toggle";
import { annotAtom, ANNOT_PREVIEW_SCOPE, useAnnotValue } from "./atom";
import type { DragHandler } from ".";
const HeaderIcon = ({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement>;
}) => {
  const icon = useSelector((annot) => getIcon(annot));
  const color = useSelector(getColor);
  const type = useSelector(({ type }) => type);
  const dragProps = useDragStart(containerRef);
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
  const page = useSelector(({ pageLabel }) => pageLabel);
  const backlink = useSelector(getBacklink);
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

const useDragHandler = (): DragHandler => {
  const activeAtch = useAtomValue(activeAtchAtom, GLOBAL_SCOPE);
  const {
    settings: { literatureNoteTemplate },
    imgCacheImporter,
  } = useAtomValue(pluginAtom, GLOBAL_SCOPE);
  return useMemoizedFn((evt, annot) => {
    if (!activeAtch) return;
    const data = literatureNoteTemplate.render("annotation", {
      ...annot,
      attachment: activeAtch,
    });
    evt.dataTransfer.setData("text/plain", data);
    const evtRef = app.workspace.on("editor-drop", (evt) => {
      if (evt.dataTransfer?.getData("text/plain") === data) {
        imgCacheImporter.flush();
      }
      app.workspace.offref(evtRef);
    });
    window.addEventListener(
      "dragend",
      () => {
        imgCacheImporter.cancel();
      },
      { once: true },
    );
  });
};

const useDragStart = (containerRef: RefObject<HTMLDivElement>) => {
  const annot = useAtomValue(annotAtom, ANNOT_PREVIEW_SCOPE);
  const handler = useDragHandler();
  const onDragStart: React.DragEventHandler<HTMLDivElement> = useMemoizedFn(
    (evt) => {
      if (annot.state === "hasData") {
        handler(evt, annot.data);
        if (containerRef.current) {
          evt.dataTransfer.setDragImage(containerRef.current, 0, 0);
        }
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

const useMoreOptionMenu = () => {
  const annot = useAnnotValue();
  return useMemoizedFn((evt: React.MouseEvent | React.KeyboardEvent) => {
    moreOptionsMenuHandler(annot, evt);
  });
};

const Header = ({
  dragRef: containerRef,
}: {
  dragRef: RefObject<HTMLDivElement>;
}) => {
  return (
    <div className="annot-header" onContextMenu={useMoreOptionMenu()}>
      <div className="annot-action-container">
        <HeaderIcon containerRef={containerRef} />
        <AnnotDetailsToggle />
        <MoreOptionsButton />
      </div>
      <div className="annot-header-space" />
      <Page />
    </div>
  );
};

const MoreOptionsButton = () => {
  const openMenu = useMoreOptionMenu();
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
