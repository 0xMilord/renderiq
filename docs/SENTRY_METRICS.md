# Sentry Metrics Setup

## ✅ Configuration Complete

Sentry Metrics are **automatically enabled** in your Sentry.init() configuration. No additional setup is required in the config files.

## Overview

Sentry Metrics allow you to track application metrics with powerful aggregation and visualization capabilities. Metrics are connected to your errors, logs, and spans, enabling easier debugging.

## Metric Types

### 1. Count
Track occurrences (e.g., user actions, API calls)

```typescript
Sentry.metrics.count('user_action', 1, {
  tags: { action: 'login' }
});
```

### 2. Distribution
Track measurements (e.g., response times, file sizes)

```typescript
Sentry.metrics.distribution('api_response_time', 150, {
  tags: { route: '/api/renders' },
  unit: 'millisecond'
});
```

### 3. Set
Track unique values (e.g., unique users, unique sessions)

```typescript
Sentry.metrics.set('unique_users', userId);
```

### 4. Gauge
Track current value (e.g., active connections, queue size)

```typescript
Sentry.metrics.gauge('active_connections', 42);
```

## Utility Functions

We've created a comprehensive metrics utility library at `lib/utils/sentry-metrics.ts` with pre-built functions for common metrics.

### Business Metrics - Render Generation

```typescript
import { 
  trackRenderStarted, 
  trackRenderCompleted, 
  trackRenderFailed,
  trackRenderCreditsCost 
} from '@/lib/utils/sentry-metrics';

// Track when render starts
trackRenderStarted('image', 'Modern', 'high');

// Track when render completes
trackRenderCompleted('image', 'Modern', 'high', 2500); // duration in ms

// Track when render fails
trackRenderFailed('image', 'Modern', 'high', 'API timeout');

// Track credits cost
trackRenderCreditsCost('image', 'high', 10);
```

### Business Metrics - Payments

```typescript
import { 
  trackPaymentOrderCreated, 
  trackPaymentVerified, 
  trackPaymentFailed 
} from '@/lib/utils/sentry-metrics';

// Track payment order creation
trackPaymentOrderCreated(99.99, 'USD', 'package_123');

// Track payment verification
trackPaymentVerified(99.99, 'USD', 'package_123');

// Track payment failure
trackPaymentFailed(99.99, 'USD', 'insufficient_funds');
```

### Performance Metrics - API Routes

```typescript
import { trackApiResponseTime, trackApiError } from '@/lib/utils/sentry-metrics';

// Track API response time
trackApiResponseTime('/api/renders', 'POST', 200, 150); // duration in ms

// Track API error
trackApiError('/api/renders', 'POST', 500, 'Database connection failed');
```

### Performance Metrics - Database

```typescript
import { trackDatabaseQuery, trackDatabaseQueryCount } from '@/lib/utils/sentry-metrics';

// Track database query time
trackDatabaseQuery('SELECT', 'renders', 25); // duration in ms

// Track database query count
trackDatabaseQueryCount('SELECT', 'renders');
```

### Performance Metrics - External APIs

```typescript
import { trackExternalApiCall, trackExternalApiError } from '@/lib/utils/sentry-metrics';

// Track external API call
trackExternalApiCall('google-ai', '/generate', 1200, 200);

// Track external API error
trackExternalApiError('google-ai', '/generate', 'Rate limit exceeded');
```

### Business Metrics - Credits

```typescript
import { 
  trackCreditsEarned, 
  trackCreditsSpent, 
  trackCreditsBalance 
} from '@/lib/utils/sentry-metrics';

// Track credits earned
trackCreditsEarned(100, 'purchase');

// Track credits spent
trackCreditsSpent(10, 'render');

// Track current balance
trackCreditsBalance(500, userId);
```

## Integration Examples

### Example 1: API Route with Metrics

```typescript
import { trackApiResponseTime, trackApiError } from '@/lib/utils/sentry-metrics';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Your API logic here
    const result = await processRequest();
    
    const duration = Date.now() - startTime;
    trackApiResponseTime('/api/endpoint', 'POST', 200, duration);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const duration = Date.now() - startTime;
    trackApiError('/api/endpoint', 'POST', 500, error.message);
    trackApiResponseTime('/api/endpoint', 'POST', 500, duration);
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### Example 2: Render Generation with Metrics

```typescript
import { 
  trackRenderStarted, 
  trackRenderCompleted, 
  trackRenderFailed,
  trackRenderCreditsCost 
} from '@/lib/utils/sentry-metrics';

