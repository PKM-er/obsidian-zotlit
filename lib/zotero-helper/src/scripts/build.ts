import { build } from "../builder/build.js";
import { bundle, preparePackage, readPackageJson } from "./pack.js";

const packageJson = await readPackageJson();

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/main.ts";

await preparePackage(outDir, packageJson);

await build({
  entryPoints: [entryPoint],
  outdir: outDir,
  minify: true,
  logLevel: "error",
  sourcemap: false,
});

await bundle(outDir, packageJson);
