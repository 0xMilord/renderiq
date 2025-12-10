/**
 * Production-safe logger utility with Sentry integration
 * Logs to console in development, sends to Sentry in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Lazy load Sentry to avoid issues in edge runtime
let Sentry: typeof import('@sentry/nextjs') | null = null;

async function getSentry() {
  if (Sentry) return Sentry;
  
  try {
    // Only load Sentry in environments where it's available
    if (typeof window !== 'undefined') {
      // Client-side
      Sentry = await import('@sentry/nextjs');
    } else {
      // Server-side
      Sentry = await import('@sentry/nextjs');
    }
  } catch (error) {
    // Sentry not available, continue without it
    console.warn('Sentry not available:', error);
  }
  
  return Sentry;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors, even in production
    if (level === 'error') return true;
    // Only log other levels in development
    return isDevelopment;
  }

  private async captureToSentry(
    level: 'error' | 'warning' | 'info',
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ) {
    // Only send to Sentry in production or if explicitly enabled
    if (isDevelopment && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return;
    }

    try {
      const sentry = await getSentry();
      if (!sentry) return;

      // Redact sensitive data from context
      const safeContext = this.redactSensitiveData(context || {});

      if (error instanceof Error) {
        sentry.captureException(error, {
          level,
          tags: {
            logger: true,
            ...(safeContext.tags || {}),
          },
          extra: {
            message,
            ...safeContext,
          },
        });
      } else if (level === 'error') {
        sentry.captureMessage(message, {
          level: 'error',
          tags: {
            logger: true,
            ...(safeContext.tags || {}),
          },
          extra: safeContext,
        });
      } else if (level === 'warning') {
        sentry.captureMessage(message, {
          level: 'warning',
          tags: {
            logger: true,
            ...(safeContext.tags || {}),
          },
          extra: safeContext,
        });
      }
    } catch (sentryError) {
      // Fail silently - don't break the app if Sentry fails
      console.error('Failed to send to Sentry:', sentryError);
    }
  }

  /**
   * Send structured log to Sentry using Sentry.logger APIs
   */
  private async sendStructuredLog(level: 'info' | 'warn' | 'error', args: any[]): Promise<void> {
    // Only send in production or if explicitly enabled
    if (isDevelopment && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return;
    }

    try {
      const sentry = await getSentry();
      if (!sentry || !sentry.logger) return;

      // Extract message and attributes
      const message = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        return typeof arg === 'string' ? arg : JSON.stringify(arg);
      }).join(' ');

      // Extract attributes from additional args
      const attributes: Record<string, any> = {};
      args.forEach((arg, index) => {
        if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
          Object.assign(attributes, this.redactSensitiveData(arg));
        } else if (index > 0) {
          attributes[`arg${index}`] = typeof arg === 'string' ? arg : JSON.stringify(arg);
        }
      });

      // Send structured log
      switch (level) {
        case 'error':
          sentry.logger.error(message, attributes);
          break;
        case 'warn':
          sentry.logger.warn(message, attributes);
          break;
        case 'info':
          sentry.logger.info(message, attributes);
          break;
      }
    } catch (error) {
      // Fail silently - don't break the app if Sentry fails
    }
  }

  private redactSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'creditCard',
      'cvv',
      'ssn',
      'razorpay_signature',
      'razorpay_payment_id',
    ];

    const redacted = { ...data };
    
    for (const key in redacted) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }

    return redacted;
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
    
    // Send to Sentry via structured logging in production
    if (!isDevelopment) {
      this.sendStructuredLog('info', args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
    
    // Send to Sentry via structured logging in production
    if (!isDevelopment) {
      this.sendStructuredLog('info', args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
    
    // Send warnings to Sentry via structured logging (if enabled)
    this.sendStructuredLog('warn', args);
    
    // Also send as warning message in production
    if (!isDevelopment) {
      const message = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      this.captureToSentry('warning', message, undefined, { args: args.length > 1 ? args.slice(1) : undefined });
    }
  }

  error(...args: any[]): void {
    // Always log errors
    console.error(...args);
    
    // Send errors to Sentry via structured logging (if enabled)
    this.sendStructuredLog('error', args);
    
    // Also send as exception for error tracking
    const error = args.find(arg => arg instanceof Error);
    const message = args.map(arg => {
      if (arg instanceof Error) return arg.message;
      return typeof arg === 'string' ? arg : JSON.stringify(arg);
    }).join(' ');
    
    const context = args.length > 1 ? { 
      additionalArgs: args.filter(arg => !(arg instanceof Error))
    } : undefined;
    
    this.captureToSentry('error', message, error || new Error(message), context);
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...args);
    }
  }

  /**
   * Set user context for Sentry
   */
  async setUser(user: { id: string; email?: string; username?: string } | null) {
    try {
      const sentry = await getSentry();
      if (sentry) {
        sentry.setUser(user);
      }
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Add breadcrumb to Sentry
   */
  async addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error', data?: Record<string, any>) {
    try {
      const sentry = await getSentry();
      if (sentry) {
        sentry.addBreadcrumb({
          message,
          category: category || 'default',
          level: level || 'info',
          data: this.redactSensitiveData(data || {}),
        });
      }
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Set context for Sentry
   */
  async setContext(name: string, context: Record<string, any>) {
    try {
      const sentry = await getSentry();
      if (sentry) {
        sentry.setContext(name, this.redactSensitiveData(context));
      }
    } catch (error) {
      // Fail silently
    }
  }
}

export const logger = new Logger();

