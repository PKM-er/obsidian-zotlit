import { Service } from "@ophidian/core";
import ZoteroPlugin from "../../zt-main";
import { NoteFieldsSuggest } from "./suggest";

export class NoteFields extends Service {
  plugin = this.use(ZoteroPlugin);
  onload(): void {
    this.plugin.registerEditorSuggest(this.use(NoteFieldsSuggest));
  }
}
