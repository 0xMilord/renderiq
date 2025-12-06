/**
 * Security Utilities
 * Comprehensive security functions for input validation, sanitization, and response redaction
 */

import { logger } from './logger';

/**
 * Allowed domains for CORS and origin validation
 * Add your production domains here
 */
export const ALLOWED_DOMAINS = [
  'renderiq.io',
  'www.renderiq.io',
  'localhost',
  '127.0.0.1',
  'vercel.app',
  // Add staging domains if needed
];

/**
 * Check if origin is allowed
 * Optimized: Only validates if origin is provided, doesn't block requests without origin
 * This improves performance by not blocking same-origin requests
 */
export function isAllowedOrigin(origin: string | null): boolean {
  // If no origin header, allow (same-origin request or direct API call)
  // This improves performance by not blocking legitimate requests
  if (!origin) return true;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
    }
    
    // Check against allowed domains
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    // If origin parsing fails, allow (better UX than blocking)
    return true;
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * Sanitize HTML content (for dangerouslySetInnerHTML)
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Redact sensitive information from objects
 */
export function redactSensitive(data: any, fields: string[] = ['password', 'token', 'secret', 'key', 'apiKey']): any {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitive(item, fields));
  }
  
  const redacted = { ...data };
  
  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    // Check if field should be redacted
    if (fields.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
      continue;
    }
    
    // Redact IDs (show only first 8 chars)
    if (lowerKey.includes('id') && typeof redacted[key] === 'string' && redacted[key].length > 8) {
      redacted[key] = redacted[key].substring(0, 8) + '...';
      continue;
    }
    
    // Recursively redact nested objects
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key], fields);
    }
  }
  
  return redacted;
}

/**
 * Validate and sanitize prompt input
 */
export function validatePrompt(prompt: string | null | undefined): { valid: boolean; sanitized?: string; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt is required' };
  }
  
  if (prompt.length > 5000) {
    return { valid: false, error: 'Prompt exceeds maximum length' };
  }
  
  // Check for potential XSS
  if (/<script|javascript:|on\w+\s*=/i.test(prompt)) {
    logger.warn('⚠️ Potential XSS detected in prompt');
    return { valid: false, error: 'Invalid characters in prompt' };
  }
  
  return { valid: true, sanitized: sanitizeInput(prompt) };
}

/**
 * Validate file type
 */
export function isValidImageType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Get sanitized error message for client
 * Never expose internal errors or infrastructure details
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Never expose these details
    if (
      message.includes('database') ||
      message.includes('supabase') ||
      message.includes('postgres') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('internal') ||
      message.includes('stack') ||
      message.includes('trace')
    ) {
      return 'An error occurred. Please try again later.';
    }
    
    // Return sanitized error message
    return sanitizeInput(error.message).slice(0, 200);
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Security logging - logs to Vercel with redacted sensitive info
 */
export function securityLog(event: string, data?: any, level: 'info' | 'warn' | 'error' = 'info'): void {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    data: data ? redactSensitive(data) : undefined,
  };
  
  // Log to Vercel (always logs, even in production)
  if (level === 'error') {
    logger.error('🔒 Security Event:', logData);
  } else if (level === 'warn') {
    logger.warn('🔒 Security Event:', logData);
  } else {
    logger.log('🔒 Security Event:', logData);
  }
}




