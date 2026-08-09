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
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'sonner'],
    serverActions: { allowedOrigins: ['*'] },
  },
  async rewrites() {
    return [
      {
        // Keep /api/auth/me in Next.js (rich subscription aggregation)
        // Proxy all other /api/* calls to the Express backend
        source: '/api/:path((?!auth/me$).*)',
        destination: process.env.EXPRESS_API_URL
          ? `${process.env.EXPRESS_API_URL}/:path*`
          : 'http://localhost:5001/api/:path*',
      },
    ]
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
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
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
