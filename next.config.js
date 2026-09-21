/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['animal-island-ui'],
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': require.resolve('@prisma/client'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
