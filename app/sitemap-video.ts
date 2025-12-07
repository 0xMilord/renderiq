import { MetadataRoute } from 'next'

// Use Node.js runtime for sitemap generation to avoid Edge Runtime limitations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// MINIMAL SITEMAP FOR DEBUGGING - Return empty array
export default async function sitemapVideo(): Promise<MetadataRoute.Sitemap> {
  // Temporarily disabled for debugging deployment issues
  return []
}



