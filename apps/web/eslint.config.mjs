import { defineConfig, globalIgnores } from "eslint/config";
import base from "@sarpech/config/eslint";

export default defineConfig([
  ...base,
  globalIgnores([
    // Vendored MediaPipe runtime (copied from node_modules by scripts/copy-fitcheck-assets.mjs)
    "public/fitcheck/**",
    "storage/**",
  ]),
]);
