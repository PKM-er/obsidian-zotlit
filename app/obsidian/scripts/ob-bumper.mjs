import { promises } from "fs";
const { readFile, writeFile, stat } = promises;
import { Plugin } from "release-it";

const noop = Promise.resolve();

class ObsidianVersionBump extends Plugin {
  async bump(targetVersion) {
    let { indent = 4, beta = false } = this.getContext();
    const { isDryRun } = this.config;

    const targetManifest = beta ? "manifest-beta.json" : "manifest.json";

    // read minAppVersion from manifest.json and bump version to target version
    let manifest = JSON.parse(await readFile(targetManifest, "utf8"));
    const { minAppVersion } = manifest;
    this.log.info(`min obsidian app version: ${minAppVersion}`);

    const writeManifest = async () => {
      manifest.version = targetVersion;
      const manifestContent = JSON.stringify(manifest, null, indent);
      this.log.exec(`Writing version to manifest.json`, isDryRun);
      !isDryRun && (await writeFile(targetManifest, manifestContent));

      if (targetManifest === "manifest-beta.json") return noop;
      try {
        await stat("manifest-beta.json");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        return noop;
      }
      this.log.exec(
        `Update manifest-beta.json to sync with manifest.json`,
        isDryRun,
      );
      !isDryRun && (await writeFile("manifest-beta.json", manifestContent));
    };

    /**
     * update versions.json with target version and minAppVersion from manifest.json
     */
    const writeVersion = async () => {
      let versions = JSON.parse(await readFile("versions.json", "utf-8"));
      versions[targetVersion] = minAppVersion;
      this.log.exec(`Writing version to versions.json`, isDryRun);
      if (isDryRun) return noop;
      return writeFile("versions.json", JSON.stringify(versions, null, indent));
    };

    /**
     * update README.md with target version
     */
    const writeReadme = async () => {
      let readme = await readFile("README.md", "utf-8");
      readme = readme.replace(
        /(?<=available for Obsidian v).*\+\.$/gm,
        `${minAppVersion}+.`,
      );
      this.log.exec(`Writing version to README.md`, isDryRun);
      if (isDryRun) return noop;
      return writeFile("README.md", readme);
    };

    return Promise.all([writeManifest(), writeVersion(), writeReadme()]);
  }
}
export default ObsidianVersionBump;
