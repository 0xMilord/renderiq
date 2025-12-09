import { MetadataRoute } from 'next'
import { RendersDAL } from '@/lib/dal/renders'

// Use Node.js runtime for sitemap generation to avoid Edge Runtime limitations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemapVideo(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
  
  try {
    // Fetch public gallery items with videos (limit to 5000 for performance)
    const galleryItems = await RendersDAL.getPublicGallery(5000, 0, {
      sortBy: 'newest',
      filters: {
        contentType: 'video' // Only videos for video sitemap
      }
    });
    
    return galleryItems
      .filter(item => item.render?.outputUrl) // Only include items with videos
      .map(item => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: item.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        videos: [{
          thumbnail_loc: item.render.outputUrl || `${baseUrl}/og-image.jpg`, // Use output as thumbnail if available
          title: item.render.prompt || 'AI Architectural Video Render',
          description: item.render.prompt || 'Professional AI-generated architectural video visualization',
          content_loc: item.render.outputUrl!,
          duration: item.render.settings?.duration || 30, // Default 30 seconds if not specified
          publication_date: item.createdAt?.toISOString(),
          family_friendly: 'yes' as const,
          requires_subscription: 'no' as const,
          live: 'no' as const,
        }],
      }));
  } catch (error) {
    console.error('Error generating video sitemap:', error);
    // Return empty array on error to prevent sitemap generation failure
    return [];
  }
}



