// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
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
  ],
  
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
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
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

