/**
 * Production-safe logger utility
 * Only logs in development, silent in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors, even in production
    if (level === 'error') return true;
    // Only log other levels in development
    return isDevelopment;
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Always log errors
    console.error(...args);
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();

