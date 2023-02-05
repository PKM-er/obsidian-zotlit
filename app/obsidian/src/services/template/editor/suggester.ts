import type {
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import { EditorSuggest } from "obsidian";
import { isEtaFile } from "../utils";

interface EtaHint {
  prefix: "~" | "=" | " " | "_";
  name: string;
  description: string;
}
const hints: EtaHint[] = [
  {
    prefix: "=",
    name: "interpolate tag",
    description: "An interpolation outputs data into the template",
  },
  // {
  //   prefix: "~",
  //   name: "raw interpolate tag",
  //   description:
  //     "To avoid escaping a specific reference, you can use the raw prefix",
  // },
  {
    prefix: " ",
    name: "evaluation tag",
    description:
      "An evaluate tag inserts its contents into the template function.",
  },
  // {
  //   prefix: "_",
  //   name: "whitespace trimming",
  //   description: "control the whitespace trimming before or after tags",
  // },
];

export class EtaSuggest extends EditorSuggest<EtaHint> {
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null,
  ): EditorSuggestTriggerInfo | null {
    if (!file || !isEtaFile(file)) return null;
    const line = editor.getLine(cursor.line),
      sub = line.substring(0, cursor.ch);
    const match = sub.match(/<%([ =]?)$/);
    if (!match) return null;
    const [full, prefix] = match;
    const trailingSpace = line.substring(cursor.ch).match(/^([\w ]*)%>/);
    let end;
    if (!trailingSpace) {
      end = { ...cursor };
    } else {
      const [, spaces] = trailingSpace;
      if (prefix === " " && spaces.length === 1) return null;
      end = { ...cursor, ch: cursor.ch + spaces.length };
    }
    return {
      end,
      start: {
        ch: match.index! + full.length - prefix.length,
        line: cursor.line,
      },
      query: match[1],
    };
  }
  getSuggestions(
    context: EditorSuggestContext,
  ): EtaHint[] | Promise<EtaHint[]> {
    if (context.query) {
      return hints.filter((h) => h.prefix === context.query);
    } else return hints;
  }
  renderSuggestion(
    { prefix, name, description }: EtaHint,
    el: HTMLElement,
  ): void {
    if (prefix === " ") el.createSpan({ text: "No Prefix" });
    else el.createEl("code", { text: prefix });
    el.createDiv({ text: name });
    el.createDiv({ text: description });
  }
  selectSuggestion(
    { prefix }: EtaHint,
    _evt: MouseEvent | KeyboardEvent,
  ): void {
    if (!this.context) return;
    const { editor, end, start } = this.context;
    const toInsert = prefix === " " ? "  " : `= it. `;
    editor.transaction({
      changes: [{ from: start, to: end, text: toInsert }],
      selection: { from: { ...start, ch: start.ch + toInsert.length - 1 } },
    });
  }
}
