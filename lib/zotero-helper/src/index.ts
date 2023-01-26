export { build } from "./builder/build.js";
export { genInstallRdf, genManifestJson } from "./builder/manifest.js";
export { genUpdateJson } from "./builder/update.js";

export { bundle, prepare, readPackageJson } from "./scripts/prepare.js";
export { readStartConfig, start } from "./scripts/start.js";
