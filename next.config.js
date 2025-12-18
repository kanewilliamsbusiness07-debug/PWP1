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

  // Environment variables configuration
  // These variables will be available at build time and runtime
  // Values are pulled from Amplify Console environment variables
  // Note: NODE_ENV is automatically set by Next.js and cannot be in env config
  env: {
    // Server-side and build-time environment variables
    // These are available in API routes, server components, and during build
    CRON_SECRET: process.env.CRON_SECRET,
    AWS_REGION: process.env.AWS_REGION ?? process.env.APP_AWS_REGION ?? process.env.REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ?? process.env.APP_AWS_S3_BUCKET ?? process.env.S3_BUCKET,
    DDB_CLIENTS_TABLE: process.env.DDB_CLIENTS_TABLE,
    DDB_PDF_EXPORTS_TABLE: process.env.DDB_PDF_EXPORTS_TABLE,
    DDB_USERS_TABLE: process.env.DDB_USERS_TABLE,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // Public environment variables (available to client-side code)
    // NEXT_PUBLIC_* variables are automatically exposed to the browser
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Leave webpack untouched to avoid SSR issues on Amplify
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig;
