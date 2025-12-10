# Sentry Performance Monitoring Setup

## ✅ Configuration Complete

Performance monitoring has been configured for your Next.js application with distributed tracing enabled.

## Configuration Summary

### DSN Configuration
- **DSN**: `https://7e0e6b9bdfa5b30016a80db73bd2474b@o4510509897809920.ingest.us.sentry.io/4510509899513856`
- **Organization**: renderiq
- **Project**: javascript-nextjs

### Performance Monitoring Settings

#### Client-Side (`sentry.client.config.ts`)
- ✅ `tracesSampleRate`: 1.0 (development) / 0.1 (production)
- ✅ `browserTracingIntegration()` enabled
- ✅ `tracePropagationTargets` configured for distributed tracing
- ✅ `enableInp` enabled for Interaction to Next Paint tracking

#### Server-Side (`sentry.server.config.ts`)
- ✅ `tracesSampleRate`: 1.0 (development) / 0.1 (production)
- ✅ `httpIntegration()` enabled for HTTP request tracing

#### Edge Runtime (`sentry.edge.config.ts`)
- ✅ `tracesSampleRate`: 1.0 (development) / 0.1 (production)

### Distributed Tracing

**Trace Propagation Targets** configured for:
- `localhost` (development)
- `https://renderiq.io/api/*` (production)
- `https://*.renderiq.io/api/*` (subdomains)
- `https://*.vercel.app/api/*` (Vercel deployments)
- Custom base URL from `NEXT_PUBLIC_BASE_URL` env var

This enables end-to-end tracing from frontend to backend API calls.

## What's Being Tracked

### Automatic Instrumentation

1. **Page Loads**
   - Initial page load performance
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

2. **Navigation**
   - Client-side route transitions
   - Next.js router navigation
   - SPA navigation performance

3. **API Requests**
   - All fetch/XHR requests to configured targets
   - Request/response timing
   - Error tracking for failed requests

4. **User Interactions**
   - Interaction to Next Paint (INP)
   - Click events
   - Form submissions

5. **Server-Side**
   - API route execution time
   - Server component render time
   - Database query performance (if instrumented)

## Sample Rates

### Development
- **Traces**: 100% (1.0) - Capture all transactions for debugging
- **Sessions**: 10% (0.1)
- **Replays**: 10% (0.1)

### Production
- **Traces**: 10% (0.1) - Recommended for cost management
- **Sessions**: 10% (0.1)
- **Replays**: 10% (0.1)

**Note**: Adjust `tracesSampleRate` in production based on your traffic and budget. Higher rates provide more data but increase costs.

## Viewing Performance Data

### In Sentry Dashboard

1. **Performance Tab**
   - Go to **Performance** in Sentry dashboard
   - View transaction list
   - Filter by transaction type, environment, release

2. **Transaction Details**
   - Click on any transaction
   - View waterfall chart
   - See span breakdown
   - Identify slow operations

3. **Metrics**
   - P50, P75, P95, P99 latencies
   - Throughput (requests per minute)
   - Error rate
   - Apdex score

### Key Metrics to Monitor

1. **Page Load Performance**
   - Transaction: `pageload`
   - Monitor: LCP, FCP, TTFB

2. **Navigation Performance**
   - Transaction: `navigation`
   - Monitor: Route transition time

3. **API Performance**
   - Transaction: `http.client` or custom spans
   - Monitor: Request duration, error rate

4. **Server Performance**
   - Transaction: API route names
   - Monitor: Response time, database queries

## Custom Instrumentation

### Manual Transaction Creation

```typescript
import * as Sentry from '@sentry/nextjs';

// Start a custom transaction
const transaction = Sentry.startTransaction({
  name: 'Custom Operation',
  op: 'custom',
});

// Add spans
const span = transaction.startChild({
  op: 'db.query',
  description: 'Fetch user data',
});

// Your code here
await fetchUserData();

// Finish span
span.finish();

// Finish transaction
transaction.finish();
```

### Instrumenting API Routes

```typescript
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  // Transaction is automatically created for API routes
  // Add custom spans for specific operations
  
  const span = Sentry.getCurrentScope().getTransaction()?.startChild({
    op: 'db.query',
    description: 'Fetch projects',
  });
  
  const projects = await db.query(...);
  
  span?.finish();
  
  return NextResponse.json({ projects });
}
```

### Instrumenting Client Components

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';

function MyComponent() {
  const handleClick = () => {
    // Create span for user interaction
    const span = Sentry.getCurrentScope().getTransaction()?.startChild({
      op: 'user.action',
      description: 'Button click',
    });
    
    // Your code
    doSomething();
    
    span?.finish();
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

## Best Practices

### 1. Sample Rate Management

- **Development**: Use 1.0 (100%) to see all transactions
- **Production**: Start with 0.1 (10%) and adjust based on:
  - Traffic volume
  - Budget constraints
  - Data needs

### 2. Focus on Critical Paths

- Monitor key user journeys
- Track high-traffic endpoints
- Identify slow database queries

### 3. Set Up Alerts

Create alerts for:
- P95 latency > threshold
- Error rate spikes
- Throughput drops

### 4. Regular Review

- Weekly performance reviews
- Identify regressions
- Track improvements

## Troubleshooting

### No Transactions Appearing

1. **Check DSN**: Verify DSN is set correctly
2. **Check Sample Rate**: Ensure `tracesSampleRate > 0`
3. **Check Environment**: Verify you're in the correct environment
4. **Check Network**: Ensure requests to Sentry aren't blocked

### Distributed Tracing Not Working

1. **Check tracePropagationTargets**: Verify URLs match your API endpoints
2. **Check CORS**: Ensure backend accepts trace headers
3. **Check Network Tab**: Look for `sentry-trace` header in requests

### Too Many Transactions

1. **Lower Sample Rate**: Reduce `tracesSampleRate`
2. **Filter Transactions**: Use `beforeSendTransaction` to filter
3. **Adjust Sampling**: Use `tracesSampler` for dynamic sampling

## Verification

### Test Performance Monitoring

1. **Visit Your App**: Navigate through pages
2. **Check Sentry**: Go to Performance tab
3. **Verify Transactions**: Should see `pageload` and `navigation` transactions
4. **Check API Calls**: Make API requests and verify they appear

### Expected Transactions

After using your app, you should see:
- `pageload` - Initial page loads
- `navigation` - Client-side navigation
- API route names - Server-side API calls
- Custom transactions - If you've added any

## Next Steps

1. ✅ **Deploy to Production**: Performance monitoring will start automatically
2. ✅ **Set Up Alerts**: Create alerts for performance regressions
3. ✅ **Review Metrics**: Check Performance tab regularly
4. ✅ **Optimize**: Use data to identify and fix slow operations

## Additional Resources

- [Sentry Performance Documentation](https://docs.sentry.io/product/performance/)
- [Next.js Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/performance/)
- [Distributed Tracing Guide](https://docs.sentry.io/product/performance/distributed-tracing/)

