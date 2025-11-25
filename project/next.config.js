/** @type {import('next').NextConfig} */
const nextConfig = {
  // For AWS Amplify, use 'standalone' for custom deployments
  // For Amplify Hosting (managed), remove this line
  output: process.env.AMPLIFY_HOSTING ? undefined : 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    // Configure image domains if needed
    domains: [],
  },
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig;
