import { build } from "esbuild";

import inlineWorker from "@obzt/esbuild-plugin-inline-worker";

const isDev = process.env.BUILD === "development";

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  watch: isDev,
  platform: "node",
  format: "cjs",
  mainFields: ["browser", "module", "main"],
  minify: !isDev,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
};
try {
  await build({
    ...opts,
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    logLevel: isDev ? "info" : "silent",
    sourcemap: "external",
    plugins: [
      inlineWorker({
        ...opts,
        external: ["sqlite3"],
        sourcemap: isDev ? "inline" : false,
      }),
    ],
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
