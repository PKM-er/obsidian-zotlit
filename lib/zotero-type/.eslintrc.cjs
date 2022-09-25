/**
 * Specific eslint rules for this app/package, extends the base rules
 * @see https://github.com/belgattitude/nextjs-monorepo-example/blob/main/docs/about-linters.md
 */

// Workaround for https://github.com/eslint/eslint/issues/3458 (re-export of @rushstack/eslint-patch)
require("@aidenlx/eslint-config/patch/modern-module-resolution");

const { getDefaultIgnorePatterns } = require("@aidenlx/eslint-config/helpers");

const typescriptOptions = {
  tsconfigRootDir: __dirname,
  project: "tsconfig.json",
};

module.exports = {
  root: true,
  parserOptions: {
    ...typescriptOptions,
  },
  ignorePatterns: [...getDefaultIgnorePatterns()],
  extends: [
    "@aidenlx/eslint-config/typescript",
    "@aidenlx/eslint-config/regexp",
    // "@aidenlx/eslint-config/react",
    // Apply prettier and disable incompatible rules
    "@aidenlx/eslint-config/prettier",
  ],
  rules: {
    // optional overrides per project
  },
  overrides: [
    // optional overrides per project file match
  ],
  settings: {
    "import/resolver": {
      typescript: typescriptOptions,
    },
  },
};
