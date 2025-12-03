import { MetadataRoute } from 'next';
import { RendersDAL } from '@/lib/dal/renders';

export default async function sitemapImages(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.ai';
  
  try {
    // Get all public gallery items
    const galleryItems = await RendersDAL.getPublicGallery(1000, 0); // Get up to 1000 items
    
    return galleryItems
      .filter(item => item.render.outputUrl && item.render.status === 'completed')
      .map(item => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: item.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        images: [
          {
            url: item.render.outputUrl!,
            title: item.render.prompt || 'AI-generated architectural render',
            caption: item.render.prompt || undefined,
          },
        ],
      }));
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    return [];
  }
}

