import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*", 
        destination: "https://ap314159-dialexus-chat.hf.space/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
