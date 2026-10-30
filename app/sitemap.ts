import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.intelliwavve.com'
  
  // Add your public marketing routes here. 
  // We deliberately EXCLUDE /wavecore-erp so Google doesn't index the ERP.
  const routes = [
    '',
    '/about',
    '/contact',
    '/services',
    '/pricing',
    '/portfolio',
    '/blog',
    '/careers',
    '/marketplace', // Public marketplace is fine to index
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/blog' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}