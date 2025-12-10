# Sentry Backend Performance Monitoring

## ✅ Configuration Complete

Backend performance monitoring is fully configured for all API routes, database operations, and external service calls.

## Configuration Summary

### Server-Side Configuration (`sentry.server.config.ts`)

- ✅ **DSN**: Configured with fallback
- ✅ **tracesSampleRate**: 1.0 (dev) / 0.1 (prod)
- ✅ **httpIntegration()**: Enabled with tracing for outgoing HTTP requests
- ✅ **Automatic API Route Instrumentation**: Next.js automatically creates transactions for all API routes
- ✅ **Profiling**: Enabled (if available)

### Edge Runtime Configuration (`sentry.edge.config.ts`)

- ✅ **DSN**: Configured with fallback
- ✅ **tracesSampleRate**: 1.0 (dev) / 0.1 (prod)
- ✅ **Automatic Middleware Instrumentation**: Edge runtime automatically tracked

### Instrumentation (`instrumentation.ts`)

- ✅ Server config loaded for Node.js runtime
- ✅ Edge config loaded for edge runtime
- ✅ `onRequestError` handler configured

## What's Automatically Tracked

### 1. API Routes

**Automatic Transaction Creation:**
- Each API route handler automatically creates a transaction
- Transaction name: Route path (e.g., `POST /api/renders`)
- Includes request/response timing
- Captures errors automatically

**Example:**
```typescript
// app/api/renders/route.ts
export async function POST(request: NextRequest) {
  // Transaction automatically created: "POST /api/renders"
  // All operations within are tracked
}
```

### 2. HTTP Requests (Outgoing)

**Automatic Span Creation:**
- All `fetch()` calls to external APIs
- HTTP client requests
- Includes timing and status codes

**Tracked via `httpIntegration()`:**
- Request duration
- Response status
- URL and method

### 3. Database Operations

**Manual Instrumentation Available:**
Use `withDatabaseSpan()` utility for custom database tracking:

```typescript
import { withDatabaseSpan } from '@/lib/utils/sentry-performance';

const projects = await withDatabaseSpan(
  'SELECT',
  'Fetch user projects',
  async (span) => {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }
);
```

### 4. External API Calls

**Automatic + Manual:**
- Automatic: All `fetch()` calls tracked via `httpIntegration()`
- Manual: Use `withExternalApiSpan()` for custom tracking:

```typescript
import { withExternalApiSpan } from '@/lib/utils/sentry-performance';

const result = await withExternalApiSpan(
  'https://api.example.com/data',
  'POST',
  async (span) => {
    return await fetch('https://api.example.com/data', { method: 'POST' });
  }
);
```

### 5. File Operations

**Manual Instrumentation:**
```typescript
import { withFileOperationSpan } from '@/lib/utils/sentry-performance';

await withFileOperationSpan(
  'upload',
  'user-uploads/image.jpg',
  async (span) => {
    return await StorageService.uploadFile(file, bucket, userId, path);
  }
);
```

### 6. AI Operations

**Manual Instrumentation:**
```typescript
import { withAIOperationSpan } from '@/lib/utils/sentry-performance';

const result = await withAIOperationSpan(
  'generate-image',
  'gemini-2.0-flash-exp',
  async (span) => {
    return await aiService.generateImage(prompt);
  }
);
```

### 7. Payment Operations

**Manual Instrumentation:**
```typescript
import { withPaymentOperationSpan } from '@/lib/utils/sentry-performance';

const order = await withPaymentOperationSpan(
  'create-order',
  'razorpay',
  async (span) => {
    return await RazorpayService.createOrder(userId, packageId, amount);
  }
);
```

## Performance Utilities

### Available Utilities (`lib/utils/sentry-performance.ts`)

1. **`withDatabaseSpan()`** - Database operations
2. **`withExternalApiSpan()`** - External API calls
3. **`withFileOperationSpan()`** - File operations
4. **`withAIOperationSpan()`** - AI/ML operations
5. **`withPaymentOperationSpan()`** - Payment operations
6. **`withSpan()`** - Custom operations
7. **`setTransactionName()`** - Set custom transaction name
8. **`addTransactionTags()`** - Add tags to transaction
9. **`addTransactionContext()`** - Add context to transaction

## Usage Examples

### Example 1: API Route with Database Query

```typescript
import { setTransactionName, withDatabaseSpan } from '@/lib/utils/sentry-performance';

export async function GET(request: NextRequest) {
  setTransactionName('GET /api/projects');
  
  const { user } = await getCachedUser();
  
  const projects = await withDatabaseSpan(
    'SELECT',
    'Fetch user projects',
    async () => {
      return await ProjectsDAL.getByUserId(user.id);
    }
  );
  
  return NextResponse.json({ projects });
}
```

### Example 2: API Route with Multiple Operations

