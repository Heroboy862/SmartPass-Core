import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["dist", "node_modules", "scripts", "vite.config.ts", "public", ".github", "ios", "android", "capacitor.config.ts"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "react/no-direct-mutation-state": "off",
      "react/no-find-dom-node": "off",
      "react/no-is-mounted": "off",
      "react/no-render-return-value": "off",
      "react/no-string-refs": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "off",
      "react/require-render-return": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
