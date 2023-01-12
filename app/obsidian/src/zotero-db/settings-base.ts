import { D } from "@mobily/ts-belt";
import { use } from "@ophidian/core";
import ZoteroPlugin from "../zt-main";

abstract class Settings<Options extends Record<string, any>> {
  protected use = use.this;
  protected get manifest() {
    return this.use(ZoteroPlugin).manifest;
  }
  abstract getDefaults(): Options;
  protected value: Options;

  constructor() {
    const defaults = this.getDefaults();
    this.value = defaults;
    Object.defineProperties(
      this,
      D.mapWithKey(defaults, (key) => ({
        get: () => this.value[key],
      })),
    );
  }

  setOption<K extends keyof Options>(
    key: K,
    value: Options[K],
  ): { apply: () => Promise<void> } {
    this.value[key] = value;
    return { apply: () => this.apply(key) };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async apply(key: keyof Options) {
    return;
  }
  async applyAll() {
    await Promise.all(D.keys(this.value).map((k) => this.apply(k)));
  }

  toJSON(): Options {
    return this.value;
  }

  fromJSON(json: Options): void {
    const optKeys = D.keys(this.getDefaults());
    this.value = {
      ...this.value,
      ...D.selectKeys(json, optKeys),
    };
  }
}

export default Settings as {
  // extends to expose values inside this.settings
  new <Options extends Record<string, any>>(): Settings<Options> &
    Readonly<Options>;
};
