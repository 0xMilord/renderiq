import { MetadataRoute } from 'next'
import { RendersDAL } from '@/lib/dal/renders'
import { db } from '@/lib/db'
import { galleryItems, renders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export default async function sitemapImages(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  
  try {
    // Fetch all public gallery items with their images
    const items = await db
      .select({
        id: galleryItems.id,
        imageUrl: renders.outputUrl,
        createdAt: galleryItems.createdAt,
        title: renders.prompt,
      })
      .from(galleryItems)
      .innerJoin(renders, eq(galleryItems.renderId, renders.id))
      .where(and(
        eq(galleryItems.isPublic, true),
        // Only include items with images (not videos)
        // Assuming videos have different type or URL pattern
      ))
      .limit(10000); // Limit to 10k images for sitemap size

    const imageEntries: MetadataRoute.Sitemap = items
      .filter(item => item.imageUrl && !item.imageUrl.includes('.mp4') && !item.imageUrl.includes('.webm'))
      .map((item) => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: new Date(item.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        // Note: Next.js sitemap doesn't support image-specific metadata
        // Images are referenced in the main sitemap entry
      }));

    return imageEntries;
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    return [];
  }
}
