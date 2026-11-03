import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // This folder is the project root (a stray lockfile in the home directory confuses detection).
  outputFileTracingRoot: process.cwd(),
  // The live database and uploads are runtime data, never part of a build.
  outputFileTracingExcludes: { "*": ["./storage/**"] },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
