/**
 * Specific eslint rules for this app/package, extends the base rules
 * @see https://github.com/belgattitude/nextjs-monorepo-example/blob/main/docs/about-linters.md
 */

// Workaround for https://github.com/eslint/eslint/issues/3458 (re-export of @rushstack/eslint-patch)
require("@aidenlx/eslint-config/patch/modern-module-resolution");

const { getDefaultIgnorePatterns } = require("@aidenlx/eslint-config/helpers");

module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
  ignorePatterns: [...getDefaultIgnorePatterns(), ".next", ".out"],
  extends: [
    "@aidenlx/eslint-config/typescript",
    "@aidenlx/eslint-config/regexp",
    // Apply prettier and disable incompatible rules
    "@aidenlx/eslint-config/prettier",
  ],
  rules: {
    "import/no-unresolved": [
      2,
      {
        ignore: [
          "web-worker:",
          "worker-thread:",
          "\\.less$",
          "@electron/remote",
          "@log",
          "@utils",
          "@zt-types",
          "@ipc",
        ],
      },
    ],
  },
};
