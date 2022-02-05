const { readFileSync, writeFileSync } = require("fs");
const { Plugin } = require("release-it");

class ObsidianVersionBump extends Plugin {
  bump(targetVersion) {
    let { indent } = this.getContext();
    if (indent === undefined) indent = 4;

    // read minAppVersion from manifest.json and bump version to target version
    let menifest = JSON.parse(readFileSync("manifest.json").toString());
    const { minAppVersion } = menifest;
    menifest.version = targetVersion;
    writeFileSync("manifest.json", JSON.stringify(menifest, null, indent));

    // update versions.json with target version and minAppVersion from manifest.json
    let versions = JSON.parse(readFileSync("versions.json").toString());
    versions[targetVersion] = minAppVersion;
    writeFileSync("versions.json", JSON.stringify(versions, null, indent));

    // update README.md with target version
    let readme = readFileSync("README.md").toString();
    readme = readme.replace(
      /(?<=available for Obsidian v).*\+\.$/gm,
      `${minAppVersion}+.`,
    );
    writeFileSync("README.md", readme);
  }
}
module.exports = ObsidianVersionBump;
