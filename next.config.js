/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: [],
  },

  // Required for Amplify SSR stability
  experimental: {
    serverActions: { enabled: true },
  },

  // Leave webpack untouched to avoid SSR issues on Amplify
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig;
