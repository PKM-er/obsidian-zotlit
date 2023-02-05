import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import { Service } from "@ophidian/core";
import { around } from "monkey-around";
import type { Editor, MarkdownView, EditorPosition } from "obsidian";

import type NoteIndex from "../note-index/service";
import { untilWorkspaceReady, waitUntil } from "@/utils/once";
import ZoteroPlugin from "@/zt-main";

declare module "obsidian" {
  interface Editor {
    cm: EditorView;
    getClickableTokenAt(pos: EditorPosition): {
      type: string;
      text: string;
      start: EditorPosition;
      end: EditorPosition;
    } | null;
  }
}

export class CitekeyClick extends Service {
  plugin = this.use(ZoteroPlugin);

  onload(): void {
    this.patchEditorClick();
  }

  async patchEditorClick() {
    const { workspace } = this.plugin.app,
      { noteIndex } = this.plugin;

    await untilWorkspaceReady(this.plugin.app);
    const hasMDView = () => workspace.getLeavesOfType("markdown").length > 0;
    await waitUntil({
      register: (cb) =>
        workspace.on("layout-change", () => {
          hasMDView() && cb();
        }),
      unregister: (ref) => workspace.offref(ref),
      escape: hasMDView,
    });

    const mdView = workspace.getLeavesOfType("markdown")[0]!
      .view as MarkdownView;

    this.register(
      around(mdView.editor.constructor.prototype as Editor, {
        getClickableTokenAt: (next) =>
          function (this: Editor, pos, ...args) {
            const result = next.call(this, pos, ...args);
            if (result) return result;
            return getClickableTokenAt.call(this, pos, noteIndex);
          },
      }),
    );
  }
}

function getClickableTokenAt(
  this: Editor,
  pos: EditorPosition,
  noteIndex: NoteIndex,
): {
  type: string;
  text: string;
  start: EditorPosition;
  end: EditorPosition;
} | null {
  const cm = this.cm,
    doc = cm.state.doc,
    tokens = [],
    line = doc.line(pos.line + 1),
    syntax = syntaxTree(cm.state);
  let lineFrom = line.from;
  syntax.iterate({
    from: line.from,
    to: line.to,
    enter: (node) => {
      const type = node.type,
        from = node.from,
        to = node.to,
        types = type.prop(tokenClassNodeProp);
      if (!types) return;
      if (lineFrom < from) {
        tokens.push({ type: "", from: lineFrom, to: from });
      }
      tokens.push({ type: types, from: from, to: to });
      lineFrom = to;
    },
  });
  if (lineFrom < line.to) {
    tokens.push({
      type: "",
      from: lineFrom,
      to: line.to,
    });
  }
  const offset = this.posToOffset(pos);
  let iTokenAtPos = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.from <= offset && token.to >= offset) {
      iTokenAtPos = i;
      break;
    }
  }
  if (iTokenAtPos < 0) return null;

  // the following is custom function that is different from the original function
  const tokenAtPos = tokens[iTokenAtPos];
  const types = tokenAtPos.type.split(" ");
  if (!types.includes("hmd-barelink")) return null;
  const text = doc.sliceString(tokenAtPos.from, tokenAtPos.to);
  if (!text.startsWith("@")) return null;
  const citekey = text.slice(1);
  if (!noteIndex.citekeyCache.has(citekey)) return null;
  const [note] = noteIndex.citekeyCache.get(citekey)!;
  return {
    type: "internal-link",
    text: note,
    start: this.offsetToPos(tokenAtPos.from),
    end: this.offsetToPos(tokenAtPos.to),
  };
}
