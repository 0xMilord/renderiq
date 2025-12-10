/**
 * Sentry Metrics Utilities
 * 
 * Provides utilities for tracking application metrics in Sentry.
 * Metrics are automatically enabled in Sentry.init() configuration.
 * 
 * Usage:
 * - count: Track occurrences (e.g., user actions, API calls)
 * - distribution: Track measurements (e.g., response times, file sizes)
 * - set: Track unique values (e.g., unique users, unique sessions)
 * - gauge: Track current value (e.g., active connections, queue size)
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Track a count metric (increment by value)
 * Use for: user actions, API calls, events
 */
export function trackCount(
  name: string,
  value: number = 1,
  tags?: Record<string, string>,
  unit?: 'none' | 'nanosecond' | 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte' | 'petabyte'
) {
  try {
    Sentry.metrics.count(name, value, {
      tags,
      unit,
    });
  } catch (error) {
    // Fail silently - don't break the app if metrics fail
    console.error('Failed to track count metric:', error);
  }
}

/**
 * Track a distribution metric (measurement)
 * Use for: response times, file sizes, durations
 */
export function trackDistribution(
  name: string,
  value: number,
  tags?: Record<string, string>,
  unit?: 'none' | 'nanosecond' | 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte' | 'petabyte'
) {
  try {
    Sentry.metrics.distribution(name, value, {
      tags,
      unit,
    });
  } catch (error) {
    // Fail silently - don't break the app if metrics fail
    console.error('Failed to track distribution metric:', error);
  }
}

/**
 * Track a set metric (unique values)
 * Use for: unique users, unique sessions, unique IPs
 */
export function trackSet(
  name: string,
  value: string | number,
  tags?: Record<string, string>
) {
  try {
    Sentry.metrics.set(name, value, {
      tags,
    });
  } catch (error) {
    // Fail silently - don't break the app if metrics fail
    console.error('Failed to track set metric:', error);
  }
}

/**
 * Track a gauge metric (current value)
 * Use for: active connections, queue size, cache size
 */
export function trackGauge(
  name: string,
  value: number,
  tags?: Record<string, string>,
  unit?: 'none' | 'nanosecond' | 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte' | 'petabyte'
) {
  try {
    Sentry.metrics.gauge(name, value, {
      tags,
      unit,
    });
  } catch (error) {
    // Fail silently - don't break the app if metrics fail
    console.error('Failed to track gauge metric:', error);
  }
}

// ============================================================================
// Business Metrics - Render Generation
// ============================================================================

/**
 * Track render generation started
 */
export function trackRenderStarted(type: 'image' | 'video', style: string, quality: string) {
  trackCount('render.started', 1, {
    type,
    style,
    quality,
  });
}

/**
 * Track render generation completed
 */
export function trackRenderCompleted(type: 'image' | 'video', style: string, quality: string, duration: number) {
  trackCount('render.completed', 1, {
    type,
    style,
    quality,
  });
  trackDistribution('render.duration', duration, {
    type,
    style,
    quality,
  }, 'millisecond');
}

/**
 * Track render generation failed
 */
export function trackRenderFailed(type: 'image' | 'video', style: string, quality: string, error: string) {
  trackCount('render.failed', 1, {
    type,
    style,
    quality,
    error: error.substring(0, 50), // Truncate long error messages
  });
}

/**
 * Track render credits cost
 */
export function trackRenderCreditsCost(type: 'image' | 'video', quality: string, credits: number) {
  trackDistribution('render.credits_cost', credits, {
    type,
    quality,
  });
}

// ============================================================================
// Business Metrics - Payments
// ============================================================================

/**
 * Track payment order created
 */
export function trackPaymentOrderCreated(amount: number, currency: string, packageId: string) {
  trackCount('payment.order_created', 1, {
    currency,
    package_id: packageId,
  });
  trackDistribution('payment.amount', amount, {
    currency,
    package_id: packageId,
  });
}

/**
 * Track payment verified
 */
export function trackPaymentVerified(amount: number, currency: string, packageId: string) {
  trackCount('payment.verified', 1, {
    currency,
    package_id: packageId,
  });
  trackDistribution('payment.amount', amount, {
    currency,
    package_id: packageId,
  });
}

/**
 * Track payment failed
 */
export function trackPaymentFailed(amount: number, currency: string, reason: string) {
  trackCount('payment.failed', 1, {
    currency,
    reason: reason.substring(0, 50),
  });
}

// ============================================================================
// Business Metrics - User Actions
// ============================================================================

/**
 * Track user login
 */
export function trackUserLogin(method: string = 'email') {
  trackCount('user.login', 1, {
    method,
  });
}

/**
 * Track user signup
 */
export function trackUserSignup(method: string = 'email') {
  trackCount('user.signup', 1, {
    method,
  });
}

/**
 * Track project created
 */
