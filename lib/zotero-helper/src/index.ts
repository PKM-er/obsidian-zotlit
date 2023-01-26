export { build } from "./builder/build.js";
export { genInstallRdf, genManifestJson } from "./builder/manifest.js";
export { genUpdateJson } from "./builder/update.js";

export {
  bundle,
  preparePackage as prepare,
  readPackageJson,
} from "./scripts/pack.js";
export { readStartConfig, start } from "./scripts/start.js";
