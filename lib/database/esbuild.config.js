import { build } from "esbuild";

import inlineWorker from "./scripts/inline-worker.js";

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  watch: false,
  platform: "node",
  format: "esm",
  mainFields: ["browser", "module", "main"],
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
};
try {
  await build({
    ...opts,
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    logLevel: "info",
    sourcemap: "external",
    plugins: [
      inlineWorker({
        ...opts,
        external: ["sqlite3"],
        format: "cjs",
        sourcemap: "inline",
      }),
    ],
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
