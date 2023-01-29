import { rename } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { D } from "@mobily/ts-belt";
import type { Plugin, BuildOptions, BuildContext } from "esbuild";
import { context, build as _build } from "esbuild";
import { styleCss, bootstrapJs } from "../const.js";
import { toIdShort } from "../utils.js";
import { getContentURIDef, parseChromeManifest } from "./chrome.js";
import { getInfoFromPackageJson } from "./parse.js";

export async function build(
  options: BuildOptions,
  watch: true,
): Promise<BuildContext>;
export async function build(options: BuildOptions): Promise<void>;
export async function build(
  { entryPoints, outdir, outfile, ...options }: BuildOptions,
  watch = false,
): Promise<BuildContext | void> {
  if (!Array.isArray(entryPoints) || typeof entryPoints[0] !== "string") {
    throw new Error("only one entry point is supported");
  }
  const buildOpts = {
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
  } satisfies BuildOptions;

  if (watch) {
    return await context(buildOpts);
  } else {
    await _build(buildOpts);
  }
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
  async setup(build) {
    const info = getInfoFromPackageJson(await fs.readJSON("package.json")),
      manifest = parseChromeManifest(
        await fs.readFile("chrome.manifest", "utf-8"),
        info,
      ),
      contentURI = getContentURIDef(manifest);

    build.onResolve({ filter: /^@plugin$/ }, () => {
      return { path: resolve(entryPoint), namespace: "file" };
    });
    build.onResolve({ filter: /^@manifest$/ }, () => {
      return { path: resolve("package.json"), namespace: "pkg" };
    });
    build.onLoad(
      { filter: /package\.json$/, namespace: "pkg" },
      async ({ path }) => {
        const { id, version } = info,
          idShort = toIdShort(id),
          icons = JSON.stringify(
            D.map(info.icons, (relative) => join(contentURI.root, relative)),
          );
        return {
          loader: "js",
          contents: `
export const id = "${id}";
export const idShort = "${idShort}";
export const version = "${version}";
export const icons = ${icons}
`,
        };
      },
    );
    build.onResolve({ filter: /^@chrome$/, namespace: "file" }, () => {
      return { path: resolve("chrome.manifest"), namespace: "pkg" };
    });
    build.onLoad(
      { filter: /chrome\.manifest$/, namespace: "pkg" },
      async ({ path }) => {
        return {
          contents: `const manifest = ${JSON.stringify(
            manifest,
          )}; export default manifest;`,
          loader: "js",
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
