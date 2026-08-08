import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lease360 — Equipment Rental & Security Engine',
    short_name: 'Lease360',
    description:
      'Centralized equipment rental management with AI-powered operations, real-time dashboards, and automated deposit settlement.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0A0A0A',
    theme_color: '#F26522',
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity', 'shopping', 'finance'],
    icons: [
      { src: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'New Order',
        short_name: 'New Order',
        url: '/dashboard/orders/new',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'New Quotation',
        short_name: 'New Quotation',
        url: '/dashboard/quotations/new',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Billing & Plans',
        short_name: 'Billing',
        url: '/dashboard/billing',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Lease360 AI',
        short_name: 'AI Assistant',
        url: '/dashboard/ai',
        icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
      },
    ],
  }
}
