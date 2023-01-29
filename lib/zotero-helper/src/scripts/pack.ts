import "zx/globals";

import { join } from "path";
import { zip } from "compressing";
import { genInstallRdf, genManifestJson } from "../builder/manifest.js";
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

  await fs.writeFile(
    join(outDir, "manifest.json"),
    genManifestJson(packageJson),
  );
  await fs.writeFile(
    join(outDir, "install.rdf"),
    await genInstallRdf(packageJson),
  );
}

export async function bundle(
  outDir: string,
  packageJson: Record<string, unknown>,
) {
  const { version, id } = getInfoFromPackageJson(packageJson);

  const tmpDir = await fs.mkdtemp("ztpkg-");
  const xpi = `${toIdShort(id)}-${version}.xpi`;

  await zip.compressDir(outDir, join(tmpDir, xpi), {
    ignoreBase: true,
  });
  await fs.move(join(tmpDir, xpi), join(outDir, xpi), { overwrite: true });
  await fs.remove(tmpDir);
}
