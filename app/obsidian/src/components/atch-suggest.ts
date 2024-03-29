import type { AttachmentInfo, RegularItemInfoBase } from "@obzt/database";
import {
  cacheActiveAtch,
  isAnnotatableAttachment,
  isFileAttachment,
} from "@obzt/database";
import type { App, FuzzyMatch } from "obsidian";
import { FuzzySuggestModal } from "obsidian";
import { openModalFuzzy } from "./basic/modal";

export class AttachmentPopupSuggest extends FuzzySuggestModal<AttachmentInfo> {
  constructor(public attachments: AttachmentInfo[], app: App) {
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
  onChooseItem() {
    return;
  }
}

export async function chooseAttachment(
  attachments: AttachmentInfo[],
  app: App,
) {
  if (attachments.length === 1) return attachments[0];
  if (!attachments.length) {
    // new Notice("No attachment found for this item");
    return null;
  }
  const result = await openModalFuzzy(
    new AttachmentPopupSuggest(attachments, app),
  );
  return result?.value ?? null;
}

export async function chooseFileAtch(attachments: AttachmentInfo[], app: App) {
  const fileAttachments = attachments.filter(isFileAttachment);
  return await chooseAttachment(fileAttachments, app);
}

export function cacheAttachmentSelect(
  selected: AttachmentInfo,
  item: RegularItemInfoBase,
) {
  cacheActiveAtch(window.localStorage, item, selected.itemID);
}

export async function chooseAnnotAtch(attachments: AttachmentInfo[], app: App) {
  const fileAttachments = attachments.filter(isAnnotatableAttachment);
  return await chooseAttachment(fileAttachments, app);
}
