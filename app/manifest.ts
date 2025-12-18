import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Modul. Studio',
    short_name: 'Modul',
    description: 'The Privacy-First Media OS. Local processing, zero data exfiltration.',
    start_url: '/',
    display: 'standalone', // Removes browser UI
    background_color: '#0f172a', // Matches your Slate-900 bg
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    // "Bunker Mode" specific categories
    categories: ['productivity', 'utilities', 'photo', 'video'],
  };
}