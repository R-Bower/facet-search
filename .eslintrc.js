module.exports = {
  env: {
    browser: true,
    es6: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: [
    "eslint-config-rbower-typescript",
  ],
  globals: {
    JSX: true,
  },
  ignorePatterns: ["node_modules", "dist"],
  parser: "@typescript-eslint/parser",
  plugins: [],
}
