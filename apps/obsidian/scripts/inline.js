import esbuild from "esbuild";
import { rename, readFile } from "node:fs/promises";
import { basename, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const namespace = {
  code: "inline:code",
  text: "inline:text",
};
const prefixed = /^inline:*/;
/**
 *
 * @param {Partial<import("esbuild").BuildOptions>} extraConfig
 * @param {(meta: import("esbuild").Metafile) => void} [onMeta]
 * @returns {import("esbuild").Plugin}
 */
export default function inlineCodePlugin(extraConfig, onMeta) {
  return {
    name: "inline-code",
    setup: (build) => {
      build.onResolve({ filter: prefixed }, async ({ path, ...rest }) => {
        const cleanPath = path.replace(prefixed, "");

        // Use esbuild's built-in resolver
        const resolved = await build.resolve(cleanPath, { ...rest });
        if (resolved.errors.length > 0) {
          return { errors: resolved.errors };
        }

        if (path.endsWith(".css")) {
          return {
            path: resolved.path,
            namespace: namespace.text,
          };
        }

        return {
          path: resolved.path,
          namespace: namespace.code,
        };
      });
      build.onLoad(
        { filter: /.*/, namespace: namespace.code },
        async ({ path }) => {
          const result = await buildWorker(path, extraConfig);
          const file = result.outputFiles[0];
          onMeta?.(result.metafile);
          return { contents: file.text, loader: "text" };
        },
      );
      build.onLoad(
        { filter: /.*/, namespace: namespace.text },
        async ({ path }) => {
          const text = await readFile(path, "utf-8");
          return { contents: text, loader: "text" };
        },
      );
    },
  };
}

/**
 * @param {string} workerPath
 * @param {Partial<import("esbuild").BuildOptions>} extraConfig
 */
async function buildWorker(
  workerPath,
  { entryPoints, outfile, outdir, ...extraConfig },
) {
  const scriptName = basename(workerPath).replace(/\.[^.]*$/, ".js");

  const result = await esbuild.build({
    entryPoints: [workerPath],
    write: false, // write in memory
    outfile: scriptName,
    bundle: true,
    minify: true,
    format: "cjs",
    target: "es2022",
    ...extraConfig,
  });

  return result;
}

/**
 * Plugin to rename main.css to styles.css
 * @returns {import("esbuild").Plugin}
 */
function cssRenamePlugin() {
  return {
    name: "css-rename",
    setup(build) {
      build.onEnd(() => {
        const distDir = "dist";
        const mainCssPath = join(distDir, "main.css");
        const stylesCssPath = join(distDir, "styles.css");

        rename(mainCssPath, stylesCssPath)
          .then(() => {
            console.log("Renaming main.css to styles.css");
            const mainCssMapPath = `${mainCssPath}.map`;
            const stylesCssMapPath = `${stylesCssPath}.map`;
            rename(mainCssMapPath, stylesCssMapPath).catch((err) => {
              if (err.code !== "ENOENT") {
                throw err;
              }
            });
          })
          .catch((err) => {
            if (err.code === "ENOENT") {
              console.log("no style emitted, skipping...");
            } else {
              throw err;
            }
          });
      });
    },
  };
}
