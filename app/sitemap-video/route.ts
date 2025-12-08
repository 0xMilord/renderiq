import { NextResponse } from 'next/server'
import { MetadataRoute } from 'next'
import { generateSitemapXML } from '@/lib/utils/sitemap-xml'
import { RendersDAL } from '@/lib/dal/renders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

async function getSitemapData(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  
  try {
    // Fetch all public videos from gallery
    // Use a large limit to get all videos (or implement pagination if needed)
    const videos = await RendersDAL.getPublicGallery(10000, 0, {
      sortBy: 'newest',
      filters: {
        contentType: 'video',
      },
    })
    
    // Convert to sitemap entries
    const videoPages = videos
      .filter(item => item.render.type === 'video' && item.render.outputUrl && item.render.status === 'completed')
      .map((item) => ({
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: item.render.createdAt || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    
    return videoPages
  } catch (error) {
    console.error('Error fetching videos for sitemap:', error)
    // Return empty array on error to prevent sitemap from breaking
    return []
  }
}

export async function GET() {
  try {
    const sitemap = await getSitemapData()
    const xml = generateSitemapXML(sitemap)
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating video sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}

