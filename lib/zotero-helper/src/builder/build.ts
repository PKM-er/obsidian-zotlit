import { rename } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import type { Plugin, BuildOptions } from "esbuild";
import { build as _build } from "esbuild";
import { styleCss, bootstrapJs } from "../const.js";

export async function build({
  entryPoints,
  outdir,
  outfile,
  ...options
}: BuildOptions) {
  if (!Array.isArray(entryPoints) || typeof entryPoints[0] !== "string") {
    throw new Error("only one entry point is supported");
  }
  return await _build({
    ...options,
    outfile: join(outdir ?? "dist", bootstrapJs),
    target: "firefox60",
    bundle: true,
    format: "esm",
    entryPoints: [bootstrapFile],
    plugins: [
      resolvePlugin(entryPoints[0]),
      renameStylesheet,
      ...(options.plugins ?? []),
    ],
  });
}

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const bootstrapFile = resolve(
  __dirname,
  "..",
  "zotero",
  "scaffold",
  bootstrapJs,
);

const resolvePlugin = (entryPoint: string): Plugin => ({
  name: "resolve-plugin",
  setup(build) {
    build.onResolve({ filter: /^@plugin$/ }, () => {
      return { path: resolve(entryPoint), namespace: "file" };
    });
  },
});

const renameStylesheet: Plugin = {
  name: "rename-stylesheet",
  setup(build) {
    build.onEnd(async () => {
      // fix default css output file name
      const { outfile } = build.initialOptions;
      if (!outfile) return;
      try {
        await rename(
          outfile.replace(/\.js$/, ".css"),
          outfile.replace(bootstrapJs, styleCss),
        );
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    });
  },
};
