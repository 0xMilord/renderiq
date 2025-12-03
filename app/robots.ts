import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/signup',
          '/pricing',
          '/gallery',
          '/gallery/*',
          '/use-cases',
          '/use-cases/*',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/render/*',
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/auth/*',
          '/_next/*',
          '/admin/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/use-cases',
          '/use-cases/*',
          '/gallery',
          '/gallery/*',
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/auth/*',
        ],
      }
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-images.xml`,
    ],
  }
}

