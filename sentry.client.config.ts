// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Generate release identifier from package.json version and build time
// Format: renderiq@0.1.0-{buildId} or use SENTRY_RELEASE env var
// The release is automatically set by next.config.ts during build
function getRelease(): string | undefined {
  // Use explicit release if provided (set in next.config.ts or env var)
  return process.env.NEXT_PUBLIC_SENTRY_RELEASE;
}

Sentry.init({
  // Use provided DSN or fallback to env var
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856",
  
  // Only initialize if DSN is provided
  enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856"),
  
  // Performance Monitoring: Set tracesSampleRate to 1.0 to capture 100% of transactions
  // Adjust this value in production (recommended: 0.1 for 10% sampling)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable Structured Logs to send logs to Sentry
  // This allows you to view and query logs in Sentry alongside errors
  enableLogs: true,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development' ? true : false,
  
  // Enable Session Replay for better error context
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  
  // Set sample rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configure which integrations to use
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and user input
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserProfilingIntegration(),
    // Browser tracing integration for performance monitoring
    Sentry.browserTracingIntegration({
      // Track navigation changes in SPAs
      enableInp: true,
    }),
    // Console logging integration - sends console.log, console.warn, console.error to Sentry
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'warn', 'error'], // Only send log, warn, and error (not debug/info to reduce noise)
    }),
  ],
  
  // Distributed Tracing: Configure which URLs should have trace propagation headers
  // This enables distributed tracing across your frontend and backend
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/renderiq\.io\/api/,
    /^https:\/\/.*\.renderiq\.io\/api/,
    /^https:\/\/.*\.vercel\.app\/api/,
    // Include any other API domains you use
    process.env.NEXT_PUBLIC_BASE_URL ? new RegExp(`^${process.env.NEXT_PUBLIC_BASE_URL}/api`) : undefined,
  ].filter(Boolean) as (string | RegExp)[],
  
  // Release Health Configuration
  // Automatically tracks sessions for release health monitoring
  // Sessions are created on page load and navigation changes
  release: getRelease(),
  
  // Enable automatic session tracking (default: true)
  // This enables Release Health monitoring
  autoSessionTracking: true,
  
  // Session tracking configuration
  // For Next.js SPAs, sessions are created on:
  // - Initial page load
  // - Navigation changes (client-side routing)
  // - Page visibility changes (when app comes to foreground)
  sessionTracking: {
    // Track sessions even when app is in background
    // Set to false to only track when app is active
    trackBackgroundSessions: false,
  },
  
  // Filter out known non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    'conduitPage',
    // Network errors that are expected
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // ResizeObserver errors (common and non-critical)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
  
  // Filter out URLs that shouldn't be tracked
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Allow events in development for testing (can be disabled with NEXT_PUBLIC_SENTRY_DEBUG=false)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'false') {
      return null;
    }
    
    // Add additional context
    if (event.request) {
      event.request.url = event.request.url?.replace(/\/api\/[^/]+\/[^/]+/g, '/api/***');
    }
    
    return event;
  },
  
  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data from breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },
});

