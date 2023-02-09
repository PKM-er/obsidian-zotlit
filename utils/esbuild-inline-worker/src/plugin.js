// @ts-check

import { mkdtemp, readFile } from "fs/promises";
import { basename, join } from "path";
import esbuild from "esbuild";
import { nanoid } from "nanoid/async";
import { tmpdir } from "os";
import { rmSync } from "fs";

const namespace = "inline-worker";
const toUniqueFilename = async (/** @type {string} */ path) => {
  const base = basename(path).split("."),
    ext = base.pop();
  return `${base.join(".")}_${await nanoid(5)}.${ext}`;
};

/**
 *
 * @param {{ watch: boolean; cachedir?: string; codeLoader?: "dataurl" | "text"; filter?: { pattern: RegExp; transform?: (path: string, pattern: RegExp) => string; }; buildOptions: (ctx: {path: string, resolveDir: string; entryPoint: string;}) => import("esbuild").BuildOptions; }} param0
 * @returns {import("esbuild").Plugin}
 */
export const inlineWorkerPlugin = ({
  watch,
  cachedir: cacheDirRoot = tmpdir(),
  codeLoader = "text",
  filter = {
    pattern: /^worker:/,
    transform: (path, pattern) => path.replace(pattern, ""),
  },
  buildOptions,
}) => ({
  name: "esbuild-plugin-inline-worker",
  setup: async (build) => {
    if (!watch) {
      build.onResolve(
        { filter: filter.pattern },
        async ({ path, resolveDir, ...rest }) => {
          if (filter.transform) {
            path = filter.transform(path, filter.pattern);
          }
          const { path: entryPoint } = await build.resolve(path, {
            resolveDir,
            ...rest,
          });
          return {
            path: entryPoint,
            namespace,
            pluginData: { path, resolveDir },
          };
        }
      );
      build.onLoad(
        { filter: /.*/, namespace },
        async ({ path: workerPath, pluginData }) => {
          const code = await buildWorker(
            workerPath,
            buildOptions({
              path: pluginData.path,
              entryPoint: workerPath,
              resolveDir: pluginData.resolveDir,
            })
          );
          return { contents: code, loader: codeLoader };
        }
      );
    } else {
      /**
       * @type {Record<string, string>}
       * id -> entryPoint
       */
      const workerEntryPoints = {};
      /**
       * @type {Record<string, import("esbuild").BuildContext>}
       * id -> context
       */
      const workerBuilders = {};

      const cacheDir = await mkdtemp(join(cacheDirRoot, "epiw-"));
      build.onResolve(
        { filter: filter.pattern },
        async ({ path, resolveDir, ...rest }) => {
          if (filter.transform) {
            path = filter.transform(path, filter.pattern);
          }
          const { path: entryPoint } = await build.resolve(path, {
            resolveDir,
            ...rest,
          });
          const id =
            workerEntryPoints[entryPoint] ??
            (workerEntryPoints[entryPoint] = await toUniqueFilename(
              entryPoint
            ));

          const outfile = join(cacheDir, id);

          const output = { path: outfile, namespace, watchFiles: [outfile] };

          if (workerBuilders[id]) {
            return output;
          }
          const builder = await prepareWorkerBuilder(entryPoint, {
            ...buildOptions({ path, resolveDir, entryPoint }),
            outfile,
          });
          workerBuilders[id] = builder;
          await builder.rebuild();
          await builder.watch();
          return output;
        }
      );
      build.onLoad({ filter: /.*/, namespace }, async ({ path }) => {
        const code = await readFile(path, "utf-8");
        return { contents: code, loader: codeLoader };
      });
      build.onDispose(() => {
        Promise.all(
          Object.values(workerBuilders).map((ctx) => ctx.dispose())
        ).then(() => rmSync(cacheDir, { recursive: true, force: true }));
      });
    }
  },
});

/**
 *
 * @param {string} entryPoint
 * @param {import("esbuild").BuildOptions} extraConfig
 * @returns {Promise<string>}
 */
async function buildWorker(entryPoint, { outdir, outfile, ...extraConfig }) {
  const result = await esbuild.build({
    target: "es2017",
    format: "esm",
    minify: true,
    ...extraConfig,
    entryPoints: [entryPoint],
    write: false, // write in memory
    bundle: true,
  });
  return result.outputFiles[0].text;
}

/**
 *
 * @param {string} entryPoint
 * @param {import("esbuild").BuildOptions & Required<Pick<import("esbuild").BuildOptions, "outfile">>} extraConfig
 * @returns {Promise<import("esbuild").BuildContext>}
 */
const prepareWorkerBuilder = async (entryPoint, { outdir, ...extraConfig }) => {
  if (!extraConfig.outfile) {
    throw new Error("outfile is required");
  }
  const context = await esbuild.context({
    target: "es2017",
    format: "esm",
    minify: true,
    ...extraConfig,
    entryPoints: [entryPoint],
    write: true,
    bundle: true,
  });
  return context;
};
