import { resolve } from "path";
import { join } from "path/posix";
import { fileURLToPath } from "url";
import { D } from "@mobily/ts-belt";
import { renderFile } from "eta";
import { toIdShort } from "../utils.js";
import { getInfoFromPackageJson } from "./parse.js";

const installRdfTemplate = resolve(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "public",
  "install.rdf.ejs",
);

/**
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
 */
export function genManifestJson(packageJson: Record<string, unknown>) {
  const { name, version, description, author, homepage, id, update, icons } =
    getInfoFromPackageJson(packageJson);

  const output = {
    manifest_version: 2,
    name,
    author,
    version,
    description,
    homepage_url: homepage,
    // resources can be loaded by using a relative path directly
    icons: D.map(icons, (path) => join("chrome", path)),
    applications: {
      zotero: {
        id,
        update_url: update.versions,
        strict_min_version: "6.999",
        strict_max_version: "7.0.*",
      },
    },
  };
  return JSON.stringify(output, null, 2);
}

export async function genInstallRdf(packageJson: Record<string, unknown>) {
  let info = getInfoFromPackageJson(packageJson);

  info = D.updateUnsafe(
    info,
    "icons",
    // icon need to be loaded with `chrome://` content URLs
    (icons) =>
      D.map(
        icons,
        (path) => new URL(path, `chrome://${toIdShort(info.id)}`).href,
      ),
  );

  return renderFile(installRdfTemplate, info, { varName: "pkg" });
}
