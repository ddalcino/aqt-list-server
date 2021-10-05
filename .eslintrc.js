module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["old/**/*", "temp.js", "**/vendor/*.js"],
  rules: {
    "prettier/prettier": "error",
  },
};
