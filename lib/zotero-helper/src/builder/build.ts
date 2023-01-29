import { rename } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import type { Plugin, BuildOptions } from "esbuild";
import { context } from "esbuild";
import { styleCss, bootstrapJs } from "../const.js";
import { toIdShort } from "../utils.js";
import { getInfoFromPackageJson } from "./parse.js";

export async function build({
  entryPoints,
  outdir,
  outfile,
  ...options
}: BuildOptions) {
  if (!Array.isArray(entryPoints) || typeof entryPoints[0] !== "string") {
    throw new Error("only one entry point is supported");
  }
  const ctx = await context({
    logLevel: "info",
    ...options,
    outfile: join(outdir ?? "dist", bootstrapJs),
    target: "firefox60",
    format: "iife",
    platform: "browser",
    globalName: "Hooks",
    define: {
      // zotero has no window.setTimeout in extension context...
      setTimeout: "mainWindow.setTimeout",
      fetch: "mainWindow.fetch",
    },
    bundle: true,
    entryPoints: [bootstrapFile],
    footer: {
      // expose bootstrap functions
      js: `var{install,startup,shutdown,uninstall}=Hooks;`,
    },
    plugins: [
      resolvePlugin(entryPoints[0]),
      renameStylesheet,
      ...(options.plugins ?? []),
    ],
  });
  return ctx;
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
    build.onResolve({ filter: /^@manifest$/ }, () => {
      return { path: resolve("package.json"), namespace: "pkg" };
    });
    build.onLoad(
      { filter: /package\.json$/, namespace: "pkg" },
      async ({ path }) => {
        const { id, version } = await fs
            .readJSON(path)
            .then(getInfoFromPackageJson),
          idShort = toIdShort(id);
        return {
          loader: "js",
          contents: `
export const id = "${id}";
export const idShort = "${idShort}";
export const version = "${version}";
`,
        };
      },
    );
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
