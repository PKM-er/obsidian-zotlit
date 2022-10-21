import { promises } from "fs";
import { copyFile } from "fs/promises";
import { join, resolve } from "path";
const { readFile, writeFile, stat } = promises;
import { Plugin } from "release-it";

const noop = Promise.resolve();

class ObsidianVersionBump extends Plugin {
  async bump(targetVersion) {
    let { indent = 4, beta = false, copyTo } = this.getContext();
    const { isDryRun } = this.config;

    const mainManifest = "manifest.json",
      betaManifest = "manifest-beta.json",
      targetManifest = beta ? betaManifest : mainManifest;

    const readJson = async (path) => {
      try {
        const result = JSON.parse(await readFile(path, "utf8"));
        this.log.exec(`Reading manifest from ${path}`, isDryRun);
        return result;
      } catch (error) {
        if (error.code === "ENOENT") {
          return null;
        }
        throw error;
      }
    };

    let manifest = await readJson(targetManifest);
    if (!manifest && targetManifest === betaManifest) {
      this.log.exec(
        `failed to find ${betaManifest}, read from ${mainManifest} instead`,
        isDryRun,
      );
      manifest = await readJson(mainManifest);
    }
    if (!manifest) {
      throw new Error("manifest.json not found");
    }

    // read minAppVersion from manifest and bump version to target version
    const { minAppVersion } = manifest;
    this.log.info(`min obsidian app version: ${minAppVersion}`);

    const write = async (file, content) => {
      const tasks = [];
      !isDryRun && tasks.push(writeFile(file, content));
      this.log.exec(`Write to ${resolve(file)}`, isDryRun);
      if (copyTo) {
        const target = join(copyTo, file);
        this.log.exec(`Copied to ${resolve(target)}`, isDryRun);
        !isDryRun && tasks.push(writeFile(target, content));
      }
      await Promise.all(tasks);
    };

    const writeManifest = async () => {
      // update version
      manifest.version = targetVersion;
      const manifestContent = JSON.stringify(manifest, null, indent);
      this.log.exec(`Writing version to ${targetManifest}`, isDryRun);
      await write(targetManifest, manifestContent);

      if (beta) {
        // copy manifest.json to root
        const target = join(copyTo, mainManifest);
        !isDryRun && (await copyFile(mainManifest, target));
        this.log.exec(`Copied ${mainManifest} to ${resolve(target)}`, isDryRun);
        // replace build/manifest.json with beta manifest
        const buildManifestPath = join("build", mainManifest);
        !isDryRun && (await copyFile(mainManifest, buildManifestPath));
        this.log.exec(
          `Replaced ${buildManifestPath} with ${betaManifest}`,
          isDryRun,
        );
      } else {
        try {
          await stat(betaManifest);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          return noop;
        }
        this.log.exec(`Sync ${betaManifest} with ${mainManifest}`, isDryRun);
        await write(betaManifest, manifestContent);
      }
    };

    /**
     * update versions.json with target version and minAppVersion from manifest.json
     */
    const writeVersion = async () => {
      let versions = JSON.parse(await readFile("versions.json", "utf-8"));
      versions[targetVersion] = minAppVersion;
      this.log.exec(`Writing version to versions.json`, isDryRun);
      await write("versions.json", JSON.stringify(versions, null, indent));
    };

    return Promise.all([writeManifest(), writeVersion()]);
  }
}
export default ObsidianVersionBump;
