// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*"] },
  // TypeScript (npm run typecheck) already verifies every import, including the @sarpech/* workspaces.
  { rules: { "import/no-unresolved": "off" } },
]);
