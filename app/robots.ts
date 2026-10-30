import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/wavecore-erp/', // Block the entire private ERP application
        '/api/',          // Block API routes
        '/dashboard/',    // Block any other private dashboards
        '/security/'      // Block the admin panel
      ],
    },
    sitemap: 'https://www.intelliwavve.com/sitemap.xml',
  }
}