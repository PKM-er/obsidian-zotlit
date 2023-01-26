import { build } from "../builder/build.js";
import { prepare, readPackageJson } from "./prepare.js";
import { readStartConfig, start } from "./start.js";

const packageJson = await readPackageJson();

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/index.ts";
const configFile = argv.config || "start.yml";

const startConfig = await readStartConfig(configFile);

await prepare(outDir, packageJson);

let zotero: { kill: () => void } | null = null;

const ctx = await build({
  entryPoints: [entryPoint],
  outdir: outDir,
  sourcemap: "inline",
  plugins: [
    {
      name: "reload-zotero",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length === 0) {
            zotero?.kill();
            zotero = await start(startConfig);
          }
        });
        build.onDispose(() => {
          zotero?.kill();
          zotero = null;
        });
      },
    },
  ],
});

await ctx.watch();
ctx.dispose();
