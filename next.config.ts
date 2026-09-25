import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/pdf-me", destination: "/pdfme" }];
  },
};

export default nextConfig;
