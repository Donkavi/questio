import type { NextConfig } from "next";

const nextConfig: any = {
  serverExternalPackages: ["pdf-parse", "mongoose", "mammoth"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
