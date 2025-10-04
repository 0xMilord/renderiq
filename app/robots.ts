import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://arqihive.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/signup',
          '/plans',
          '/gallery',
          '/use-cases',
          '/use-cases/*',
          '/privacy',
          '/terms',
          '/engine/*',
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
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/auth/*',
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

