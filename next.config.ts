/** next.config.ts */
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'd8j0ntlcm91z4.cloudfront.net' },
      { protocol: 'https', hostname: 'images.higgs.ai' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3005'] },
  },
}

export default nextConfig
