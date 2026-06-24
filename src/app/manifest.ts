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
    background_color: '#FBF7F1',
    theme_color: '#FBF7F1',
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
