import type { Extension } from "@codemirror/state";
import { Service } from "@ophidian/core";
import { bracketExtension } from "./bracket";
import { EtaSuggest } from "./suggester";
import ZoteroPlugin from "@/zt-main";

export class TemplateEditorHelper extends Service {
  /** null if not registered */
  #editorExtensions: Extension[] | null = null;

  plugin = this.use(ZoteroPlugin);

  #registerEtaEditorHelper() {
    this.plugin.registerEditorSuggest(new EtaSuggest(this.plugin.app));
  }

  setEtaBracketPairing(enable: boolean) {
    const loadedBefore = this.#editorExtensions !== null;
    if (this.#editorExtensions === null) {
      this.#editorExtensions = [];
      this.plugin.registerEditorExtension(this.#editorExtensions);
    } else {
      this.#editorExtensions.length = 0;
    }
    if (enable) {
      this.#editorExtensions.push(bracketExtension);
    }
    if (loadedBefore) {
      app.workspace.updateOptions();
    }
  }

  onload(): void {
    this.#registerEtaEditorHelper();
  }
}
