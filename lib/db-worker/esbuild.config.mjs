import { build } from "esbuild";

import inlineWorker from "@obzt/esbuild-plugin-inline-worker";

const isDev = process.env.BUILD === "development";

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  watch: false,
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
    format: "esm",
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    logLevel: isDev ? "info" : "silent",
    sourcemap: "external",
    plugins: [
      inlineWorker({
        ...opts,
        format: "cjs",
        sourcemap: isDev ? "inline" : false,
      }),
    ],
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
