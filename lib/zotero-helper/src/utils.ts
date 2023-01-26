import { D } from "@mobily/ts-belt";
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
  update_url: string;
  id: string;
  icons: Record<string, string>;
}
export function isZoterField(x: unknown): x is ZoteroField {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as ZoteroField).update_url === "string" &&
    typeof (x as ZoteroField).id === "string" &&
    typeof (x as ZoteroField).icons === "object" &&
    (x as ZoteroField).icons !== null &&
    D.isNotEmpty((x as ZoteroField).icons)
  );
}
