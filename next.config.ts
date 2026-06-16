import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/pogobonfire",
  experimental: {
    optimizePackageImports: ["idb-keyval", "papaparse", "zustand"],
  },
};

export default nextConfig;
