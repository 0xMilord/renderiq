// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Set sample rate for profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configure which integrations to use
  integrations: [
    Sentry.httpIntegration(),
    Sentry.nodeProfilingIntegration(),
  ],
  
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

