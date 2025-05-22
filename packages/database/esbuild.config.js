import { build, context } from "esbuild";

async function buildPackage(watch = false) {
  /** @type {import("esbuild").BuildOptions} */
  const options = {
    entryPoints: ["./src/main.ts"],
    outdir: "dist/src",
    bundle: true,
    platform: "node",
    target: ["es2022"],
    format: "esm",
    sourcemap: "external",
    minify: true,
  };

  if (watch) {
    // Create a context for watch mode
    const ctx = await context(options);
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    // Regular build
    await build(options);
    console.log("Build complete");
  }
}

// Check if --watch flag was passed
const watchMode = process.argv.includes("--watch");
buildPackage(watchMode).catch((err) => {
  console.error(err);
  process.exit(1);
});
