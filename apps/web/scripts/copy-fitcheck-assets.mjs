// Copies the MediaPipe Tasks Vision WebAssembly runtime into /public/fitcheck/wasm
// so the camera Fit Check loads it from our own origin (runs on `npm install`).
// In the monorepo the package is usually hoisted to the root node_modules,
// so it is located with Node's resolver rather than a fixed path.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(appDir, "package.json"));

let src;
try {
  src = join(dirname(require.resolve("@mediapipe/tasks-vision/package.json")), "wasm");
} catch {
  process.exit(0); // not installed yet
}
if (!existsSync(src)) process.exit(0);

const dest = join(appDir, "public/fitcheck/wasm");
mkdirSync(dest, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  copyFileSync(join(src, f), join(dest, f));
}
console.log("fitcheck: copied MediaPipe wasm runtime to apps/web/public/fitcheck/wasm");
