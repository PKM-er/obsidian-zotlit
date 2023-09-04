import type { CloseBracketConfig } from "@codemirror/autocomplete";
import { EditorState, Prec } from "@codemirror/state";
import type { Vault } from "obsidian";
import { editorInfoField } from "obsidian";
import { isEtaFile } from "../utils";

export const bracketExtension = (vault: Vault) =>
  Prec.highest(
    EditorState.languageData.of((state) => {
      const brackets = [];
      // default behavior
      const pb = vault.getConfig("autoPairBrackets"),
        pm = vault.getConfig("autoPairMarkdown");
      pb && brackets.push("(", "[", "{", "'", '"');
      pm && brackets.push("*", "_", "`", "```");
      // custom match '<' & '%' on eta files
      const fileinfo = state.field(editorInfoField);
      if (fileinfo?.file && isEtaFile(fileinfo?.file)) {
        brackets.push("<", "%");
      }
      const closeBrackets: CloseBracketConfig = {
        brackets,
      };
      return [{ closeBrackets }];
    }),
  );
