# Inline Worker Plugin for esbuild 0.17+

This is a plugin for [esbuild](https://esbuild.github.io) which allows you to import module as bundled script text for usage in Web Workers. Support watch mode, and custom worker import pattern and build options.

Special thanks to [esbuild-plugin-inline-import](https://github.com/mitschabaude/esbuild-plugin-inline-worker) for the idea.

## Installation

```sh
npm install -D @aidenlx/esbuild-plugin-inline-worker
-- or --
yarn add -D @aidenlx/esbuild-plugin-inline-worker
-- or --
pnpm add -D @aidenlx/esbuild-plugin-inline-worker
```

## Usage

By default the plugin intercepts all `worker:*` imports and replaces them with the bundled script text. For example:

```js
import WorkerCode from "worker:./worker.js";
// you can use utils to create a worker from the script text
import { fromScriptText } from "@aidenlx/esbuild-plugin-inline-worker/utils";

const worker = fromScriptText(
  WorkerCode,
  /** worker options */ { name: "i'm a worker" }
);
```

To enable the plugin, add it to the `plugins` option of esbuild:

```js
import { build } from "esbuild";
import inlineWorker from "@aidenlx/esbuild-plugin-inline-worker";

await build({
  // ...other options
  plugins: [inlineWorker()],
});
```

If you are using TypeScript, you can create a file named `inline-worker.d.ts` in your source code folder with the following content :

```ts
declare module "worker:*" {
  const inlineWorker: string;
  export default inlineWorker;
}
```

### Watch mode support

If you are using esbuild v0.17+ in watch mode, you can use the `watch` option to enable watch mode support:

```js
import { build } from "esbuild";
import inlineWorker from "@aidenlx/esbuild-plugin-inline-worker";

// you can replace this with your own build mode detection logic
const isProd = process.env.NODE_ENV === "production";

/** @type import("esbuild").BuildOptions */
const commonOptions = {
  // ...
};

/** @type import("esbuild").BuildOptions */
const mainOptions = {
  ...commonOptions,
  plugins: [inlineWorker({ watch: !isProd })],
};

if (!isProd) {
  // watch mode
  const ctx = await context(mainOptions);
  try {
    await ctx.watch();
  } catch (err) {
    console.error(err);
    await cleanup();
  }
  process.on("SIGINT", cleanup);
  // clean up properly before exit via ctrl+c
  async function cleanup() {
    await ctx.dispose();
  }
} else {
  // build mode
  await build(mainOptions);
}
```

### Custom Worker Import Pattern

You can use the `filter` option to customize the import pattern. For example, the default pattern `worker:*` works like this:

```js
await build({
  // ...other options
  plugins: [
    inlineWorkerPlugin({
      filter: {
        pattern: /^worker:/,
        // if you don't need to transform the path, you can just ignore this option
        transform: (path, pattern) => path.replace(pattern, ""),
      },
    }),
  ],
});
```

To only intercept `*.worker.js` imports, you can use:

```js
await build({
  // ...other options
  plugins: [inlineWorkerPlugin({ filter: { pattern: /\.worker\.js$/ } })],
});
```

Remember to change the `inline-worker.d.ts` file to match the new pattern:

```ts
declare module "*.worker.js" {
  const inlineWorker: string;
  export default inlineWorker;
}
```

### Custom Build Options

You can pass a function to the `buildOptions` option to customize the build options for each worker file:

```js
await build({
  // ...other options
  plugins: [
    inlineWorkerPlugin({
      // `entryPoint` point to the full path to the worker file
      // `path` is the path used in `import` statement,
      // and it's relative to `resolveDir`
      // `resolve` method is used by esbuild to resolve the import paths
      buildOptions: ({ path, resolveDir, entryPoint }, resolve) => {
        let tsconfig = "tsconfig.worker.json";
        if (path.endsWith("worker-special.js")) {
          // use a different tsconfig file for different worker files
          tsconfig = "tsconfig.worker-special.json";
        } else if (path.startsWith("@/worker/")) {
          // get the tsconfig file next to the worker file
          tsconfig = join(entryPoint, "..", "tsconfig.json");
        }
        return {
          sourcemap: !isProd ? "inline" : undefined,
          tsconfig,
        };
      },
    }),
  ],
});
```
