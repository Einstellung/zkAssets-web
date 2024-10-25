const reactPlugin = require("eslint-plugin-react");
const prettierPlugin = require("eslint-plugin-prettier");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");

module.exports = [
  {
    ignores: ["node_modules/", "build/", "dist/", "android/", "ios/"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: "module",
      },
      globals: {
        browser: true,
        node: true,
      },
    },
    plugins: {
      react: reactPlugin,
      prettier: prettierPlugin,
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
