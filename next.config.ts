import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Para Next.js 15+ (como parece ser o caso pela verso 16.2.4 Turbo)
  },
  // @ts-ignore
  allowedDevOrigins: ['192.168.10.10', '192.168.10.10:5020', '192.168.12.137', 'localhost:3003']
};

export default nextConfig;
