import { context } from "esbuild";

import inlineWorker from "@obzt/esbuild-plugin-inline-worker";

const isDev = process.env.BUILD === "development";

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  platform: "browser",
  format: "esm",
  mainFields: ["browser", "module", "main"],
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
  target: "es2022",
};
try {
  const ctx = await context({
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
  if (isDev) {
    await ctx.watch();
  } else {
    await ctx.dispose();
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
