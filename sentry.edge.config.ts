// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is statically included in the edge bundle, so be careful about what you include.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    // Add additional context
    if (event.request) {
      // Redact sensitive paths
      if (event.request.url) {
        event.request.url = event.request.url
          .replace(/\/api\/[^/]+\/[^/]+/g, '/api/***')
          .replace(/\/auth\/[^/]+/g, '/auth/***');
      }
    }
    
    return event;
  },
});

