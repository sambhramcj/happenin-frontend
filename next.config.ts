import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Silence workspace root inference warning
    turbopack: {
      root: __dirname,
    },
    // Uncomment below if Turbopack keeps crashing:
    // turbo: false,
  },
};

export default nextConfig;
