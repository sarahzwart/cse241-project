import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The repo root has its own package-lock.json (database tooling); pin the
  // app root so Turbopack doesn't infer the wrong workspace.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
