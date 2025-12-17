import { NextResponse } from 'next/server'
import { MetadataRoute } from 'next'
import { getAllTools } from '@/lib/tools/registry'
import { generateSitemapXML } from '@/lib/utils/sitemap-xml'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

async function getSitemapData(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Apps index page
  const appsIndex = {
    url: `${baseUrl}/apps`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }

  // Get all tools dynamically
  const tools = getAllTools()
  
  // Individual tool pages
  const toolPages = tools
    .filter(tool => tool.status === 'online') // Only include online tools
    .map((tool) => ({
      url: `${baseUrl}/${tool.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  return [appsIndex, ...toolPages]
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
    console.error('Error generating apps sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}




