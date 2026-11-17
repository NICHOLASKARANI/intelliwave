import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.intelliwavve.com'

  // Marketing pages — indexed by Google for organic traffic
  const marketingRoutes = [
    { path: '', priority: 1.0, freq: 'daily' as const },
    { path: '/about', priority: 0.9, freq: 'weekly' as const },
    { path: '/services', priority: 0.9, freq: 'weekly' as const },
    { path: '/pricing', priority: 0.9, freq: 'weekly' as const },
    { path: '/portfolio', priority: 0.8, freq: 'weekly' as const },
    { path: '/blog', priority: 0.9, freq: 'daily' as const },
    { path: '/contact', priority: 0.7, freq: 'monthly' as const },
    { path: '/careers', priority: 0.7, freq: 'weekly' as const },
    { path: '/marketplace', priority: 1.0, freq: 'daily' as const },
    { path: '/wavecore-erp', priority: 1.0, freq: 'weekly' as const },
    { path: '/executives', priority: 0.9, freq: 'weekly' as const },
    { path: '/shopwavvemarket', priority: 0.9, freq: 'weekly' as const },
    { path: '/shopwavecore-erp', priority: 0.8, freq: 'weekly' as const },
    { path: '/roi-calculator', priority: 0.9, freq: 'weekly' as const },
    { path: '/estimator', priority: 0.8, freq: 'weekly' as const },
    { path: '/multi-planetaryhumancivilization', priority: 0.7, freq: 'monthly' as const },
    // Free tools — the growth engine
    { path: '/tools/vat-calculator', priority: 1.0, freq: 'weekly' as const },
    // Trust pages
    { path: '/privacy', priority: 0.3, freq: 'yearly' as const },
    { path: '/terms', priority: 0.3, freq: 'yearly' as const },
    { path: '/cookies', priority: 0.3, freq: 'yearly' as const },
  ]

  return marketingRoutes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.freq,
    priority: r.priority,
  }))
}