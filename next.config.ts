import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    cpus: 2,
    webpackMemoryOptimizations: true,
  },
  async redirects() {
    return [
      { source: "/ai", destination: "/labs", permanent: true },
      { source: "/studio", destination: "/labs", permanent: true },
      { source: "/cs/ai", destination: "/cs/labs", permanent: true },
      { source: "/cs/studio", destination: "/cs/labs", permanent: true },
    ];
  },
};

export default nextConfig;
