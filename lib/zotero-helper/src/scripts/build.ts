import { build } from "../builder/build.js";
import { bundle, preparePackage, readPackageJson } from "./pack.js";

const packageJson = await readPackageJson();

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/main.ts";

await preparePackage(outDir, packageJson);

const ctx = await build({
  entryPoints: [entryPoint],
  outdir: outDir,
  minify: true,
  sourcemap: false,
});
await ctx.dispose();

// remove .d.ts files
await glob(`${outDir}/**/*.d.ts`).then((dts) =>
  Promise.all(dts.map((f) => fs.rm(f))),
);

await bundle(outDir, packageJson);
