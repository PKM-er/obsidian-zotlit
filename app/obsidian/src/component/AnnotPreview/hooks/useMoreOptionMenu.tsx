import type { AnnotationInfo } from "@obzt/database";
import { useMemoizedFn } from "ahooks";
import { MarkdownView, Menu, Notice } from "obsidian";
import { useContext } from "react";
import type { AnnotationView } from "../../../note-feature/annot-view/view";
import { Obsidian } from "../../context";

export const useMoreOptionMenu = (annotation: AnnotationInfo) => {
  const { view } = useContext(Obsidian);
  return useMemoizedFn((evt: React.MouseEvent | React.KeyboardEvent) => {
    const menu = new Menu();
    menu.addItem((i) =>
      i
        .setTitle("Jump to Note")
        .setIcon("links-going-out")
        .onClick(jumpToAnnotNote(annotation, view)),
    );
    app.workspace.trigger("zotero:open-annot-menu", annotation, menu);
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
const jumpToAnnotNote =
  (annot: AnnotationInfo, view: AnnotationView) => async () => {
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
