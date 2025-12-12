import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // Note: eslint config removed - Next.js 16 handles linting differently
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set output file tracing root to silence warning about multiple lockfiles
  outputFileTracingRoot: process.cwd(),
  
  // Generate build ID for Sentry release tracking
  generateBuildId: async () => {
    // Use Vercel's commit SHA if available, otherwise use timestamp
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
    }
    // Fallback to timestamp for local builds
    return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  },
  
  // Inject build ID and version into environment for Sentry
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 
                          new Date().toISOString().split('T')[0],
    // Generate Sentry release if not explicitly set
    ...(process.env.NEXT_PUBLIC_SENTRY_RELEASE ? {} : {
      NEXT_PUBLIC_SENTRY_RELEASE: (() => {
        const version = require('./package.json').version || '0.1.0';
        const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 
                       new Date().toISOString().split('T')[0];
        return `renderiq@${version}-${buildId}`;
      })(),
    }),
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
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      const path = require('path');
      config.resolve.alias = {
        ...config.resolve.alias,
        'contentlayer2/generated': path.resolve(__dirname, '.contentlayer/generated/index.mjs'),
      };
    } else {
      // Exclude server-only modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };

      // Add Workbox InjectManifest plugin for PWA
      if (!dev) {
        const { InjectManifest } = require('workbox-webpack-plugin');
        const path = require('path');

        config.plugins.push(
          new InjectManifest({
            swSrc: path.join(__dirname, 'public', 'sw.js'),
            swDest: path.join(__dirname, 'public', 'sw.js'),
            exclude: [
              /\.map$/,
              /manifest$/,
              /\.htaccess$/,
              /service-worker\.js$/,
              /sw\.js$/,
            ],
            // Include all static assets and Next.js chunks
            include: [
              /\.js$/,
              /\.css$/,
              /\.woff2?$/,
              /\.png$/,
              /\.jpg$/,
              /\.jpeg$/,
              /\.svg$/,
              /\.webp$/,
              /\.avif$/,
              /\.ico$/,
            ],
            // Maximum file size to precache (5MB)
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          })
        );
      }
    }
    // Exclude server-only packages from client bundle
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
        hostname: 'storage.googleapis.com',
      },
      // Support for custom GCS CDN domain (if configured)
      // Explicitly supports cdn.renderiq.io for fast image delivery
      // Note: CDN URLs should use regular <img> tags, not Next.js Image
      // This is just for allowing the domain if needed
      ...(process.env.GCS_CDN_DOMAIN ? [{
        protocol: 'https' as const,
        hostname: process.env.GCS_CDN_DOMAIN,
      }] : []),
      // Explicit CDN domain support (fallback if env var not set but domain is used)
      {
        protocol: 'https',
        hostname: 'cdn.renderiq.io',
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
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    // Disable image optimization for external CDN/storage URLs to avoid DNS issues
    // These should use regular <img> tags via shouldUseRegularImg() utility
    unoptimized: false, // Keep optimization enabled, but components should use <img> for CDN
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
          // Note: X-Frame-Options removed - using CSP frame-ancestors instead (more modern)
          // Note: X-XSS-Protection removed - deprecated, modern browsers ignore it
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
              // Scripts: Allow self, Razorpay checkout, Google Analytics/Tag Manager
              // Note: 'unsafe-inline' and 'unsafe-eval' required for Razorpay and some third-party scripts
              // TODO: Consider migrating to nonce-based CSP in future for better security
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.google.com https://*.google.com",
              // Styles: Allow self and inline (required for dynamic styling)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images: Allow self, data URIs, blobs, Google Analytics, and common CDN domains
              "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://storage.googleapis.com https://cdn.renderiq.io https://*.supabase.co https://lh3.googleusercontent.com https://*.googleusercontent.com https://api.dicebear.com",
              // Media: Allow self, blobs, and data URIs
              "media-src 'self' blob: data:",
              // Fonts: Allow self, data URIs, and Google Fonts
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
              // Connections: Allow self, Razorpay API, Google services, Supabase, and WebSockets
              "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google.com https://*.google.com https://www.googleapis.com https://*.googleapis.com https://*.supabase.co wss://*.supabase.co",
              // Frames: Allow self and Razorpay checkout (for payment modal)
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
              "child-src 'self' https://checkout.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              // Form actions: Allow self and Razorpay (for payment forms)
              "form-action 'self' https://checkout.razorpay.com https://api.razorpay.com",
              // Frame ancestors: Allow self (Razorpay opens in modal, not embedded)
              "frame-ancestors 'self'",
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
          // ✅ FIXED: Add CORS headers for service worker registration
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
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
      {
        source: '/sitemap-use-cases.xml',
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
      {
        source: '/sitemap-apps.xml',
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
      {
        source: '/sitemap-docs.xml',
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
  
  // Rewrites for sitemap routes (map .xml URLs to route handlers)
  async rewrites() {
    const rewrites = [
      {
        source: '/sitemap-use-cases.xml',
        destination: '/sitemap-use-cases',
      },
      {
        source: '/sitemap-apps.xml',
        destination: '/sitemap-apps',
      },
      {
        source: '/sitemap-docs.xml',
        destination: '/sitemap-docs',
      },
    ];

    // ✅ Rewrite auth.renderiq.io/auth/v1/* to API proxy route
    // This ensures the proxy works when requests come through the subdomain
    if (process.env.NEXT_PUBLIC_MASKED_AUTH_DOMAIN) {
      rewrites.push({
        source: '/auth/v1/:path*',
        destination: '/api/auth-proxy/:path*',
      });
    }

    return rewrites;
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "renderiq",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});