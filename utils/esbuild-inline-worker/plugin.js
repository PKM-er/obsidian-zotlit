// @ts-check

import { mkdtemp, readFile } from "fs/promises";
import { basename, join } from "path";
import esbuild from "esbuild";
import { nanoid } from "nanoid/async";
import { tmpdir } from "os";
import { rmdirSync } from "fs";

const namespace = "inline-worker";
const toUniqueFilename = (/** @type {string} */ path) => {
  const base = basename(path).split("."),
  ext = base.pop();
  return `${base.join(".")}_${nanoid(5)}.${ext}`;
}
/**
 *
 * @param {import("esbuild").BuildOptions & { watch: boolean; cachedir?: string; codeLoader?: "dataurl" | "text"; filter?: {pattern:RegExp; transform:(path:string, pattern:RegExp)=>string} }} param0
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
  ...extraConfig
}) => ({
  name: "esbuild-plugin-inline-worker",
  setup: async (build) => {
    if (!watch) {
      build.onResolve({ filter: filter.pattern }, ({ path, resolveDir }) => {
        path = filter.transform(path, filter.pattern);
        if (!path.startsWith(".")) {
          throw new Error("Workers in external modules is not supported.");
        }
        return { path: join(resolveDir, path), namespace };
      });
      build.onLoad(
        { filter: /.*/, namespace },
        async ({ path: workerPath }) => {
          const code = await buildWorker(workerPath, extraConfig);
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
        async ({ path, resolveDir }) => {
          path = filter.transform(path, filter.pattern);
          if (!path.startsWith(".")) {
            throw new Error("Workers in external modules is not supported.");
          }
          const entryPoint = join(resolveDir, path),
            id = workerEntryPoints[entryPoint]
              ? workerEntryPoints[entryPoint]
              : toUniqueFilename(entryPoint);

          const outfile = join(cacheDir, id);

          const output = { path: outfile, namespace, watchFiles: [outfile] };

          if (workerBuilders[id]) {
            return output;
          }
          const builder = await prepareWorkerBuilder(entryPoint, {
            outfile,
            ...extraConfig,
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
        ).then(() => rmdirSync(cacheDir, { recursive: true }));
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
