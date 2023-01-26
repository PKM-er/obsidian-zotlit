import { build } from "../builder/build.js";
import { bundle, prepare, readPackageJson } from "./prepare.js";

const packageJson = await readPackageJson();

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/index.ts";

await prepare(outDir, packageJson);

await build({
  entryPoints: [entryPoint],
  outdir: outDir,
  minify: true,
  sourcemap: false,
});

await bundle(outDir, packageJson.zotero.id);
