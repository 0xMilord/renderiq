import { MetadataRoute } from 'next'
import { RendersDAL } from '@/lib/dal/renders'

// Use Node.js runtime for sitemap generation to avoid Edge Runtime limitations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// Timeout wrapper to prevent hanging during build
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Sitemap generation timeout')), timeoutMs)
    ),
  ]);
}

export default async function sitemapImages(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
  
  try {
    // Reduced limit to 1000 items to prevent build hangs and improve performance
    // Add timeout to prevent hanging during build/deployment
    const galleryItems = await withTimeout(
      RendersDAL.getPublicGallery(1000, 0, {
        sortBy: 'newest',
        filters: {
          contentType: 'image' // Only images for image sitemap
        }
      }),
      10000 // 10 second timeout
    );
    
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
    // This ensures builds don't hang even if database is unavailable
    return [];
  }
}
