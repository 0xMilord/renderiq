# Sentry Structured Logs Configuration

## ✅ Configuration Complete

Structured logging has been enabled for your Next.js application. All logs are now sent to Sentry and can be viewed, searched, and queried alongside errors.

## Configuration Summary

### Enabled in All Configs

- ✅ **Client-Side** (`sentry.client.config.ts`): `enableLogs: true`
- ✅ **Server-Side** (`sentry.server.config.ts`): `enableLogs: true`
- ✅ **Edge Runtime** (`sentry.edge.config.ts`): `enableLogs: true`

### Console Logging Integration

- ✅ **Client-Side**: `consoleLoggingIntegration()` configured
- ✅ **Server-Side**: `consoleLoggingIntegration()` configured
- ✅ **Levels**: `['log', 'warn', 'error']` - Captures console.log, console.warn, console.error

### Logger Utility Enhancement

- ✅ Enhanced `lib/utils/logger.ts` to use `Sentry.logger` APIs
- ✅ Structured logging for all log levels
- ✅ Automatic attribute extraction from log arguments

## What's Being Logged

### Automatic Console Capture

All `console.log()`, `console.warn()`, and `console.error()` calls are automatically sent to Sentry:

```typescript
// These are automatically captured
console.log('User logged in', { userId: 123 });
console.warn('Rate limit approaching', { endpoint: '/api/renders' });
console.error('Payment failed', { orderId: 'order_123' });
```

### Logger Utility

The `logger` utility now sends structured logs:

```typescript
import { logger } from '@/lib/utils/logger';

// Sends structured log to Sentry
logger.info('User action completed', { userId: 123, action: 'render' });
logger.warn('Potential issue', { endpoint: '/api/renders' });
logger.error('Operation failed', error, { context: 'payment' });
```

### Sentry.logger APIs

You can also use Sentry's logger APIs directly:

```typescript
import * as Sentry from '@sentry/nextjs';

// Structured logging with attributes
Sentry.logger.info('User logged in', { userId: 123, username: 'john' });
Sentry.logger.warn('Rate limit reached', { endpoint: '/api/renders', limit: 100 });
Sentry.logger.error('Payment processing failed', { orderId: 'order_123', amount: 99.99 });

// Using fmt for parameterized messages
Sentry.logger.info(
  Sentry.logger.fmt`User '${user.username}' added '${product.name}' to cart.`
);

// Using printf-like format (server-side only)
Sentry.logger.info("User %s logged in successfully", ["John Doe"], {
  userId: 123
});
```

## Log Levels

### Available Levels

1. **trace** - Very detailed debugging information
2. **debug** - Debugging information
3. **info** - Informational messages
4. **warn** - Warning messages
5. **error** - Error messages
6. **fatal** - Critical errors

### Current Configuration

- **Console Integration**: Captures `log`, `warn`, `error`
- **Logger Utility**: Sends `info`, `warn`, `error` to Sentry
- **Production**: All levels sent to Sentry
- **Development**: Only if `NEXT_PUBLIC_SENTRY_DEBUG=true`

## Viewing Logs in Sentry

### In Sentry Dashboard

1. **Logs Tab**
   - Go to **Logs** in Sentry dashboard
   - View all structured logs
   - Filter by level, environment, release

2. **Search Logs**
   - Search by text string
   - Filter by attributes
   - Query using log attributes

3. **Log Details**
   - View full log message
   - See all attributes
   - View associated errors/transactions

### Log Attributes

All logs automatically include:
- `environment` - Environment (development/production)
- `release` - Release version
- `sdk.name` - SDK name
- `sdk.version` - SDK version
- `user.id` - User ID (if available)
- `user.email` - User email (if available)
- `browser.name` - Browser name (client-side)
- `server.address` - Server address (server-side)

## Usage Examples

### Example 1: API Route Logging

```typescript
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  logger.info('API request received', { 
    route: '/api/renders',
    method: 'POST' 
  });
  
  try {
    // Your code
    logger.info('Render generation started', { renderId: render.id });
  } catch (error) {
    logger.error('Render generation failed', error, { renderId: render.id });
  }
}
```

### Example 2: Using Sentry.logger Directly

```typescript
import * as Sentry from '@sentry/nextjs';

// Simple log
Sentry.logger.info('Operation completed');

// Log with attributes
Sentry.logger.info('User action', {
  userId: user.id,
  action: 'render',
  renderId: render.id,
});

// Parameterized log
Sentry.logger.info(
  Sentry.logger.fmt`User '${user.username}' created render '${render.id}'`
);
```

### Example 3: Console Logging (Automatically Captured)

```typescript
// These are automatically sent to Sentry
console.log('Debug info', { data: 'value' });
console.warn('Warning message', { context: 'payment' });
console.error('Error occurred', error);
```

## Filtering Logs

### Using beforeSendLog

You can filter logs before they're sent:

```typescript
Sentry.init({
  enableLogs: true,
  beforeSendLog: (log) => {
    // Filter out info logs
    if (log.level === 'info') {
      return null;
    }
    
    // Modify log
    log.attributes.customField = 'value';
    
    return log;
  },
});
```

## Best Practices

### 1. Use Structured Attributes

```typescript
// Good - structured attributes
logger.info('Payment processed', {
  orderId: 'order_123',
  amount: 99.99,
  currency: 'USD',
  userId: user.id,
});

// Bad - unstructured string
logger.info('Payment processed: order_123, amount: 99.99');
```

### 2. Include Context

```typescript
logger.error('Database query failed', error, {
  query: 'SELECT * FROM users',
  userId: user.id,
  endpoint: '/api/users',
});
```

### 3. Use Appropriate Levels

- **info**: Normal operations, user actions
- **warn**: Potential issues, rate limits
- **error**: Errors that are handled
- **fatal**: Critical errors that crash the app

### 4. Avoid Sensitive Data

The logger automatically redacts sensitive data, but avoid logging:
- Passwords
- API keys
- Credit card numbers
- Personal information

## Integration with Errors

Logs are automatically linked to:
- **Errors**: Logs appear alongside related errors
- **Transactions**: Logs appear in performance transaction details
- **Releases**: Logs are tagged with release version

## Troubleshooting

### Logs Not Appearing

1. **Check enableLogs**: Verify `enableLogs: true` in config
2. **Check DSN**: Ensure DSN is set correctly
3. **Check Environment**: Verify logs are sent in production
4. **Check beforeSendLog**: Ensure filter isn't blocking logs

### Too Many Logs

1. **Adjust Console Integration**: Change `levels` array
2. **Use beforeSendLog**: Filter out unnecessary logs
3. **Reduce Logging**: Only log important events

## Status

✅ **Structured Logs: CONFIGURED AND ENABLED**

- ✅ `enableLogs: true` in all configs
- ✅ `consoleLoggingIntegration()` configured
- ✅ Logger utility enhanced with Sentry.logger
- ✅ Automatic console capture enabled
- ✅ Production ready

All logs are now being sent to Sentry and can be viewed in the Logs tab alongside errors and performance data.

