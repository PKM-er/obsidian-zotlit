import "obsidian";

import { Notice } from "obsidian";

declare module "obsidian" {
  interface Notice {
    noticeEl: HTMLElement;
  }
}

export class ClickNotice extends Notice {
  constructor(
    message: string | ((desc: DocumentFragment) => void),
    action: (evt: MouseEvent) => any,
    timeout?: number,
  ) {
    super(typeof message === "string" ? message : "", timeout);
    this.noticeEl.addEventListener("click", action);
    if (typeof message === "function") {
      this.noticeEl.empty();
      let frag = new DocumentFragment();
      message(frag);
      this.noticeEl.append(frag);
    }
  }
}
