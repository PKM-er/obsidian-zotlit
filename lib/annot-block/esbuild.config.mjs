import { build } from "esbuild";

import inlineWorker from "@obzt/esbuild-plugin-inline-worker";
import { readFile } from "fs/promises";

const isDev = process.env.BUILD === "development";

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  watch: isDev,
  format: "esm",
  mainFields: ["browser", "module", "main"],
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
  target: "es2022",
};

/** @type import("esbuild").Plugin */
const patchWorkerEnv = {
  name: "patch-worker-env",
  setup(build) {
    build.onLoad(
      { filter: /decode-named-character-reference\/index\.dom\.js$/ },
      async (args) => ({
        contents: await readFile(args.path.replace(/dom\.js$/, "js"), "utf8"),
        loader: "js",
      }),
    );
  },
};

try {
  await build({
    ...opts,
    platform: "browser",
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    logLevel: isDev ? "info" : "silent",
    sourcemap: "external",
    plugins: [
      inlineWorker({
        ...opts,
        platform: "browser",
        external: ["sqlite3"],
        sourcemap: isDev ? "inline" : false,
        plugins: [patchWorkerEnv],
      }),
    ],
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
