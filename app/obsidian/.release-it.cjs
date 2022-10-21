module.exports = {
  hooks: {
    // "before:init": ["npm run eslint"],
    "after:bump": ["node ../../common/scripts/install-run-rush.js rebuild --verbose"],
    "after:release":
      "echo Successfully released ${name} v${version} to ${repo.repository}.",
  },
  git: {
    commitMessage: "chore: release v${version}",
    tagName: "${version}",
    tagAnnotation: "Release v${version}",
  },
  plugins: {
    "@release-it/conventional-changelog": {
      preset: "angular",
      infile: "CHANGELOG.md",
    },
    "./scripts/ob-bumper.mjs": {
      indent: 2,
      beta: process.argv.includes("--beta"),
      copyTo: "../..",
    },
  },
  npm: {
    publish: false,
  },
  github: {
    release: true,
    assets: ["build/main.js", "build/manifest.json", "build/styles.css"],
    proxy: process.env.HTTPS_PROXY,
    releaseName: "${version}",
  },
};
