import "zx/globals";

import { join } from "path";
import { zip } from "compressing";
import { genInstallRdf, genManifestJson } from "../builder/manifest.js";

export async function readPackageJson() {
  return JSON.parse(await fs.readFile("package.json", "utf-8"));
}

export async function prepare(
  outDir: string,
  packageJson: Record<string, unknown>,
) {
  await fs.emptyDir(outDir);
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

export async function bundle(outDir: string, pluginId: string) {
  await zip.compressDir(outDir, join(outDir, `${pluginId}.xpi`));
}
