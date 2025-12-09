import { MetadataRoute } from 'next'
import { RendersDAL } from '@/lib/dal/renders'

// Use Node.js runtime for sitemap generation to avoid Edge Runtime limitations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemapImages(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
  
  try {
    // Fetch public gallery items with images (limit to 5000 for performance)
    const galleryItems = await RendersDAL.getPublicGallery(5000, 0, {
      sortBy: 'newest',
      filters: {
        contentType: 'image' // Only images for image sitemap
      }
    });
    
    return galleryItems
      .filter(item => item.render?.outputUrl) // Only include items with images
      .map(item => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: item.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: [item.render.outputUrl!], // Next.js sitemap expects array of image URLs
      }));
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    // Return empty array on error to prevent sitemap generation failure
    return [];
  }
}
