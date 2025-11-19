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
}

module.exports = nextConfig

