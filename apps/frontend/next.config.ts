import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@abhi2/shared"],
  turbopack: {
    root: resolve(currentDir, "../.."),
  },
};

export default nextConfig;
