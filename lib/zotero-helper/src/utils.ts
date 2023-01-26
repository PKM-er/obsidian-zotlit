import { D, G } from "@mobily/ts-belt";
import e from "escape-string-regexp";

export function addToPref(
  content: string,
  key: string,
  value: number | string | boolean,
) {
  // user_pref("...", ...);
  const pattern = new RegExp(
      `${e(`user_pref("${key}",`)}\\s+.+${e(");")}`,
      "g",
    ),
    replaceWith = `user_pref("${key}", ${JSON.stringify(value)});`;
  let replaceDone = false;
  // user_pref("...", ...);
  const replaced = content.replace(pattern, () => {
    if (replaceDone) return "";
    replaceDone = true;
    return replaceWith;
  });
  if (replaceDone) {
    return replaced;
  } else {
    return content + "\n" + replaceWith;
  }
}
export function removeFromPref(content: string, key: string) {
  // user_pref("...", ...);
  const pattern = new RegExp(
    `${e(`user_pref("${key}",`)}\\s+.+${e(");")}`,
    "g",
  );
  return content.replace(pattern, "");
}

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x !== "";
}
interface ZoteroField {
  id: string;
  name: string;
  icons: Record<string, string>;
  update: {
    /** update.json */
    versions: string;
    /** url to each update's release */
    download: string;
    /** url to each update's log */
    info: string;
  };
}
export function isZoterField(x: unknown): x is ZoteroField {
  if (!G.isObject(x)) return false;
  const { id, name, icons, update } = x as unknown as ZoteroField;
  if (!isNonEmptyString(id) || !isNonEmptyString(name)) return false;
  if (icons === null || !G.isObject(icons) || D.isEmpty(icons)) return false;
  if (!G.isObject(update)) return false;
  const { versions, download, info } = update;
  if (
    !isNonEmptyString(versions) ||
    !isNonEmptyString(download) ||
    !isNonEmptyString(info)
  )
    return false;

  return true;
}

/**
 * @param pluginIdFull plugin id in format of "make-it-red@zotero.org"
 */
export function toIdShort(pluginIdFull: string) {
  return pluginIdFull.split("@")[0];
}
