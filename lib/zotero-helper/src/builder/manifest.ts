import { resolve } from "path";
import { join } from "path/posix";
import { fileURLToPath } from "url";
import { D } from "@mobily/ts-belt";
import { renderFile } from "eta";
import { getInfoFromPackageJson } from "./parse.js";
/**
 * @param pluginIdFull plugin id in format of "make-it-red@zotero.org"
 */
function toIdShort(pluginIdFull: string) {
  return pluginIdFull.split("@")[0];
}

const installRdfTemplate = resolve(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "public",
  "install.rdf.ejs",
);

export function genManifestJson(packageJson: Record<string, unknown>) {
  const {
    name,
    version,
    description,
    homepage,
    zotero: { id, update_url, icons },
  } = getInfoFromPackageJson(packageJson);

  const output = {
    manifest_version: 2,
    name,
    version,
    description,
    homepage_url: homepage,
    // resources can be loaded by using a relative path directly
    icons: D.map(icons, (path) => join("chrome", path)),
    applications: {
      zotero: {
        id,
        update_url,
        strict_min_version: "6.999",
        strict_max_version: "7.0.*",
      },
    },
  };
  return JSON.stringify(output, null, 2);
}

export async function genInstallRdf(packageJson: Record<string, unknown>) {
  const info = getInfoFromPackageJson(packageJson);

  const { icons, id } = info.zotero;

  // icon need to be loaded with `chrome://` content URLs
  info.zotero.icons = D.map(icons, (path) =>
    join(`chrome://${toIdShort(id)}`, path),
  );
  return renderFile(installRdfTemplate, info, { varName: "pkg" });
}
