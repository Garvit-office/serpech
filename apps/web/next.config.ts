import { join } from "node:path";
import type { NextConfig } from "next";

// Monorepo root (two levels up from apps/web). Next and Turbopack need it to
// resolve the shared @sarpech/* packages and the hoisted node_modules — and a
// stray lockfile in the home directory would otherwise confuse detection.
const monorepoRoot = join(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@sarpech/core", "@sarpech/brand", "@sarpech/backend"],
  outputFileTracingRoot: monorepoRoot,
  // The live database and uploads are runtime data, never part of a build.
  outputFileTracingExcludes: { "*": ["./storage/**"] },
  turbopack: {
    root: monorepoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
