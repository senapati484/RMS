import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'RentalOS — Enterprise Rental Management',
  description:
    'Centralized rental management system with AI-powered operations, real-time dashboards, and automated deposit settlement.',
  keywords: ['rental management', 'equipment rental', 'enterprise', 'deposit tracking'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: 'rgba(26,26,26,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FAFAFA',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
