import type { AttachmentInfo, RegularItemInfoBase } from "@obzt/database";
import { cacheActiveAtch, isFileAttachment } from "@obzt/database";
import type { FuzzyMatch } from "obsidian";
import { Notice, FuzzySuggestModal } from "obsidian";
import { openModalFuzzy } from "./basic/modal";

export class AttachmentPopupSuggest extends FuzzySuggestModal<AttachmentInfo> {
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
  onChooseItem() {
    return;
  }
}

export async function chooseAttachment(attachments: AttachmentInfo[]) {
  if (attachments.length === 1) return attachments[0];
  if (!attachments.length) {
    new Notice("No attachment found for this item");
    return null;
  }
  const result = await openModalFuzzy(new AttachmentPopupSuggest(attachments));
  return result?.value ?? null;
}

export async function chooseFileAtch(attachments: AttachmentInfo[]) {
  const fileAttachments = attachments.filter(isFileAttachment);
  return await chooseAttachment(fileAttachments);
}

export async function chooseFileAtchAndCache(
  item: RegularItemInfoBase,
  allAttachments: AttachmentInfo[],
) {
  const selected = await chooseFileAtch(allAttachments);
  if (!selected) return null;
  cacheActiveAtch(window.localStorage, item, selected.itemID);
  return selected;
}

export async function choosePDFAtch(attachments: AttachmentInfo[]) {
  const fileAttachments = attachments.filter(
    (i) => isFileAttachment(i) && i.path?.endsWith(".pdf"),
  );
  return await chooseAttachment(fileAttachments);
}
