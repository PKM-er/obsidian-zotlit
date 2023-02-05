import type { AttachmentInfo } from "@obzt/database";
import type { FuzzyMatch } from "obsidian";
import { FuzzySuggestModalWithPromise } from "@/components/suggester/index.js";

export class AttachmentSelectModal extends FuzzySuggestModalWithPromise<AttachmentInfo> {
  constructor(public attachments: AttachmentInfo[]) {
    super(app);
  }
  getItems(): AttachmentInfo[] {
    return this.attachments;
  }
  renderSuggestion(item: FuzzyMatch<AttachmentInfo>, el: HTMLElement): void {
    el.addClass("mod-complex");
    const contentEl = el
      .createDiv("suggestion-content")
      .createDiv("suggestion-title")
      .createSpan();
    const auxEl = el.createDiv("suggestion-aux");
    super.renderSuggestion(item, contentEl);
    auxEl
      .createEl("kbd", "suggestion-hotkey")
      .setText((item.item.annotCount ?? 0).toString());
  }

  getItemText(item: AttachmentInfo): string {
    return item.path?.replace(/^storage:/, "") ?? item.key;
  }

  // get result in promise
  onChooseItem(): void {
    return;
  }
}
