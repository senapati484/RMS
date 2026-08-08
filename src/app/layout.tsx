import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  themeColor: '#F26522',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Lease360 — Enterprise Rental & Lease Management Engine',
  description:
    'Centralized equipment rental management system with AI-powered operations, real-time dashboards, and automated deposit settlement.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-touch-icon-120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-touch-icon-167.png', sizes: '167x167', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lease360',
  },
  formatDetection: {
    telephone: true,
  },
  keywords: ['rental management', 'equipment rental', 'enterprise', 'deposit tracking', 'Odoo Hackathon'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased selection:bg-[#F26522] selection:text-white" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            {children}
            <PWAInstallPrompt />
          </CartProvider>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(17,17,17,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#FAFAFA',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
