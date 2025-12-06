import { MetadataRoute } from 'next'

// Use Node.js runtime for sitemap generation to avoid Edge Runtime limitations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ISR: Revalidate sitemap every hour
export const revalidate = 3600;

// MINIMAL SITEMAP FOR DEBUGGING - Only essential static pages
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Only include the most essential static pages
  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}

