import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Shared ESLint preset: Next.js core-web-vitals + TypeScript rules. */
const base = [
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".turbo/**"]),
];

export default base;

/** For shared packages (no Next.js pages/app directory of their own). */
export const library = [
  ...base,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];
