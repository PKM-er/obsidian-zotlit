/* eslint-env node */
import esbuild from "esbuild";
import path from "path";

const inlineWorkerModulePrefix = "__inline-";

/**
 *
 * @param {Partial<import("esbuild").BuildOptions>} extraConfig
 * @param {[searchValue: string | RegExp, replaceValue: string][]|undefined} replace
 * @returns {import("esbuild").Plugin}
 */
const inlineWorkerPlugin = (extraConfig, replace = []) => ({
  name: "esbuild-plugin-inline-worker",
  setup: (build) => {
    /**
     * @param {esbuild.PluginBuild} build
     * @param {"web-worker|worker-thread"} type
     */
    const set = (type) => {
      const codePrefixPattern = new RegExp(`^${type}:`),
        // example: "^__inline-web-worker$"
        inlineWorkerModulePattern = new RegExp(
          `^${inlineWorkerModulePrefix}${type}$`,
        ),
        { inlineWorkerCode, getWorkerCode } = getCodeGenerateUtils(type),
        namespace = type;
      build.onResolve(
        { filter: codePrefixPattern },
        ({ path: workerPath, resolveDir }) => {
          return {
            path: path.resolve(
              resolveDir,
              workerPath.replace(codePrefixPattern, ""),
            ),
            namespace,
          };
        },
      );
      // internal module
      build.onResolve({ filter: inlineWorkerModulePattern }, ({ path }) => {
        return { path, namespace };
      });
      build.onLoad(
        { filter: /.*/, namespace },
        async ({ path: workerPath }) => {
          let contents;
          if (workerPath.startsWith("__")) contents = inlineWorkerCode;
          else {
            contents = getWorkerCode(
              await buildWorker(workerPath, extraConfig),
            );
            for (const args of replace) {
              contents = contents.replace(...args);
            }
          }
          return { contents, loader: "js" };
        },
      );
    };
    set("web-worker");
    set("worker-thread");
  },
});
export default inlineWorkerPlugin;

const getCodeGenerateUtils = (type) => {
  const getWorkerCode = (workerCode) => {
    workerCode = JSON.stringify(workerCode);
    const code = `
import inlineWorker from "${inlineWorkerModulePrefix}${type}";
const Worker = (...args) => inlineWorker(${workerCode}, ...args);
export default Worker;
    `;
    if (type === "web-worker" || type === "worker-thread") {
      return code;
    } else throw new Error("Unknown worker type: " + type);
  };

  let inlineWorkerCode;
  if (type === "web-worker") {
    inlineWorkerCode = `
    const inlineWorker = (scriptText, ...extraArgs) => {
      const url = URL.createObjectURL(
          new Blob([scriptText], { type: "text/javascript" })
        ),
        worker = new Worker(url);
      return (URL.revokeObjectURL(url), worker);
    };
    export default inlineWorker;
  `;
  } else if (type === "worker-thread") {
    inlineWorkerCode = `
    const inlineWorker = (scriptText, workerOptions, ...extraArgs) => {
      return new require("worker_threads").Worker(scriptText, {
        ...workerOptions,
        eval: true,
      });
    };
    export default inlineWorker;
    
  `;
  } else throw new Error("Unknown worker type: " + type);
  return { inlineWorkerCode, getWorkerCode };
};

const buildWorker = async (workerPath, extraConfig) => {
  const scriptName = path.basename(workerPath).replace(/\.[^.]*$/, ".js");

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