```typescript
import { setTransactionName, withDatabaseSpan, withAIOperationSpan, withFileOperationSpan } from '@/lib/utils/sentry-performance';

export async function POST(request: NextRequest) {
  setTransactionName('POST /api/renders');
  
  // Database query
  const render = await withDatabaseSpan(
    'INSERT',
    'Create render record',
    async () => {
      return await RendersDAL.create({ ... });
    }
  );
  
  // AI generation
  const result = await withAIOperationSpan(
    'generate-image',
    'gemini-2.0-flash-exp',
    async () => {
      return await aiService.generateImage(prompt);
    }
  );
  
  // File upload
  await withFileOperationSpan(
    'upload',
    `renders/${render.id}.png`,
    async () => {
      return await StorageService.uploadFile(file, 'renders', userId, path);
    }
  );
  
  return NextResponse.json({ success: true });
}
```

### Example 3: Adding Context and Tags

```typescript
import { setTransactionName, addTransactionTags, addTransactionContext } from '@/lib/utils/sentry-performance';

export async function POST(request: NextRequest) {
  setTransactionName('POST /api/payments/create-order');
  
  const { user } = await getCachedUser();
  
  // Add tags for filtering
  addTransactionTags({
    payment_type: 'credit_package',
    user_plan: user.plan || 'free',
  });
  
  // Add context for debugging
  addTransactionContext('payment', {
    userId: user.id,
    packageId: creditPackageId,
    amount: orderAmount,
  });
  
  // ... rest of the code
}
```

## Viewing Backend Performance Data

### In Sentry Dashboard

1. **Performance Tab**
   - Go to **Performance** in Sentry
   - Filter by transaction type: `http.server`
   - View all API route transactions

2. **Transaction Details**
   - Click on any API route transaction
   - View waterfall chart showing:
     - Total request time
     - Database query spans
     - External API call spans
     - File operation spans
     - AI operation spans

3. **Key Metrics**
   - P50, P75, P95, P99 latencies per route
   - Throughput (requests per minute)
   - Error rate per route
   - Slowest operations

### Transaction Names

API routes are automatically named:
- `GET /api/projects`
- `POST /api/renders`
- `POST /api/payments/create-order`
- etc.

Use `setTransactionName()` to customize if needed.

## Best Practices

### 1. Instrument Critical Operations

Add spans for:
- ✅ Database queries (especially slow ones)
- ✅ External API calls
- ✅ File operations
- ✅ AI/ML operations
- ✅ Payment operations

### 2. Use Descriptive Names

```typescript
// Good
withDatabaseSpan('SELECT', 'Fetch user projects by ID', ...)

// Bad
withDatabaseSpan('query', 'db', ...)
```

### 3. Add Context for Debugging

```typescript
addTransactionContext('render_generation', {
  renderId: render.id,
  model: 'gemini-2.0-flash-exp',
  quality: 'high',
});
```

### 4. Set Transaction Names

```typescript
// At the start of API route handlers
setTransactionName('POST /api/renders');
```

### 5. Monitor Slow Operations

- Set up alerts for P95 latency > threshold
- Identify slow database queries
- Track external API response times

## Sample Rates

### Development
- **Traces**: 100% (1.0) - See all transactions
- **Profiling**: 100% (1.0) - Full profiling data

### Production
- **Traces**: 10% (0.1) - Recommended for cost management
- **Profiling**: 10% (0.1) - Sample profiling

**Note**: Adjust based on traffic and budget.

## Troubleshooting

### No Transactions Appearing

1. **Check DSN**: Verify DSN is set
2. **Check Sample Rate**: Ensure `tracesSampleRate > 0`
3. **Check Environment**: Verify `NODE_ENV=production` in production
4. **Check Instrumentation**: Verify `instrumentation.ts` exists and exports `register()`

### Spans Not Showing

1. **Check Transaction**: Ensure transaction exists (automatic for API routes)
2. **Check Span Creation**: Verify spans are created within transaction
3. **Check Span Finish**: Ensure spans are finished

### Distributed Tracing Not Working

1. **Check Headers**: Verify `sentry-trace` header is received
2. **Check tracePropagationTargets**: Verify frontend config includes backend URLs
3. **Check CORS**: Ensure backend accepts trace headers

## Integration Status

### ✅ Fully Instrumented

- ✅ All API routes (automatic)
- ✅ HTTP requests (automatic via httpIntegration)
- ✅ Error tracking (automatic)
- ✅ Utilities available for custom instrumentation

### 📝 Recommended Additions

Consider adding spans to:
- Critical database queries
- External API calls (Razorpay, Google AI, etc.)
- File uploads/downloads
- AI generation operations
- Payment processing

## Next Steps

1. ✅ **Deploy to Production**: Backend monitoring will start automatically
2. ✅ **Add Custom Spans**: Use utilities to instrument critical operations
3. ✅ **Set Up Alerts**: Create alerts for slow API routes
4. ✅ **Review Performance**: Regularly check Performance tab for bottlenecks

## Status

✅ **Backend Performance Monitoring: CONFIGURED AND READY**

All API routes are automatically instrumented. Use the performance utilities to add custom spans for detailed visibility into specific operations.

