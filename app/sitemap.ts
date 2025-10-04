import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aecosec.com'
  
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

  // Use case pages
  const useCasePages = [
    '/use-cases/real-time-visualization',
    '/use-cases/initial-prototyping',
    '/use-cases/material-testing',
    '/use-cases/design-iteration',
    '/use-cases/residential',
    '/use-cases/commercial',
    '/use-cases/hospitality',
    '/use-cases/retail',
    '/use-cases/educational',
    '/use-cases/landscape',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Engine pages
  const enginePages = [
    '/engine/interior-ai',
    '/engine/exterior-ai',
    '/engine/furniture-ai',
    '/engine/site-plan-ai',
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
    ...enginePages,
    ...dashboardPages,
  ]
}

