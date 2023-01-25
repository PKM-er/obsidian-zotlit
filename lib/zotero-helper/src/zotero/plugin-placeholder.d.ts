/* eslint-disable @typescript-eslint/consistent-type-imports */
// This file is a type def for the fake plugin module
// it will be resolved to actual plugin module by esbuild
declare module "@plugin" {
  const plugin: import("./plugin.js").Plugin;
  export default plugin;
}

import "zotero-types";
