import type { MetadataRoute } from 'next'

import { site } from '@/lib/site'

/**
 * PWA manifest (Next file convention → served at `/manifest.webmanifest`,
 * auto-linked into <head>). `start_url` is the back-office root so the installed
 * app opens straight into the dashboard.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: 'Boda',
    description: 'Gestión de nuestra boda.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es',
    dir: 'ltr',
    // Matches the installed experience (start_url = the back-office dashboard,
    // which uses the minimal cool-light theme).
    background_color: '#F7F9FC',
    theme_color: '#F7F9FC',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
