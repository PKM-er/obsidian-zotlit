/* eslint-env node */
import esbuild from "esbuild";
import { basename, join } from "path";

const moduleNamePattern = /^worker:/;
const namespace = "worker";

/**
 *
 * @param {Partial<import("esbuild").BuildOptions>} extraConfig
 * @param {"dataurl"|"text"|undefined} loader
 * @returns {import("esbuild").Plugin}
 */
const inlineWorkerPlugin = (extraConfig, loader = "text") => ({
  name: "esbuild-plugin-inline-worker",
  setup: (build) => {
    build.onResolve({ filter: moduleNamePattern }, ({ path, resolveDir }) => {
      path = path.replace(moduleNamePattern, "");
      if (path.startsWith(".")) {
        return {
          path: join(resolveDir, path),
          namespace,
        };
      } else {
        return {
          path: path.replace(moduleNamePattern, ""),
          namespace,
        };
      }
    });
    build.onLoad({ filter: /.*/, namespace }, async ({ path: workerPath }) => {
      const code = await buildWorker(workerPath, extraConfig);
      return {
        contents: code,
        loader,
      };
    });
  },
});
export default inlineWorkerPlugin;

const buildWorker = async (workerPath, extraConfig) => {
  const scriptName = basename(workerPath).replace(/\.[^.]*$/, ".js");

  if (extraConfig) {
    delete extraConfig.entryPoints;
    delete extraConfig.outfile;
    delete extraConfig.outdir;
  }

  const result = await esbuild.build({
    entryPoints: [workerPath],
    write: false, // write in memory
    outfile: scriptName,
    bundle: true,
    minify: true,
    target: "es2017",
    format: "esm",
    ...extraConfig,
  });

  return new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
};
