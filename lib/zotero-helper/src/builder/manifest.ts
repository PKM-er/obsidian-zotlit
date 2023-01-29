import { resolve } from "path";
import { join } from "path/posix";
import { fileURLToPath } from "url";
import { D } from "@mobily/ts-belt";
import { renderFile } from "eta";
import type { ContentURIManifest } from "./chrome.js";
import type { PackageInfo } from "./parse.js";

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
export function genManifestJson(
  info: PackageInfo,
  content: ContentURIManifest,
) {
  const { name, version, description, author, homepage, id, update, icons } =
    info;

  const output = {
    manifest_version: 2,
    name,
    author,
    version,
    description,
    homepage_url: homepage,
    // resources can be loaded by using a relative path directly
    icons: D.map(icons, (relative) => join(content.root, relative)),
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

export async function vaildataIcons(
  info: PackageInfo,
  content: ContentURIManifest,
) {
  // vaildate if icons exist
  await Promise.all(
    D.toPairs(info.icons).map(async ([id, relative]) => {
      const path = resolve("public", content.root, relative);
      if (await fs.pathExists(path)) return;
      throw new Error(`Icon ${id} is not found in ${path}`);
    }),
  );
}

export async function genInstallRdf(
  info: PackageInfo,
  content: ContentURIManifest,
) {
  info = D.updateUnsafe(
    info,
    "icons",
    // icon is loaded with `chrome://content`
    (icons) =>
      D.map(
        icons,
        (path) => new URL(path, `chrome://${content.id}/content/`).href,
      ),
  );

  return renderFile(installRdfTemplate, info, { varName: "pkg" });
}
