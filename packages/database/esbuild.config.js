import { build, context } from "esbuild";

async function buildPackage(watch = false) {
  /** @type {import("esbuild").BuildOptions} */
  const baseOptions = {
    entryPoints: ["./src/main.ts"],
    outdir: "dist/src",
    bundle: true,
    platform: "node",
    target: ["es2022"],
    format: "esm",
  };

  /** @type {import("esbuild").BuildOptions} */
  const devOptions = {
    ...baseOptions,
    outExtension: { ".js": ".dev.js" },
    sourcemap: "inline",
    minify: false,
  };

  /** @type {import("esbuild").BuildOptions} */
  const prodOptions = {
    ...baseOptions,
    outExtension: { ".js": ".prod.js" },
    sourcemap: "external",
    minify: true,
  };

  if (watch) {
    // Create contexts for watch mode
    const devCtx = await context(devOptions);
    const prodCtx = await context(prodOptions);
    await Promise.all([devCtx.watch(), prodCtx.watch()]);
    console.log("Watching for changes (dev and prod builds)...");
  } else {
    // Regular build
    await Promise.all([build(devOptions), build(prodOptions)]);
    console.log("Build complete (dev and prod builds)");
  }
}

// Check if --watch flag was passed
const watchMode = process.argv.includes("--watch");
buildPackage(watchMode).catch((err) => {
  console.error(err);
  process.exit(1);
});