export function trackProjectCreated(platform: 'render' | 'tools' | 'canvas') {
  trackCount('project.created', 1, {
    platform,
  });
}

/**
 * Track chain created
 */
export function trackChainCreated(projectId: string) {
  trackCount('chain.created', 1, {
    project_id: projectId,
  });
}

// ============================================================================
// Performance Metrics - API Routes
// ============================================================================

/**
 * Track API route response time
 */
export function trackApiResponseTime(route: string, method: string, statusCode: number, duration: number) {
  trackDistribution('api.response_time', duration, {
    route,
    method,
    status_code: statusCode.toString(),
  }, 'millisecond');
  
  trackCount('api.request', 1, {
    route,
    method,
    status_code: statusCode.toString(),
  });
}

/**
 * Track API error
 */
export function trackApiError(route: string, method: string, statusCode: number, error: string) {
  trackCount('api.error', 1, {
    route,
    method,
    status_code: statusCode.toString(),
    error: error.substring(0, 50),
  });
}

// ============================================================================
// Performance Metrics - Database
// ============================================================================

/**
 * Track database query time
 */
export function trackDatabaseQuery(operation: string, table: string, duration: number) {
  trackDistribution('db.query_time', duration, {
    operation,
    table,
  }, 'millisecond');
}

/**
 * Track database query count
 */
export function trackDatabaseQueryCount(operation: string, table: string) {
  trackCount('db.query', 1, {
    operation,
    table,
  });
}

// ============================================================================
// Performance Metrics - External APIs
// ============================================================================

/**
 * Track external API call
 */
export function trackExternalApiCall(service: string, endpoint: string, duration: number, statusCode: number) {
  trackDistribution('external_api.duration', duration, {
    service,
    endpoint,
    status_code: statusCode.toString(),
  }, 'millisecond');
  
  trackCount('external_api.call', 1, {
    service,
    endpoint,
    status_code: statusCode.toString(),
  });
}

/**
 * Track external API error
 */
export function trackExternalApiError(service: string, endpoint: string, error: string) {
  trackCount('external_api.error', 1, {
    service,
    endpoint,
    error: error.substring(0, 50),
  });
}

// ============================================================================
// Performance Metrics - File Operations
// ============================================================================

/**
 * Track file upload
 */
export function trackFileUpload(size: number, type: string, storage: 'gcs' | 'local') {
  trackDistribution('file.upload_size', size, {
    type,
    storage,
  }, 'byte');
  
  trackCount('file.upload', 1, {
    type,
    storage,
  });
}

/**
 * Track file download
 */
export function trackFileDownload(size: number, type: string) {
  trackDistribution('file.download_size', size, {
    type,
  }, 'byte');
  
  trackCount('file.download', 1, {
    type,
  });
}

// ============================================================================
// Performance Metrics - AI Operations
// ============================================================================

/**
 * Track AI generation time
 */
export function trackAIGenerationTime(model: string, operation: string, duration: number) {
  trackDistribution('ai.generation_time', duration, {
    model,
    operation,
  }, 'millisecond');
}

/**
 * Track AI generation cost (tokens, credits, etc.)
 */
export function trackAIGenerationCost(model: string, operation: string, cost: number) {
  trackDistribution('ai.generation_cost', cost, {
    model,
    operation,
  });
}

// ============================================================================
// Business Metrics - Credits
// ============================================================================

/**
 * Track credits earned
 */
export function trackCreditsEarned(amount: number, reason: string) {
  trackDistribution('credits.earned', amount, {
    reason,
  });
  trackCount('credits.earned_count', 1, {
    reason,
  });
}

/**
 * Track credits spent
 */
export function trackCreditsSpent(amount: number, reason: string) {
  trackDistribution('credits.spent', amount, {
    reason,
  });
  trackCount('credits.spent_count', 1, {
    reason,
  });
}

/**
 * Track credits balance
 */
export function trackCreditsBalance(balance: number, userId: string) {
  trackGauge('credits.balance', balance, {
    user_id: userId,
  });
}

// ============================================================================
// Business Metrics - Gallery
// ============================================================================

/**
 * Track gallery item liked
 */
export function trackGalleryLiked(itemId: string, itemType: string) {
  trackCount('gallery.liked', 1, {
    item_type: itemType,
  });
}

/**
 * Track gallery item viewed
 */
export function trackGalleryViewed(itemId: string, itemType: string) {
  trackCount('gallery.viewed', 1, {
    item_type: itemType,
  });
}

// ============================================================================
// Utility: Track function execution time
// ============================================================================

/**
 * Track execution time of an async function
 */
export async function trackExecutionTime<T>(
  metricName: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    trackDistribution(metricName, duration, tags, 'millisecond');
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackDistribution(metricName, duration, { ...tags, error: 'true' }, 'millisecond');
    throw error;
  }
}

