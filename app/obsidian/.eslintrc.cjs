/**
 * Specific eslint rules for this app/package, extends the base rules
 * @see https://github.com/belgattitude/nextjs-monorepo-example/blob/main/docs/about-linters.md
 */

// Workaround for https://github.com/eslint/eslint/issues/3458 (re-export of @rushstack/eslint-patch)
require("@aidenlx/eslint-config/patch/modern-module-resolution");

const { getDefaultIgnorePatterns } = require("@aidenlx/eslint-config/helpers");

const typescriptOptions = {
  tsconfigRootDir: __dirname,
  project: "tsconfig.eslint.json",
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
    "@aidenlx/eslint-config/react",
  ],
  rules: {
    "react/no-unknown-property": ["error", { ignore: ["aria-label-delay"] }],
    "jsx-a11y/aria-props": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/no-unresolved": [
      2,
      {
        ignore: [
          "worker:",
          "\\.less$",
          "@electron/remote",
          "react-dom",
          "dompurify",
          "^@assets/",
          "^@utils",
          "@obzt/components/styles",
        ],
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: typescriptOptions,
    },
  },
};
