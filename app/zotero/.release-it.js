module.exports = {
  hooks: {
    "before:init": ["npm run lint"],
    "after:bump": [
      "rm -rf xpi",
      "node ../../common/scripts/install-run-rush.js rebuild --verbose",
      "cp gen/update.rdf ."
    ],
    "after:release":
      "echo Successfully released ${name} zt${version} to ${repo.repository}.",
  },
  git: {
    commitMessage: "chore: release zotero plugin v${version}",
    tagName: "zt${version}",
    tagAnnotation: "Release Zotero Plugin v${version}",
  },
  plugins: {
    // "@release-it/conventional-changelog": {
    //   preset: "angular",
    //   infile: "CHANGELOG.md",
    // },
    "@release-it/bumper": {
      "out": {
        "file": "gen/version.js",
        "type": "text/javascript",
      }
    },
  },
  npm: {
    publish: false,
  },
  github: {
    release: true,
    assets: [
      "xpi/zotero-obsidian-note-*.xpi",
    ],
    proxy: process.env.HTTPS_PROXY,
    releaseName: "zt${version}",
  },
};
