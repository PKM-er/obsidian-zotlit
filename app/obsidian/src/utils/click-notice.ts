import { Notice } from "obsidian";

export class ClickNotice extends Notice {
  constructor(
    message: string | ((desc: DocumentFragment) => void),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: (evt: MouseEvent) => any,
    timeout?: number,
  ) {
    super(typeof message === "string" ? message : "", timeout);
    this.noticeEl.addEventListener("click", action);
    if (typeof message === "function") {
      this.noticeEl.empty();
      const frag = new DocumentFragment();
      message(frag);
      this.noticeEl.append(frag);
    }
  }
}
