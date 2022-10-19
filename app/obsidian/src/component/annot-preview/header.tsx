import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { startCase } from "lodash-es";
import { MarkdownView, Menu, Notice } from "obsidian";
import type { RefObject } from "react";
import type { AnnotationView } from "../../note-feature/annot-view/view";
import { annotViewAtom } from "../../note-feature/annot-view/view";
import { useIconRef } from "../../utils/icon";
import { activeAtchAtom } from "../atoms/attachment";
import { getColor, getIcon, useSelector } from "../atoms/derived";
import { pluginAtom } from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";
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
        className={clsx("annot-page", "external-link")}
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
  const view = useAtomValue(annotViewAtom, GLOBAL_SCOPE);
  return useMemoizedFn((evt: React.MouseEvent | React.KeyboardEvent) => {
    const menu = new Menu();
    const jumpToAnnotNote = getJumpToAnnotNoteFunc(annot, view);
    menu.addItem((i) =>
      i
        .setTitle("Jump to Note")
        .setIcon("links-going-out")
        .onClick(jumpToAnnotNote),
    );
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
const getJumpToAnnotNoteFunc =
  (annot: Annotation, view: AnnotationView) => async () => {
    const block = view.plugin.noteIndex.getBlockInfoFromItem(annot);
    if (!block) {
      new Notice("No note for this annotation");
      return;
    }
    await sleep(10);
    const { leaf } = view,
      { workspace } = app;
    // MobileDrawer.collapseFor(n);
    let groupLeaves;
    if (leaf.group) groupLeaves = app.workspace.getGroupLeaves(leaf.group);
    else {
      groupLeaves = [];
      const activeFileView = workspace.getActiveFileView();
      activeFileView && groupLeaves.push(activeFileView.leaf);
    }
    let hasMarkdownView = false;
    const startLine = block.position.start.line;
    for (const leaf of groupLeaves) {
      if (
        leaf &&
        leaf.view instanceof MarkdownView &&
        leaf.view.file === view.file
      ) {
        leaf.view.setEphemeralState({
          line: startLine,
        });
        hasMarkdownView = !0;
      }
    }
    if (!hasMarkdownView) {
      workspace.getLeaf().openFile(view.file, {
        eState: {
          line: startLine,
        },
      });
    }
  };
