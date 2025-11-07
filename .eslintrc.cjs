module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-misused-promises": "off",
  },
};

