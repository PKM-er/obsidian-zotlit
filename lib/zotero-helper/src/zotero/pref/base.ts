import { Component } from "../misc.js";
import type { Zotero7 } from "../polyfill/index.js";
import type { IPreferencePaneDescriptor } from "../polyfill/pref-type.js";

export interface IPaneDescriptor extends IPreferencePaneDescriptor {
  defaultNS?: "HTML" | "XUL";
  /** only work in Zotero 6 */
  onload?: () => any;
}

export class PreferencePane extends Component {
  constructor(private descriptor: IPaneDescriptor, app: Zotero7) {
    super();
    if (!app.PreferencePanes) {
      throw new Error("Zotero.PreferencePanes not defined");
    }
    this.app = app;
  }

  app: Zotero7;

  public onload(): void {
    const Zotero = this.app;
    const paneId = Zotero.PreferencePanes.register(this.descriptor);
    paneId.then((paneId) => {
      this.register(() => Zotero.PreferencePanes.unregister(paneId));
    });
  }

  public onunload(): void {
    return;
  }
}
