import "zx/globals";
import { join } from "path";
import { zip } from "compressing";
import { build } from "../builder/build.js";
import { genInstallRdf, genManifestJson } from "../builder/manifest.js";

const packageJson = await fs.readFile("package.json", "utf-8").then(JSON.parse);

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/index.ts";

await fs.emptyDir(outDir);
await fs.copy("public", outDir);

await fs.writeFile(join(outDir, "manifest.json"), genManifestJson(packageJson));
await fs.writeFile(
  join(outDir, "install.rdf"),
  await genInstallRdf(packageJson),
);

await build({ entryPoints: [entryPoint], outdir: outDir });

await zip.compressDir(outDir, join(outDir, `${packageJson.name}.xpi`));
