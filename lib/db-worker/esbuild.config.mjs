import { build, context } from "esbuild";

import inlineWorker from "@obzt/esbuild-plugin-inline-worker";

const isDev = process.env.BUILD === "development";

/** @type import("esbuild").BuildOptions */
const baseOpts = {
  bundle: true,
  platform: "node",
  format: "esm",
  mainFields: ["browser", "module", "main"],
  minify: !isDev,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
};

/**
 * @param {boolean} watch
 * @returns {import("esbuild").BuildOptions}
 */
const opts = (watch) => ({
  ...baseOpts,
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  logLevel: isDev ? "info" : "silent",
  sourcemap: "external",
  plugins: [
    inlineWorker({
      ...baseOpts,
      format: "cjs",
      cachedir: "dist",
      sourcemap: isDev ? "inline" : false,
      watch,
    }),
  ],
});
try {
  if (isDev) {
    await (await context(opts(true))).watch();
  } else {
    await build(opts(false));
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
