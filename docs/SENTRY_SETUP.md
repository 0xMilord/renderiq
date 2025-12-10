# Sentry Error Tracking Setup

This document describes the Sentry error tracking integration for production error monitoring across all applications, tools, dashboard, canvas, render, unified chat interface, payments, and billing.

## Overview

Sentry is integrated throughout the application to provide comprehensive error tracking and monitoring in production. The integration includes:

- **Client-side error tracking** (browser)
- **Server-side error tracking** (API routes, server components)
- **Edge runtime error tracking** (middleware)
- **Automatic error capture** via logger utility
- **Error boundaries** for React components
- **Context-aware error reporting** with user and feature information
- **Release Health monitoring** - Track session health, crash rates, and release adoption

## Environment Variables

Add the following environment variables to your production environment:

### Required Variables

```bash
# Sentry DSN (Data Source Name) - Get this from your Sentry project settings
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Release Health Variables

Release tracking is automatically configured, but you can override it:

```bash
# Optional: Sentry Release (for tracking deployments)
# Format: renderiq@{version}-{buildId}
# Example: renderiq@0.1.0-abc1234
# 
# If not set, it's automatically generated from:
# - package.json version
# - Git commit SHA (on Vercel) or build timestamp
NEXT_PUBLIC_SENTRY_RELEASE=renderiq@1.0.0-abc1234
# or for server-side
SENTRY_RELEASE=renderiq@1.0.0-abc1234
```

**Note:** The release is automatically generated during build from `package.json` version and build ID. You only need to set this manually if you want a custom release identifier.

### Optional Variables

```bash
# Enable Sentry in development (default: disabled)
NEXT_PUBLIC_SENTRY_DEBUG=true
SENTRY_DEBUG=true

# Customize sample rates (default: 0.1 for production, 1.0 for development)
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_REPLAY_SAMPLE_RATE=0.1
```

## Configuration Files

### Client Configuration (`sentry.client.config.ts`)

Configures Sentry for browser/client-side error tracking:
- Session replay for error context
- Browser profiling
- Error filtering and redaction
- Breadcrumb collection

### Server Configuration (`sentry.server.config.ts`)

Configures Sentry for server-side error tracking:
- HTTP integration
- Node.js profiling
- Sensitive data redaction
- Request context

### Edge Configuration (`sentry.edge.config.ts`)

Configures Sentry for edge runtime (middleware):
- Lightweight error tracking
- Request context

## Integration Points

### 1. Logger Utility (`lib/utils/logger.ts`)

The logger automatically sends errors and warnings to Sentry:

```typescript
import { logger } from '@/lib/utils/logger';

// Errors are automatically sent to Sentry
logger.error('Something went wrong', error);

// Warnings are sent to Sentry in production
logger.warn('Potential issue detected');

// Set user context
await logger.setUser({ id: 'user-id', email: 'user@example.com' });

// Add breadcrumbs
await logger.addBreadcrumb('User action', 'user', 'info', { action: 'click' });

// Set context
await logger.setContext('feature', { featureName: 'render' });
```

### 2. Error Boundaries (`components/error-boundary.tsx`)

React error boundaries automatically capture component errors:

```typescript
import ErrorBoundary from '@/components/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 3. API Routes

API routes use Sentry for error tracking with context:

```typescript
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    // Add context
    Sentry.setContext('api_route', {
      route: '/api/renders',
      userId: user?.id,
    });
    
    // Logger automatically sends to Sentry
    logger.error('API error:', error);
  }
}
```

### 4. Client Components

Client components use the Sentry hook for error tracking:

```typescript
import { captureErrorWithContext } from '@/lib/hooks/use-sentry';

try {
  // Your code
} catch (error) {
  captureErrorWithContext(error, {
    component: 'ComponentName',
    feature: 'featureName',
    additionalContext: 'value',
  });
}
```

### 5. Middleware

Middleware automatically tracks errors in edge runtime:

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Middleware code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      middleware: true,
    },
  });
}
```

## Error Tracking Coverage

### Applications & Tools
- ✅ Dashboard errors
- ✅ Canvas errors
- ✅ Render interface errors
- ✅ Unified chat interface errors
- ✅ Tool-specific errors

### Payment & Billing
- ✅ Payment creation errors
- ✅ Payment verification errors
- ✅ Duplicate payment detection
- ✅ Billing API errors
- ✅ Credit refund failures

### API Routes
- ✅ Render generation errors
- ✅ Video generation errors
- ✅ Image generation errors
- ✅ Payment processing errors
- ✅ Billing operations errors

### Client Components
- ✅ React component errors (via error boundaries)
- ✅ User interaction errors
- ✅ Network errors
- ✅ Generation failures

## Sensitive Data Protection

Sentry automatically redacts sensitive information:

- Passwords
- API keys
- Tokens
- Authorization headers
- Cookies
- Credit card information
- Payment IDs (partial redaction)

## Sample Rates

### Production
- **Traces**: 10% (0.1)
- **Session Replay**: 10% (0.1) on errors, 10% (0.1) on sessions
- **Profiling**: 10% (0.1)

### Development
- **Traces**: 100% (1.0)
- **Session Replay**: 10% (0.1)
- **Profiling**: 100% (1.0)

Adjust these rates in the Sentry configuration files based on your traffic and needs.

## Monitoring & Alerts

Set up alerts in Sentry for:

1. **Critical Errors**: Payment failures, credit refund failures
2. **High-Frequency Errors**: API errors, generation failures
3. **New Issues**: New error types
4. **Error Rate Spikes**: Sudden increases in error rates

## Best Practices

1. **Always add context** when capturing errors:
   ```typescript
   Sentry.setContext('feature', { featureName, userId, etc });
   ```

2. **Use tags for filtering**:
   ```typescript
   Sentry.captureException(error, {
     tags: { component: 'payment', critical: true },
   });
   ```

3. **Don't log sensitive data** - Sentry will redact, but it's better to avoid it

4. **Use logger for consistency** - The logger automatically handles Sentry integration

5. **Set user context** when available:
   ```typescript
   await logger.setUser({ id: user.id, email: user.email });
   ```

## Troubleshooting

### Errors not appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify Sentry is enabled (not in development mode unless `SENTRY_DEBUG=true`)
3. Check browser console for Sentry initialization errors
4. Verify network requests to Sentry are not blocked

### Too many errors

1. Adjust sample rates in configuration files
2. Add more error filters in `ignoreErrors`
3. Use `beforeSend` to filter out non-critical errors

### Missing context

1. Ensure you're setting context before capturing errors
2. Check that user context is set when available
3. Verify breadcrumbs are being added for user actions

## Support

For Sentry-specific issues, refer to:
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)

For application-specific issues, check the error details in Sentry for context and stack traces.

