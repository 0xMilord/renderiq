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
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op: 'db.query',
    description: `${operation}: ${description}`,
    data: {
      'db.operation': operation,
    },
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' }); // OK status
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' }); // Error status
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Create a span for external API calls
 */
export async function withExternalApiSpan<T>(
  url: string,
  method: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op: 'http.client',
    description: `${method} ${url}`,
    data: {
      'http.method': method,
      'http.url': url,
    },
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' });
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Create a span for file operations
 */
export async function withFileOperationSpan<T>(
  operation: string,
  filePath: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op: 'file.operation',
    description: `${operation}: ${filePath}`,
    data: {
      'file.operation': operation,
      'file.path': filePath,
    },
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' });
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Create a span for AI/ML operations
 */
export async function withAIOperationSpan<T>(
  operation: string,
  model: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op: 'ai.operation',
    description: `${operation} (${model})`,
    data: {
      'ai.operation': operation,
      'ai.model': model,
    },
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' });
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Create a span for payment operations
 */
export async function withPaymentOperationSpan<T>(
  operation: string,
  provider: string,
  fn: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op: 'payment.operation',
    description: `${operation} (${provider})`,
    data: {
      'payment.operation': operation,
      'payment.provider': provider,
    },
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' });
    throw error;
  } finally {
    span?.finish();
  }
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
  const transaction = Sentry.getCurrentScope().getTransaction();
  const span = transaction?.startChild({
    op,
    description,
    data,
  });

  try {
    const result = await fn(span);
    span?.setStatus({ code: 1, message: 'ok' });
    return result;
  } catch (error) {
    span?.setStatus({ code: 2, message: 'error' });
    throw error;
  } finally {
    span?.finish();
  }
}

/**
 * Set transaction name for API routes
 * Call this at the start of API route handlers for better organization
 */
export function setTransactionName(name: string): void {
  const transaction = Sentry.getCurrentScope().getTransaction();
  if (transaction) {
    transaction.setName(name);
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

