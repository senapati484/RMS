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
    serverActions: { allowedOrigins: ['*'] },
  },
  async redirects() {
    return [
      {
        source: '/products/:path*',
        destination: '/dashboard/products',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
