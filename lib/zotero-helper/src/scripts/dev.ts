import type { Plugin } from "esbuild";
import { build } from "../builder/build.js";
import { preparePackage, readPackageJson } from "./pack.js";
import { readStartConfig, start } from "./start.js";

const packageJson = await readPackageJson();

const outDir = argv["outdir"] || "dist";
const entryPoint = argv._[0] || "src/main.ts";
const configFile = argv.config || "start.yml";

const startConfig = await readStartConfig(configFile);

await preparePackage(outDir, packageJson);

let zotero: ProcessPromise | null = null;

const reloadZotero: Plugin = {
  name: "reload-zotero",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length === 0) {
        await zotero?.kill();
        const { prepare, run } = start(startConfig);
        await prepare();
        zotero = run().quiet().nothrow();
      }
    });
    build.onDispose(async () => {
      await zotero?.kill();
      zotero = null;
    });
  },
};

const ctx = await build(
  {
    entryPoints: [entryPoint],
    outdir: outDir,
    minify: false,
    sourcemap: "inline",
    plugins: [reloadZotero],
  },
  true,
);

await ctx.watch();
