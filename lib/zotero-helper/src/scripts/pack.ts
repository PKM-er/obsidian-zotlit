import "zx/globals";

import { tmpdir } from "os";
import { join } from "path";
import { zip } from "compressing";
import {
  genChromeManifest,
  getContentURIDef,
  parseChromeManifest,
} from "../builder/chrome.js";
import {
  genInstallRdf,
  genManifestJson,
  vaildataIcons,
} from "../builder/manifest.js";
import { getInfoFromPackageJson } from "../builder/parse.js";
import { genPrefsJs } from "../builder/prefs.js";
import { toIdShort } from "../utils.js";

export async function readPackageJson() {
  return JSON.parse(await fs.readFile("package.json", "utf-8"));
}

export async function preparePackage(
  outDir: string,
  packageJson: Record<string, unknown>,
) {
  await fs.emptyDir(outDir);

  await fs.writeFile(
    join(outDir, "prefs.js"),
    await genPrefsJs(await fs.readJson("prefs.json"), packageJson),
  );
  // copy assets to dist folder
  await fs.copy("public", outDir);

  const info = getInfoFromPackageJson(packageJson);

  const chromeManifest = parseChromeManifest(
    await fs.readFile("chrome.manifest", "utf-8"),
    info,
  );
  const contentURI = getContentURIDef(chromeManifest);

  await vaildataIcons(info, contentURI);

  await fs.writeFile(
    join(outDir, "manifest.json"),
    genManifestJson(info, contentURI),
  );
  await fs.writeFile(
    join(outDir, "install.rdf"),
    await genInstallRdf(info, contentURI),
  );
  await fs.writeFile(
    join(outDir, "chrome.manifest"),
    genChromeManifest(chromeManifest),
  );
}

export async function bundle(
  outDir: string,
  packageJson: Record<string, unknown>,
) {
  const { version, id } = getInfoFromPackageJson(packageJson);

  const tmpDir = await fs.mkdtemp(join(tmpdir(), "ztpkg-"));
  const xpi = `${toIdShort(id)}-${version}.xpi`;

  await zip.compressDir(outDir, join(tmpDir, xpi), {
    ignoreBase: true,
  });
  await fs.move(join(tmpDir, xpi), join(outDir, xpi), { overwrite: true });
  await fs.remove(tmpDir);
}
