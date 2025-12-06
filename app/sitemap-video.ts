import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { galleryItems, renders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export default async function sitemapVideo(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  
  try {
    // Fetch all public gallery items that are videos
    const videoItems = await db
      .select({
        id: galleryItems.id,
        videoUrl: renders.outputUrl,
        createdAt: galleryItems.createdAt,
        title: renders.prompt,
        thumbnailUrl: renders.outputUrl, // Use same URL as thumbnail
      })
      .from(galleryItems)
      .innerJoin(renders, eq(galleryItems.renderId, renders.id))
      .where(and(
        eq(galleryItems.isPublic, true),
        eq(renders.type, 'video')
      ))
      .limit(1000); // Limit to 1k videos

    const videoEntries: MetadataRoute.Sitemap = videoItems
      .filter(item => item.videoUrl)
      .map((item) => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: new Date(item.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    return videoEntries;
  } catch (error) {
    console.error('Error generating video sitemap:', error);
    return [];
  }
}


