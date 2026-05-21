import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brownie Lab',
    short_name: 'Brownie Lab',
    description: 'Brownies y galletas artesanales, hechos a mano con obsesión.',
    start_url: '/',
    display: 'standalone',
    background_color: '#7c2d12',
    theme_color: '#92400e',
    orientation: 'portrait',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Ver Menú',     url: '/menu',       description: 'Ver menú completo' },
      { name: 'Personalizar', url: '/personaliza', description: 'Arma tu postre ideal' },
      { name: 'Mi pedido',    url: '/seguimiento', description: 'Estado de mi pedido' },
    ],
  };
}
