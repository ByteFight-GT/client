import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
  output: 'export',  // This tells Next.js to generate static files
  images: {
    unoptimized: true,  // Disable image optimization for static export
  },
  redirects: async () => [
    {
      source: '/',
      destination: '/player',
      permanent: true,
    },
  ]
};

export default nextConfig;
