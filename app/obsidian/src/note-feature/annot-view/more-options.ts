import type { AnnotsViewContextType } from "@obzt/components";
import type { AnnotationInfo } from "@obzt/database";
import { MarkdownView, Menu, Notice } from "obsidian";
import type { AnnotationView } from "@/note-feature/annot-view/view";

export const getMoreOptionsHandler =
  (view: AnnotationView): AnnotsViewContextType["onMoreOptions"] =>
  (evt, annotation) => {
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
  };
const jumpToAnnotNote =
  (annot: AnnotationInfo, view: AnnotationView) => async () => {
    const blockInfo = view.plugin.noteIndex
      .getBlocksFor({ item: annot, file: view.file.path })
      .shift();

    if (!blockInfo) {
      new Notice("No embed for this annotation in current note");
      return;
    }

    // TODO: handle multiple blocks
    const block = blockInfo.blocks.sort((a, b) => {
      const start = a.start.offset - b.start.offset;
      if (start !== 0) return start;
      return a.end.offset - b.end.offset;
    })[0];

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
    const endLine = block.end.line + 1;
    for (const leaf of groupLeaves) {
      if (
        leaf &&
        leaf.view instanceof MarkdownView &&
        leaf.view.file === view.file
      ) {
        leaf.view.setEphemeralState({
          line: endLine,
        });
        hasMarkdownView = !0;
      }
    }
    if (!hasMarkdownView) {
      workspace.getLeaf().openFile(view.file, {
        eState: {
          line: endLine,
        },
      });
    }
  };
