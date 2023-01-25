import { Component } from "./misc.js";

abstract class Plugin_2 extends Component {
  public manifest?: Manifest;
  /**
   * https://contest-server.cs.uchicago.edu/ref/JavaScript/developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.html
   * The Services.jsm JavaScript code module offers a wide assortment of lazy getters that simplify the process of obtaining references to commonly used services.
   */
  public service?: any;
  private stringBundle?: {
    GetStringFromName: (name: string) => string;
  };
  get loaded() {
    return this.manifest !== undefined;
  }
  constructor(public app: typeof Zotero) {
    super();
  }

  load(manifest: Manifest, services: any) {
    this.manifest = manifest;
    this.service = services;
    super.load(manifest, services);
  }
  abstract onload(manifest: Manifest, services: any): void;
  unload(): void {
    super.unload();
    delete this.manifest;
  }
  async install() {
    await this.onInstall();
  }
  async uninstall() {
    await this.onUninstall();
  }
  abstract onInstall(): Promise<void> | void;
  abstract onUninstall(): Promise<void> | void;
}

interface Manifest {
  id: string;
  version: string;
  resourceURI: unknown;
  rootURI: string;
}

export { Plugin_2 as Plugin };
