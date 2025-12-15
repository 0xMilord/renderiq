import { MetadataRoute } from 'next'
import { primaryUseCases, industryUseCases } from '@/lib/data/use-cases'

// Use Node.js runtime for sitemap generation
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemapUseCases(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  const currentDate = new Date()
  
  // Use-cases index page
  const useCasesIndex = {
    url: `${baseUrl}/use-cases`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  };

  // Primary use cases (10 main use cases)
  const primaryUseCasePages = primaryUseCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Industry use cases (6 industry-specific use cases)
  const industryUseCasePages = industryUseCases.map((useCase) => ({
    url: `${baseUrl}/use-cases/${useCase.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [useCasesIndex, ...primaryUseCasePages, ...industryUseCasePages];
}







