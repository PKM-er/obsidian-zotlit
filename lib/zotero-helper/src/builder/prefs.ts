import { isObject } from "@mobily/ts-belt/Guards";
import { toIdShort } from "../utils.js";
import { getInfoFromPackageJson } from "./parse.js";

export async function genPrefsJs(
  json: unknown,
  packageJson: Record<string, unknown>,
) {
  if (!isObject(json)) {
    throw new Error("Invalid JSON: not an Record");
  }
  const { id } = getInfoFromPackageJson(packageJson);
  return Object.entries(json)
    .map(([key, value]) => {
      const prefName = prefPrefix(id) + key;
      return `pref("${prefName}", ${JSON.stringify(value)});`;
    })
    .join("\n");
}

function prefPrefix(id: string) {
  return `extensions.${toIdShort(id)}.`;
}
