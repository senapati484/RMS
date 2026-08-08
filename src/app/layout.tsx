import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
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
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
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
      <body className="antialiased selection:bg-[#F26522] selection:text-white" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            {children}
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
