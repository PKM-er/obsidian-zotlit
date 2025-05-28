import { build, context } from "esbuild";

async function buildPackage(watch = false) {
  /** @type {import("esbuild").BuildOptions} */
  const nodeOptions = {
    platform: "node",
    plugins: [databaseResolve({ platform: "node" })],
  };

  /** @type {import("esbuild").BuildOptions} */
  const browserOptions = {
    platform: "browser",
    plugins: [databaseResolve({ platform: "browser" })],
  };

  /** @type {import("esbuild").BuildOptions} */
  const baseOptions = {
    outdir: "dist/src",
    bundle: true,
    treeShaking: true,
    target: ["es2022"],
    format: "esm",
    external: ["sqlocal"],
  };

  /** @type {import("esbuild").BuildOptions} */
  const devOptions = {
    ...baseOptions,
    outExtension: { ".js": ".dev.js" },
    sourcemap: "inline",
    minify: false,
    define: {
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
  };

  /** @type {import("esbuild").BuildOptions} */
  const prodOptions = {
    ...baseOptions,
    outExtension: { ".js": ".prod.js" },
    sourcemap: "external",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    minify: true,
  };

  if (watch) {
    // Create contexts for watch mode
    const nodeDevCtx = await context({
      entryPoints: ["./src/obsidian.ts", "./src/index.ts"],
      ...devOptions,
      ...nodeOptions,
    });
    const browserDevCtx = await context({
      entryPoints: ["./src/browser.ts"],
      ...devOptions,
      ...browserOptions,
    });
    await Promise.all([nodeDevCtx.watch(), browserDevCtx.watch()]);
    console.log("Watching for changes (dev and prod builds)...");
  } else {
    // Regular build
    await Promise.all([
      build({
        entryPoints: ["./src/obsidian.ts", "./src/index.ts"],
        ...devOptions,
        ...nodeOptions,
      }),
      build({
        entryPoints: ["./src/obsidian.ts", "./src/index.ts"],
        ...prodOptions,
        ...nodeOptions,
      }),
      build({
        entryPoints: ["./src/browser.ts"],
        ...devOptions,
        ...browserOptions,
      }),
      build({
        entryPoints: ["./src/browser.ts"],
        ...prodOptions,
        ...browserOptions,
      }),
    ]);
    console.log("Build complete (dev and prod builds)");
  }
}

// Check if --watch flag was passed
const watchMode = process.argv.includes("--watch");
buildPackage(watchMode).catch((err) => {
  console.error(err);
  process.exit(1);
});

function databaseResolve({ platform }) {
  if (!["node", "browser"].includes(platform)) {
    throw new Error(`Invalid database platform: ${platform}`);
  }
  return {
    name: "database-resolve",
    setup: (build) => {
      build.onResolve({ filter: /^@db\/[^\/]+$/ }, async (args) => {
        const moduleName = args.path.replace("@db/", "");
        return await build.resolve(`@/db/${moduleName}.${platform}`, {
          resolveDir: args.resolveDir,
          kind: args.kind,
          importer: args.importer,
        });
      });
    },
  };
}
