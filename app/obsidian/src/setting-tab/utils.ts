import type { TextAreaComponent } from "obsidian";
import { debounce, Setting } from "obsidian";
import type ZoteroPlugin from "@/zt-main";

export function getPipeFunc(ctx: ZoteroPlugin, defaultContainer: HTMLElement) {
  return (s: Setting | HTMLElement | SettingMod, ...funcs: SettingMod[]) => {
    let setting =
      s instanceof Setting
        ? s
        : new Setting(typeof s === "function" ? defaultContainer : s);
    const functions = typeof s === "function" ? [s, ...funcs] : funcs;
    for (const func of functions) {
      setting = func(setting, ctx);
    }
    return setting;
  };
}

type SettingMod = (setting: Setting, ctx: ZoteroPlugin) => Setting;
type TextAreaSize = Partial<Record<"cols" | "rows", number>>;

type SetterResult = PromiseLike<boolean | void> | boolean | void;

export const addTextComfirm =
  (
    get: () => string,
    set: (value: string, text: TextAreaComponent) => SetterResult,
    size: TextAreaSize = {},
  ): SettingMod =>
  (setting, ctx) => {
    let component: TextAreaComponent;
    const onChange = async () => {
      const value = component.getValue();
      const result = await set(value, component);
      await saveSettings(result, ctx);
    };
    return setting
      .addTextArea((txt) => {
        component = txt;
        txt.setValue(get());
        Object.assign(txt.inputEl, size);
      })
      .addButton((btn) =>
        btn.setIcon("checkmark").setTooltip("Apply").onClick(onChange),
      );
  };

export const addTextField =
  (
    get: () => string,
    set?: (value: string) => SetterResult,
    size: TextAreaSize = {},
    timeout = 500,
  ): SettingMod =>
  (setting, ctx) =>
    setting.addTextArea((text) => {
      text.setValue(get());
      if (!set) return;
      const onChange = async (value: string) => {
        const result = await set(value);
        await saveSettings(result, ctx);
      };
      text.onChange(debounce(onChange, timeout, true));

      Object.assign(text.inputEl, { cols: 30, rows: 5, ...size });
    });

export const addToggle =
  (get: () => boolean, set?: (value: boolean) => SetterResult): SettingMod =>
  (setting, ctx) =>
    setting.addToggle((toggle) => {
      toggle.setValue(get());
      if (!set) return;
      toggle.onChange(async (value) => {
        const result = await set(value);
        await saveSettings(result, ctx);
      });
    });

const saveSettings = async (result: SetterResult, ctx: ZoteroPlugin) => {
  if (result !== false) await ctx.settings.save();
};
