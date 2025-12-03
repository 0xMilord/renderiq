import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // Turbopack config for dev mode (--turbopack flag)
  turbopack: {
    resolveAlias: {
      'contentlayer2/generated': './.contentlayer/generated/index.mjs',
    },
  },
  // Webpack config for production builds (Turbopack not used in production)
  webpack: (config, { isServer }) => {
    if (isServer) {
      const path = require('path');
      config.resolve.alias = {
        ...config.resolve.alias,
        'contentlayer2/generated': path.resolve(__dirname, '.contentlayer/generated/index.mjs'),
      };
    } else {
      // Exclude pdfkit from client-side bundle (server-only library)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    // Exclude pdfkit from client bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push('pdfkit');
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'renderiq.io',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations for SEO
  compress: true,
  poweredByHeader: false,
  
  // Headers for better SEO and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://checkout.razorpay.com", // Razorpay checkout script
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob: https://api.dicebear.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://*.googleusercontent.com https://api.dicebear.com https://vercel.live https://api.razorpay.com wss://*.supabase.co", // Razorpay API
              "frame-src 'self' https://checkout.razorpay.com https://razorpay.com https://*.razorpay.com", // Razorpay checkout modal (allow all Razorpay subdomains)
              "child-src 'self' https://checkout.razorpay.com https://razorpay.com https://*.razorpay.com", // Razorpay checkout modal (alternative)
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.razorpay.com https://razorpay.com https://*.razorpay.com", // Allow form submissions to Razorpay
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ]
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/ai-tools',
        destination: '/ai-architecture-tools',
        permanent: true,
      },
      {
        source: '/rendering',
        destination: '/ai-rendering-software',
        permanent: true,
      },
    ]
  },
}

export default nextConfig