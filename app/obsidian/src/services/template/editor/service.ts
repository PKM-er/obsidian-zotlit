import type { Extension } from "@codemirror/state";
import { Service, calc, effect } from "@ophidian/core";
import { SettingsService, skip } from "@/settings/base";
import ZoteroPlugin from "@/zt-main";
import { bracketExtension } from "./bracket";
import { EtaSuggest } from "./suggester";

export class TemplateEditorHelper extends Service {
  /** null if not registered */
  #editorExtensions: Extension[] | null = null;

  plugin = this.use(ZoteroPlugin);

  settings = this.use(SettingsService);

  #registerEtaEditorHelper() {
    this.plugin.registerEditorSuggest(new EtaSuggest(this.plugin.app));
  }

  @calc
  get etaBracketPairing() {
    return this.settings.current?.autoPairEta;
  }
  #setEtaBracketPairing(enable: boolean) {
    const loadedBefore = this.#editorExtensions !== null;
    if (this.#editorExtensions === null) {
      this.#editorExtensions = [];
      this.plugin.registerEditorExtension(this.#editorExtensions);
    } else {
      this.#editorExtensions.length = 0;
    }
    if (enable) {
      this.#editorExtensions.push(bracketExtension(this.plugin.app.vault));
    }
    if (loadedBefore) {
      this.plugin.app.workspace.updateOptions();
    }
  }

  onload(): void {
    this.#registerEtaEditorHelper();
    this.register(
      effect(
        skip(
          () => this.#setEtaBracketPairing(this.etaBracketPairing),
          () => this.etaBracketPairing,
        ),
      ),
    );
  }
}
