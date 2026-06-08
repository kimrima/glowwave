import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GlowWave',
    short_name: 'GlowWave',
    description: '실시간 관객 참여형 스마트폰 전광판 동기화',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0B0B0F',
    theme_color: '#0B0B0F',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
