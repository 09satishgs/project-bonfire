import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["idb-keyval", "papaparse", "zustand"],
  },
};

export default nextConfig;
