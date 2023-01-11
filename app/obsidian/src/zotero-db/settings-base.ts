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
      })),
    );
  }

  async setOption<K extends keyof Options>(key: K, value: Options[K]) {
    this.#value[key] = value;
  }

  toJSON(): Options {
    return this.#value;
  }

  /**
   * init method, will call methods that apply these settings for the first time
   * @param apply whether to apply the settings using method defined in `setOption`
   */
  async fromJSON(json: Options, apply = true): Promise<void> {
    const optKeys = D.keys(this.getDefaults());
    if (!apply) {
      this.#value = {
        ...this.#value,
        ...D.selectKeys(json, optKeys),
      };
    } else {
      await Promise.all(
        optKeys.map((key) =>
          this.setOption(key, json[key] ?? this.#value[key]),
        ),
      );
    }
  }
}

export default Settings as {
  // extends to expose values inside this.settings
  new <Options extends Record<string, any>>(): Settings<Options> & {
    readonly [K in keyof Options]: Options[K];
  };
};
