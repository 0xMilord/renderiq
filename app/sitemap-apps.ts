import { MetadataRoute } from 'next'
import { getAllTools } from '@/lib/tools/registry'

// Use Node.js runtime for sitemap generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemapApps(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Apps index page
  const appsIndex = {
    url: `${baseUrl}/apps`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  };

  // Get all tools (21 tools total)
  const tools = getAllTools();
  
  // Individual tool pages
  const toolPages = tools
    .filter(tool => tool.status === 'online') // Only include online tools
    .map((tool) => ({
      url: `${baseUrl}/apps/${tool.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  return [appsIndex, ...toolPages];
}



