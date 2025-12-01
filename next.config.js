/** @type {import('next').NextConfig} */
const nextConfig = {
  // For AWS Amplify Hosting (managed Next.js), do not use standalone output
  // Standalone mode is only for Docker/container deployments
  // AWS Amplify Hosting automatically handles Next.js server
  output: process.env.AMPLIFY_HOSTING === 'true' ? undefined : (process.env.STANDALONE === 'true' ? 'standalone' : undefined),
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
