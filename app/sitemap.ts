import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.com'
  
  const currentDate = new Date()
  
  // Static pages
  const staticPages = [
    '',
    '/login',
    '/signup',
    '/plans',
    '/gallery',
    '/use-cases',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // Use case pages - Enhanced for AI discoverability
  const useCasePages = [
    '/use-cases/real-time-visualization',
    '/use-cases/initial-prototyping',
    '/use-cases/material-testing',
    '/use-cases/design-iteration',
    '/use-cases/residential-architecture',
    '/use-cases/commercial-architecture',
    '/use-cases/hospitality-design',
    '/use-cases/retail-space-design',
    '/use-cases/educational-facilities',
    '/use-cases/landscape-architecture',
    '/use-cases/urban-planning',
    '/use-cases/interior-design',
    '/use-cases/renovation-projects',
    '/use-cases/concept-development',
    '/use-cases/client-presentations',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // AI tool pages for better discoverability
  const aiToolPages = [
    '/ai-architecture-tools',
    '/ai-rendering-software',
    '/architectural-visualization-ai',
    '/ai-design-assistant',
    '/sketch-to-render-ai',
    '/ai-interior-design',
    '/ai-exterior-rendering',
    '/ai-furniture-placement',
    '/ai-site-planning',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Tutorial and help pages
  const tutorialPages = [
    '/tutorials/getting-started',
    '/tutorials/advanced-techniques',
    '/tutorials/best-practices',
    '/tutorials/workflow-integration',
    '/tutorials/export-options',
    '/help/faq',
    '/help/support',
    '/help/api-documentation',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Engine pages
  const enginePages = [
    '/render',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Dashboard pages (lower priority, some require auth)
  const dashboardPages = [
    '/dashboard',
    '/dashboard/projects',
    '/dashboard/billing',
    '/dashboard/profile',
    '/dashboard/settings',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...useCasePages,
    ...aiToolPages,
    ...tutorialPages,
    ...enginePages,
    ...dashboardPages,
  ]
}

