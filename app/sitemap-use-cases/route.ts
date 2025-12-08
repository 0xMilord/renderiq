import { NextResponse } from 'next/server'
import { MetadataRoute } from 'next'
import { primaryUseCases, industryUseCases } from '@/lib/data/use-cases'
import { generateSitemapXML } from '@/lib/utils/sitemap-xml'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

async function getSitemapData(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Use-cases index page
  const useCasesIndex = {
    url: `${baseUrl}/use-cases`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }

  // Primary use cases (10 main use cases)
  const primaryUseCasePages = primaryUseCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Industry use cases (6 industry-specific use cases)
  const industryUseCasePages = industryUseCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [useCasesIndex, ...primaryUseCasePages, ...industryUseCasePages]
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
    console.error('Error generating use-cases sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}

