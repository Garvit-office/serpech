// Copies the MediaPipe Tasks Vision WebAssembly runtime into /public/fitcheck/wasm
// so the camera Fit Check loads it from our own origin (runs on `npm install`).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules/@mediapipe/tasks-vision/wasm");
const dest = join(process.cwd(), "public/fitcheck/wasm");
if (!existsSync(src)) process.exit(0);
mkdirSync(dest, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  copyFileSync(join(src, f), join(dest, f));
}
console.log("fitcheck: copied MediaPipe wasm runtime to public/fitcheck/wasm");
