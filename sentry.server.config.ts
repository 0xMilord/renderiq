// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Generate release identifier from package.json version and build time
// Format: renderiq@0.1.0-{buildId} or use SENTRY_RELEASE env var
// The release is automatically set by next.config.ts during build
function getRelease(): string | undefined {
  // Use explicit release if provided (set in next.config.ts or env var)
  return process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE;
}

Sentry.init({
  // Use provided DSN or fallback to env var
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856",
  
  // Only initialize if DSN is provided
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856"),
  
  // Performance Monitoring: Set tracesSampleRate to 1.0 to capture 100% of transactions
  // Adjust this value in production (recommended: 0.1 for 10% sampling)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable Structured Logs to send logs to Sentry
  // This allows you to view and query logs in Sentry alongside errors
  enableLogs: true,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development' ? true : false,
  
  // Set sample rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configure which integrations to use
  integrations: [
    // HTTP integration for tracking HTTP requests (outgoing)
    Sentry.httpIntegration({
      // Track all HTTP requests
      tracing: true,
      // Breadcrumbs for HTTP requests
      breadcrumbs: true,
    }),
    // Node.js profiling integration (if available)
    ...(Sentry.nodeProfilingIntegration ? [Sentry.nodeProfilingIntegration()] : []),
    // Console logging integration - sends console.log, console.warn, console.error to Sentry
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'warn', 'error'], // Only send log, warn, and error (not debug/info to reduce noise)
    }),
  ],
  
  // Release Health Configuration
  // Server-mode sessions: Each HTTP request represents a session
  // This enables Release Health monitoring for server-side
  release: getRelease(),
  
  // Enable automatic session tracking (default: true for server mode)
  // In server mode, each request is tracked as a session
  autoSessionTracking: true,
  
  // Filter out known non-critical errors
  ignoreErrors: [
    // Database connection errors that are handled
    'ECONNREFUSED',
    'ETIMEDOUT',
    // Validation errors that are expected
    'ValidationError',
    'ZodError',
  ],
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
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
      
      // Redact sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        sensitiveHeaders.forEach(header => {
          if (event.request.headers?.[header]) {
            event.request.headers[header] = '[REDACTED]';
          }
        });
      }
    }
    
    // Redact sensitive data from extra context
    if (event.extra) {
      const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
      sensitiveKeys.forEach(key => {
        if (event.extra?.[key]) {
          event.extra[key] = '[REDACTED]';
        }
      });
    }
    
    return event;
  },
  
  // Configure breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data from breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (breadcrumb.data[header]) {
          breadcrumb.data[header] = '[REDACTED]';
        }
      });
    }
    return breadcrumb;
  },
});

