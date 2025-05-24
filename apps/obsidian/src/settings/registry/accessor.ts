import type { LatestPluginSettings } from "./type";
import type {
  BooleanSettings,
  NumberSettings,
  OptionalStringSettings,
  StringSettings,
} from "./type";
import type ZotlitSettings from "../registry";
import { naSymbol } from "../registry";

export class SettingAccessor {
  constructor(private settings: ZotlitSettings) {}

  create<K extends keyof LatestPluginSettings>(key: K) {
    const initSettings = this.settings.value;
    if (!initSettings) throw new Error("Settings not loaded");
    const settingSnapshot = initSettings[key];

    return {
      value: settingSnapshot,
      set: (value: LatestPluginSettings[K]) => {
        this.settings.set(key, value);
      },
      sub: (
        handler: (
          now: LatestPluginSettings[K],
          prev: LatestPluginSettings[K] | typeof naSymbol,
        ) => void,
      ) => {
        return this.settings.subscribe(key, handler);
      },
    };
  }

  number(key: NumberSettings) {
    return this.create<NumberSettings>(key);
  }

  boolean(key: BooleanSettings) {
    const acc = this.create<BooleanSettings>(key);
    return {
      value: acc.value,
      set: acc.set,
      sub: (handler: (now: boolean, prev: boolean | null) => void) => {
        return acc.sub((now, prev) => {
          handler(now, prev === naSymbol ? null : prev);
        });
      },
    };
  }

  inputNumber(key: NumberSettings) {
    const accessor = this.create<NumberSettings>(key);

    return {
      value: accessor.value.toString(),
      set: (value: string) => {
        const num = Number.parseFloat(value);
        if (Number.isNaN(num)) return;
        accessor.set(num);
      },
      sub: (handler: (now: string, prev: string | null) => void) => {
        return accessor.sub((now, prev) => {
          handler(now.toString(), prev === naSymbol ? null : prev.toString());
        });
      },
    };
  }

  optionalString(key: OptionalStringSettings) {
    const acc = this.create<OptionalStringSettings>(key);
    return {
      value: acc.value,
      set: acc.set,
      sub: (
        handler: (
          now: string | undefined,
          prev: string | undefined | null,
        ) => void,
      ) => {
        return acc.sub((now, prev) =>
          handler(now, prev === naSymbol ? undefined : prev),
        );
      },
    };
  }
  string(key: StringSettings) {
    const acc = this.create<StringSettings>(key);
    return {
      value: acc.value,
      set: acc.set,
      sub: (handler: (now: string, prev: string | null) => void) => {
        return acc.sub((now, prev) =>
          handler(now, prev === naSymbol ? null : prev),
        );
      },
    };
  }
}
