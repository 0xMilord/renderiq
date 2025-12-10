// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is statically included in the edge bundle, so be careful about what you include.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Generate release identifier (simplified for edge runtime)
// The release is automatically set by next.config.ts during build
function getRelease(): string | undefined {
  return process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE;
}

Sentry.init({
  // Use provided DSN or fallback to env var
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856",
  
  // Only initialize if DSN is provided
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856"),
  
  // Performance Monitoring: Set tracesSampleRate to 1.0 to capture 100% of transactions
  // Adjust this value in production (recommended: 0.1 for 10% sampling)
  // Disabled in development to reduce console noise - set SENTRY_TRACING=true to enable
  tracesSampleRate: process.env.SENTRY_TRACING === 'true' 
    ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0)
    : (process.env.NODE_ENV === 'production' ? 0.1 : 0),
  
  // Enable Structured Logs to send logs to Sentry
  // This allows you to view and query logs in Sentry alongside errors
  enableLogs: true,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release Health Configuration for Edge Runtime
  // Edge sessions: Each middleware/edge route request represents a session
  release: getRelease(),
  
  // Enable automatic session tracking for edge runtime
  autoSessionTracking: true,
  
  // Before sending event to Sentry
  beforeSend(event, hint) {
    // Allow events in development for testing (can be disabled with SENTRY_DEBUG=false)
    if (process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'false') {
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