async function generateRender(type: 'image' | 'video', style: string, quality: string) {
  const startTime = Date.now();
  
  // Track render started
  trackRenderStarted(type, style, quality);
  
  try {
    // Calculate credits cost
    const creditsCost = calculateCreditsCost(type, quality);
    trackRenderCreditsCost(type, quality, creditsCost);
    
    // Generate render
    const result = await aiService.generate({ type, style, quality });
    
    // Track completion
    const duration = Date.now() - startTime;
    trackRenderCompleted(type, style, quality, duration);
    
    return result;
  } catch (error) {
    // Track failure
    trackRenderFailed(type, style, quality, error.message);
    throw error;
  }
}
```

### Example 3: Track Function Execution Time

```typescript
import { trackExecutionTime } from '@/lib/utils/sentry-metrics';

// Automatically track execution time
const result = await trackExecutionTime(
  'database.query',
  async () => {
    return await db.query('SELECT * FROM renders');
  },
  { table: 'renders' }
);
```

## Viewing Metrics in Sentry

### In Sentry Dashboard

1. **Metrics Tab**
   - Go to **Metrics** in Sentry dashboard
   - View all tracked metrics
   - Filter by tags, time range, environment

2. **Metric Details**
   - Click on a metric to see detailed breakdown
   - View aggregations (sum, avg, min, max, p50, p75, p95, p99)
   - See distribution over time

3. **Connected Data**
   - Metrics are automatically linked to:
     - **Errors**: See metrics around error occurrences
     - **Logs**: View logs during metric spikes
     - **Spans**: See performance data for metric events

### Metric Queries

You can query metrics using Sentry's query language:

```
sum(render.completed) by (type, quality)
avg(api.response_time) by (route)
count(payment.verified) by (currency)
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
trackCount('render.completed', 1, { type: 'image' });

// Bad
trackCount('r', 1);
```

### 2. Use Tags for Filtering

```typescript
// Good - allows filtering by type, quality, style
trackRenderCompleted('image', 'Modern', 'high', 2500);

// Bad - no way to filter
trackCount('render_completed', 1);
```

### 3. Use Appropriate Units

```typescript
// Good - specify unit for clarity
trackDistribution('api.response_time', 150, {}, 'millisecond');
trackDistribution('file.size', 1024, {}, 'byte');

// Bad - unit unclear
trackDistribution('api.response_time', 150);
```

### 4. Track Business Metrics

Focus on metrics that matter for your business:
- User actions (logins, signups, purchases)
- Feature usage (renders, projects, chains)
- Revenue metrics (payments, credits)
- Performance metrics (response times, error rates)

### 5. Don't Over-Track

Avoid tracking too many metrics - focus on what's important:
- ✅ Track key user actions
- ✅ Track business-critical operations
- ✅ Track performance bottlenecks
- ❌ Don't track every function call
- ❌ Don't track internal implementation details

## Current Integration

### ✅ Integrated Routes

- **`/api/renders`** - Render generation metrics
  - `render.started` - When render generation begins
  - `render.completed` - When render succeeds
  - `render.failed` - When render fails
  - `render.credits_cost` - Credits cost per render
  - `api.response_time` - API response time
  - `api.error` - API errors

### 📋 To Be Integrated

- Payment routes (`/api/payments/*`)
- Billing routes (`/api/billing/*`)
- Gallery routes (`/api/gallery/*`)
- Project routes (`/api/projects/*`)

## Metric Naming Convention

We use dot notation for metric names:

```
{category}.{action}
{category}.{measurement}
```

Examples:
- `render.started` - Render category, started action
- `render.duration` - Render category, duration measurement
- `api.response_time` - API category, response_time measurement
- `payment.verified` - Payment category, verified action

## Tags Convention

Tags are used for filtering and grouping:

```typescript
{
  type: 'image' | 'video',
  style: 'Modern' | 'Classical' | ...,
  quality: 'standard' | 'high' | 'ultra',
  route: '/api/renders',
  method: 'POST' | 'GET',
  status_code: '200' | '500' | ...,
}
```

## Status

✅ **Metrics: CONFIGURED AND ENABLED**

- ✅ Metrics automatically enabled in Sentry.init()
- ✅ Utility functions created (`lib/utils/sentry-metrics.ts`)
- ✅ Render API route integrated
- ✅ Documentation complete

All metrics are now being sent to Sentry and can be viewed in the Metrics tab alongside errors, logs, and performance data.

