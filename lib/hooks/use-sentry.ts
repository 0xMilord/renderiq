'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

/**
 * Hook to set Sentry user context
 */
export function useSentryUser(user: { id: string; email?: string; username?: string } | null) {
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
      logger.setUser(user);
    } else {
      Sentry.setUser(null);
      logger.setUser(null);
    }
  }, [user]);
}

/**
 * Hook to add Sentry context for a specific feature/component
 */
export function useSentryContext(name: string, context: Record<string, any>) {
  useEffect(() => {
    Sentry.setContext(name, context);
    logger.setContext(name, context);
  }, [name, context]);
}

/**
 * Utility function to capture errors with context in client components
 */
export function captureErrorWithContext(
  error: Error | unknown,
  context: {
    component?: string;
    feature?: string;
    [key: string]: any;
  }
) {
  const errorToCapture = error instanceof Error ? error : new Error(String(error));
  
  Sentry.captureException(errorToCapture, {
    tags: {
      component: context.component || 'unknown',
      feature: context.feature || 'unknown',
    },
    extra: context,
  });
  
  logger.error(`Error in ${context.component || 'component'}:`, error);
}

