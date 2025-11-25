/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable image optimization for Electron
  images: {
    unoptimized: true,
  },
  // Disable standalone mode for Electron - it causes path issues in packaged apps
  // The standard Next.js build works better with Electron's file structure
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Webpack configuration to prevent bundling Node.js modules on client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle these modules for the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        electron: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

