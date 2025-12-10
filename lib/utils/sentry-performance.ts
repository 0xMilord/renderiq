/**
 * Sentry Performance Monitoring Utilities for Backend
 * 
 * Provides utilities for instrumenting backend operations with custom spans
 * for better performance visibility in Sentry.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Create a span for database operations
 */
export async function withDatabaseSpan<T>(
  operation: string,
  description: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'db.query',
      name: `${operation}: ${description}`,
      attributes: {
        'db.operation': operation,
      },
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' }); // Error status
        throw error;
      }
    }
  );
}

/**
 * Create a span for external API calls
 */
export async function withExternalApiSpan<T>(
  url: string,
  method: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `${method} ${url}`,
      attributes: {
        'http.method': method,
        'http.url': url,
      },
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

/**
 * Create a span for file operations
 */
export async function withFileOperationSpan<T>(
  operation: string,
  filePath: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'file.operation',
      name: `${operation}: ${filePath}`,
      attributes: {
        'file.operation': operation,
        'file.path': filePath,
      },
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

/**
 * Create a span for AI/ML operations
 */
export async function withAIOperationSpan<T>(
  operation: string,
  model: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'ai.operation',
      name: `${operation} (${model})`,
      attributes: {
        'ai.operation': operation,
        'ai.model': model,
      },
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

/**
 * Create a span for payment operations
 */
export async function withPaymentOperationSpan<T>(
  operation: string,
  provider: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'payment.operation',
      name: `${operation} (${provider})`,
      attributes: {
        'payment.operation': operation,
        'payment.provider': provider,
      },
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

/**
 * Create a custom span for any operation
 */
export async function withSpan<T>(
  op: string,
  description: string,
  data?: Record<string, any>,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op,
      name: description,
      attributes: data,
    },
    async (span) => {
      try {
        const result = await fn(span || undefined);
        span?.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

/**
 * Set transaction name for API routes
 * Call this at the start of API route handlers for better organization
 */
export function setTransactionName(name: string): void {
  try {
    // In Sentry Next.js, use getCurrentScope to set transaction name
    // The transaction is automatically created by Next.js integration
    const scope = Sentry.getCurrentScope();
    if (scope) {
      scope.setTransactionName(name);
    }
  } catch (error) {
    // Silently fail if Sentry is not available or method doesn't exist
    // This prevents breaking the API route if Sentry has issues
  }
}

/**
 * Add tags to current transaction
 */
export function addTransactionTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Add context to current transaction
 */
export function addTransactionContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

