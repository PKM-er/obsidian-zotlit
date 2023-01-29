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

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  parserOptions: {
    ...typescriptOptions,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: [...getDefaultIgnorePatterns()],
  extends: [
    "@aidenlx/eslint-config/typescript",
    "@aidenlx/eslint-config/regexp",
    // Apply prettier and disable incompatible rules
    "@aidenlx/eslint-config/prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: typescriptOptions,
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/naming-convention": "off",
  },
  overrides: [
    {
      files: ["src/zotero/**/*"],
      parserOptions: {
        project: "tsconfig.zotero.json",
      },
      settings: {
        "import/resolver": {
          typescript: {
            project: "tsconfig.zotero.json",
          },
        },
      },
      rules: {
        "import/no-unresolved": [
          2,
          {
            ignore: ["@plugin"],
          },
        ],
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
};
