import nextConfig from "eslint-config-next";

const eslintConfig = [
  // Use Next.js base config (includes React, React Hooks, Next.js, TypeScript, import, jsx-a11y)
  ...nextConfig,

  // Custom rules configuration
  {
    name: "opencitation/custom-rules",
    rules: {
      // === TypeScript Rules ===
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // === React Rules ===
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-unescaped-entities": "error",
      "react/self-closing-comp": ["error", { component: true, html: true }],

      // === React Hooks Rules ===
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === General JavaScript Rules ===
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-expressions": "error",
      "no-duplicate-imports": "error",
      "no-template-curly-in-string": "warn",

      // === Code Quality ===
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "warn",
      "require-await": "warn",
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",

      // === Security ===
      "no-script-url": "error",

      // === Best Practices ===
      "array-callback-return": "error",
      "default-case-last": "error",
      "dot-notation": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-empty-function": ["warn", { allow: ["arrowFunctions"] }],
      "no-lonely-if": "error",
      "no-multi-assign": "error",
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "error",
      "object-shorthand": ["error", "always"],
      "prefer-arrow-callback": "error",
      "prefer-destructuring": ["warn", { array: false, object: true }],
      "prefer-template": "error",
      "spaced-comment": ["warn", "always"],

      // === Import Rules ===
      "import/no-anonymous-default-export": "warn",
      "import/no-duplicates": "error",

      // === Next.js Specific ===
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
    },
  },

  // Additional ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
];

export default eslintConfig;
