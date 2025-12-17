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
  
  // Server components external packages - these won't be bundled, use node_modules directly
  // ✅ FIX: Added for Turbopack compatibility - ensures these packages are resolved correctly
  // ✅ FIX: Added React and tldraw to prevent server-side bundling issues
  serverExternalPackages: [
    '@ai-sdk/google', 
    'ai', 
    '@google/genai', 
    '@google-cloud/vertexai',
    'react',
    'react-dom',
    'tldraw',
    '@tldraw/store',
    '@tldraw/utils',
    '@tldraw/state',
    '@tldraw/state-react',
    '@tldraw/validate',
    '@tldraw/tlschema',
  ],
  
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
    // ✅ FIX: Ensure serverExternalPackages works with Turbopack
    // Turbopack respects serverExternalPackages, but we can also add explicit externals
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
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
    
    // Fix module resolution for @ai-sdk packages and ai package
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      
      // ✅ CRITICAL FIX: Ensure React resolves to the correct version
      // This prevents the "createContext is not a function" error
      try {
        const reactPath = require.resolve('react', { paths: [process.cwd()] });
        const reactDomPath = require.resolve('react-dom', { paths: [process.cwd()] });
        config.resolve.alias['react'] = reactPath;
        config.resolve.alias['react-dom'] = reactDomPath;
        config.resolve.alias['react/jsx-runtime'] = require.resolve('react/jsx-runtime', { paths: [process.cwd()] });
        config.resolve.alias['react/jsx-dev-runtime'] = require.resolve('react/jsx-dev-runtime', { paths: [process.cwd()] });
        
        if (dev) {
          console.log('✅ Module resolution: React resolved to', reactPath);
        }
      } catch (e) {
        if (dev) {
          console.warn('⚠️ Module resolution: Could not resolve React, using default');
        }
      }
      
      // ✅ CRITICAL FIX: Ensure React resolves to the correct version FIRST
      // This prevents the "createContext is not a function" error
      try {
        const reactPath = require.resolve('react', { paths: [process.cwd()] });
        const reactDomPath = require.resolve('react-dom', { paths: [process.cwd()] });
        config.resolve.alias['react'] = reactPath;
        config.resolve.alias['react-dom'] = reactDomPath;
        config.resolve.alias['react/jsx-runtime'] = require.resolve('react/jsx-runtime', { paths: [process.cwd()] });
        config.resolve.alias['react/jsx-dev-runtime'] = require.resolve('react/jsx-dev-runtime', { paths: [process.cwd()] });
        
        if (dev) {
          console.log('✅ Module resolution: React resolved to', reactPath);
        }
      } catch (e) {
        if (dev) {
          console.warn('⚠️ Module resolution: Could not resolve React, using default');
        }
      }
      
      // ✅ FIX: Try to resolve packages for better module resolution
      // This helps both webpack and Turbopack find the modules
      try {
        const googlePath = require.resolve('@ai-sdk/google', { paths: [process.cwd()] });
        const aiPath = require.resolve('ai', { paths: [process.cwd()] });
        config.resolve.alias['@ai-sdk/google'] = googlePath;
        config.resolve.alias['ai'] = aiPath;
        // Log successful resolution for debugging
        if (dev) {
          console.log('✅ Module resolution: @ai-sdk/google and ai resolved successfully');
        }
      } catch (e) {
        // If resolution fails, webpack will try to find them in node_modules
        // serverExternalPackages will handle externalization
        if (dev) {
          console.warn('⚠️ Module resolution: Could not resolve @ai-sdk/google or ai, using node_modules fallback');
        }
      }
      
      // ✅ FIX: Ensure these packages are not bundled (externalized)
      // This prevents React and tldraw from being bundled on the server, avoiding multiple instances
      config.externals = config.externals || [];
      const externalPackages = [
        '@ai-sdk/google', 
        'ai',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'tldraw',
        '@tldraw/store',
        '@tldraw/utils',
        '@tldraw/state',
        '@tldraw/state-react',
        '@tldraw/validate',
        '@tldraw/tlschema',
      ];
      
      if (Array.isArray(config.externals)) {
        config.externals.push(...externalPackages);
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = (context: any, request: string, callback: any) => {
          if (externalPackages.includes(request) || request.startsWith('react/') || request.startsWith('@tldraw/')) {
            return callback(null, `commonjs ${request}`);
          }
          return originalExternals(context, request, callback);
        };
      } else {
        // If externals is an object, merge it
        const externalsObj = config.externals as Record<string, boolean>;
        externalPackages.forEach(pkg => {
          externalsObj[pkg] = true;
        });
      }
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
    const redirects = [
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
    ];

    // Redirect old /apps/[toolSlug] routes to root-level /[toolSlug] (apps)
    // This handles the migration from /apps/tool-slug to /tool-slug
    redirects.push({
      source: '/apps/:toolSlug',
      destination: '/:toolSlug',
      permanent: true,
    });

    // Redirect old tool slugs to new SEO-optimized slugs
    const oldToNewSlugMap: Record<string, string> = {
      'render-section-drawing': 'ai-architectural-section-drawing-tool',
      'render-to-cad': 'convert-render-to-cad-drawing-tool',
      'render-upscale': 'ai-render-upscaler-architectural-enhancement',
      'render-effects': 'architectural-render-effects-stylization-tool',
      'floorplan-to-furnished': 'ai-floor-plan-furniture-placement-tool',
      'floorplan-to-3d': 'convert-2d-floor-plan-to-3d-diagram',
      'floorplan-technical-diagrams': 'floor-plan-technical-diagram-generator',
      'exploded-diagram': 'architectural-exploded-diagram-generator',
      'multi-angle-view': 'multi-angle-architectural-view-generator',
      'change-texture': 'ai-interior-texture-material-replacement',
      'material-alteration': 'facade-material-alteration-replacement-tool',
      'change-lighting': 'interior-lighting-simulation-change-tool',
      'upholstery-change': 'furniture-upholstery-fabric-replacement-tool',
      'product-placement': 'ai-product-placement-interior-visualization',
      'item-change': 'interior-item-replacement-swap-tool',
      'moodboard-to-render': 'convert-moodboard-to-interior-render-ai',
      '3d-to-render': 'convert-3d-model-to-photorealistic-render',
      'sketch-to-render': 'convert-architectural-sketch-to-render-ai',
      'presentation-board-maker': 'architectural-presentation-board-maker-tool',
      'portfolio-layout-generator': 'architect-portfolio-layout-generator-tool',
      'presentation-sequence-creator': 'architectural-presentation-sequence-creator',
      'render-to-video': 'animate-architectural-render-to-video-ai',
      'text-to-video-walkthrough': 'ai-architectural-walkthrough-video-generator',
      'keyframe-sequence-video': 'architectural-keyframe-sequence-video-tool',
    };

    // Add redirects for old slugs
    Object.entries(oldToNewSlugMap).forEach(([oldSlug, newSlug]) => {
      redirects.push({
        source: `/${oldSlug}`,
        destination: `/${newSlug}`,
        permanent: true,
      });
      redirects.push({
        source: `/apps/${oldSlug}`,
        destination: `/${newSlug}`,
        permanent: true,
      });
    });

    // Plugin slug redirects (old short slugs to new SEO-optimized slugs)
    const pluginRedirects = [
      { from: '/plugins/sketchup', to: '/plugins/sketchup-ai-rendering-plugin' },
      { from: '/plugins/revit', to: '/plugins/revit-ai-rendering-plugin' },
      { from: '/plugins/autocad', to: '/plugins/autocad-ai-rendering-plugin' },
      { from: '/plugins/blender', to: '/plugins/blender-ai-rendering-plugin' },
      { from: '/plugins/rhino', to: '/plugins/rhino-ai-rendering-plugin' },
    ];

    pluginRedirects.forEach(({ from, to }) => {
      redirects.push({
        source: from,
        destination: to,
        permanent: true,
      });
    });

    return redirects;
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