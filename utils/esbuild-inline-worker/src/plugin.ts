// @ts-check

import { rmSync } from "fs";
import { mkdtemp, readFile } from "fs/promises";
import { tmpdir } from "os";
import { basename, join } from "path";
import esbuild from "esbuild";
import type { BuildOptions, PluginBuild, Plugin, BuildContext } from "esbuild";
import { nanoid } from "nanoid/async";

const namespace = "inline-worker";
const toUniqueFilename = async (/** @type {string} */ path: string) => {
  const base = basename(path).split("."),
    ext = base.pop();
  return `${base.join(".")}_${await nanoid(5)}.${ext}`;
};

interface WorkerOptions {
  watch?: boolean;
  cachedir?: string;
  codeLoader?: "dataurl" | "text";
  filter?: {
    pattern: RegExp;
    transform?: (path: string, pattern: RegExp) => string;
  };
  buildOptions: (
    ctx: { path: string; resolveDir: string; entryPoint: string },
    resolve: PluginBuild["resolve"],
  ) => Promise<BuildOptions> | BuildOptions;
}

export const inlineWorkerPlugin = ({
  watch = false,
  cachedir: cacheDirRoot = tmpdir(),
  codeLoader = "text",
  filter = {
    pattern: /^worker:/,
    transform: (path, pattern) => path.replace(pattern, ""),
  },
  buildOptions,
}: WorkerOptions): Plugin => ({
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
        },
      );
      build.onLoad(
        { filter: /.*/, namespace },
        async ({ path: workerPath, pluginData }) => {
          const code = await buildWorker(
            workerPath,
            await buildOptions(
              {
                path: pluginData.path,
                entryPoint: workerPath,
                resolveDir: pluginData.resolveDir,
              },
              build.resolve.bind(build),
            ),
          );
          return { contents: code, loader: codeLoader };
        },
      );
    } else {
      /**
       * id -> entryPoint
       */
      const workerEntryPoints: Record<string, string> = {};
      /**
       * id -> context
       */
      const workerBuilders: Record<string, BuildContext> = {};

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
              entryPoint,
            ));

          const outfile = join(cacheDir, id);

          const output = { path: outfile, namespace, watchFiles: [outfile] };

          if (workerBuilders[id]) {
            return output;
          }
          const builder = await prepareWorkerBuilder(entryPoint, {
            ...(await buildOptions(
              { path, resolveDir, entryPoint },
              build.resolve.bind(build),
            )),
            outfile,
          });

          workerBuilders[id] = builder;
          await builder.rebuild();
          await builder.watch();
          return output;
        },
      );
      build.onLoad({ filter: /.*/, namespace }, async ({ path }) => {
        const code = await readFile(path, "utf-8");
        return { contents: code, loader: codeLoader };
      });
      build.onDispose(() => {
        Promise.all(
          Object.values(workerBuilders).map((ctx) => ctx.dispose()),
        ).then(() => rmSync(cacheDir, { recursive: true, force: true }));
      });
    }
  },
});

async function buildWorker(
  entryPoint: string,
  { outdir, outfile, ...extraConfig }: BuildOptions,
): Promise<string> {
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

const prepareWorkerBuilder = async (
  entryPoint: string,
  {
    outdir,
    ...extraConfig
  }: BuildOptions & Required<Pick<BuildOptions, "outfile">>,
): Promise<BuildContext> => {
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
