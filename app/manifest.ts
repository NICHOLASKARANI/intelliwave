import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WaveCore ERP - IntelliWavve',
    short_name: 'WaveCore',
    description: 'Enterprise Business Operating System',
    start_url: '/wavecore-erp',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/images/Wavecore.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/images/Wavecore.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}