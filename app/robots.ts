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
      },
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/gallery',
          '/gallery/*',
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
        ],
      },
      {
        userAgent: 'Googlebot-Video',
        allow: [
          '/gallery',
          '/gallery/*',
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/gallery',
          '/gallery/*',
          '/blog',
          '/blog/*',
        ],
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/auth/*',
        ],
        crawlDelay: 1,
      }
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-use-cases.xml`,
      `${baseUrl}/sitemap-apps.xml`,
      `${baseUrl}/sitemap-docs.xml`,
      `${baseUrl}/sitemap-images.xml`,
      `${baseUrl}/sitemap-video.xml`,
    ],
  }
}

