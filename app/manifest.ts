import type { MetadataRoute } from 'next';

// Lets a phone add the site to its home screen and open it full screen,
// without the browser's address bar. GitHub Pages serves the site under a
// path prefix, which the manifest's own URLs must carry.
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Learning: M&A and HK financial regulation',
    short_name: 'Learning',
    description: 'Personal study site: M&A, privacy, and Hong Kong financial regulation.',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#f5f1e8',
    theme_color: '#f5f1e8',
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
