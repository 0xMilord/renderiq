/**
 * Standardized error codes for plugin API
 * Use these consistently across all plugin endpoints
 */

export enum PluginErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Input validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  INVALID_RENDER_ID = 'INVALID_RENDER_ID',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Business logic errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RENDER_FAILED = 'RENDER_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Webhook errors
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  INVALID_WEBHOOK_SIGNATURE = 'INVALID_WEBHOOK_SIGNATURE',

  // API Key errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
}

/**
 * Get human-readable error message for error code
 */
export function getErrorMessage(code: PluginErrorCode): string {
  const messages: Record<PluginErrorCode, string> = {
    [PluginErrorCode.AUTH_REQUIRED]: 'Authentication required',
    [PluginErrorCode.AUTH_FAILED]: 'Authentication failed',
    [PluginErrorCode.REFRESH_FAILED]: 'Failed to refresh token',
    [PluginErrorCode.TOKEN_EXPIRED]: 'Token has expired',
    [PluginErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
    [PluginErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [PluginErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
    [PluginErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
    [PluginErrorCode.INVALID_PROJECT_ID]: 'Invalid project ID',
    [PluginErrorCode.INVALID_RENDER_ID]: 'Invalid render ID',
    [PluginErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
    [PluginErrorCode.NOT_FOUND]: 'Resource not found',
    [PluginErrorCode.ALREADY_EXISTS]: 'Resource already exists',
    [PluginErrorCode.RESOURCE_CONFLICT]: 'Resource conflict',
    [PluginErrorCode.INSUFFICIENT_CREDITS]: 'Insufficient credits',
    [PluginErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [PluginErrorCode.RENDER_FAILED]: 'Render generation failed',
    [PluginErrorCode.QUOTA_EXCEEDED]: 'Quota exceeded',
    [PluginErrorCode.INTERNAL_ERROR]: 'Internal server error',
    [PluginErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
    [PluginErrorCode.TIMEOUT]: 'Request timeout',
    [PluginErrorCode.WEBHOOK_DELIVERY_FAILED]: 'Webhook delivery failed',
    [PluginErrorCode.INVALID_WEBHOOK_SIGNATURE]: 'Invalid webhook signature',
    [PluginErrorCode.INVALID_API_KEY]: 'Invalid API key',
    [PluginErrorCode.API_KEY_EXPIRED]: 'API key has expired',
    [PluginErrorCode.API_KEY_REVOKED]: 'API key has been revoked',
  };

  return messages[code] || 'Unknown error';
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: PluginErrorCode,
  details?: Record<string, any>
): { success: false; error: string; errorCode: PluginErrorCode; details?: Record<string, any> } {
  return {
    success: false,
    error: getErrorMessage(code),
    errorCode: code,
    ...(details && { details }),
  };
}

