import { D } from "@mobily/ts-belt";
import { use } from "@ophidian/core";
import ZoteroPlugin from "../zt-main";

abstract class Settings<Options extends Record<string, any>> {
  protected use = use.this;
  protected get manifest() {
    return this.use(ZoteroPlugin).manifest;
  }
  abstract getDefaults(): Options;
  #value: Options;

  constructor() {
    const defaults = this.getDefaults();
    this.#value = defaults;
    Object.defineProperties(
      this,
      D.mapWithKey(defaults, (key) => ({
        get: () => this.#value[key],
        set: (newValue: any) => {
          this.#value[key] = newValue;
        },
      })),
    );
  }

  toJSON(): Options {
    return this.#value;
  }
  fromJSON(json: Options): void {
    this.#value = {
      ...this.#value,
      ...D.selectKeys(json, D.keys(this.getDefaults())),
    };
  }
}

export default Settings as {
  // extends to expose values inside this.settings
  new <Options extends Record<string, any>>(): Settings<Options> & Options;
};
