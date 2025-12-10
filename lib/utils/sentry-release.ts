/**
 * Sentry Release Tracking Utility
 * 
 * Generates consistent release identifiers for Sentry Release Health tracking.
 * Release format: renderiq@{version}-{buildId}
 * 
 * Usage:
 * - Set NEXT_PUBLIC_SENTRY_RELEASE in your build process
 * - Or let this utility generate it from package.json version and build ID
 */

/**
 * Get the current release identifier for Sentry
 * Priority:
 * 1. NEXT_PUBLIC_SENTRY_RELEASE env var (explicit)
 * 2. Generated from package.json version + build ID
 * 3. Generated from package.json version + date
 */
export function getSentryRelease(): string | undefined {
  // Use explicit release if provided
  if (process.env.NEXT_PUBLIC_SENTRY_RELEASE) {
    return process.env.NEXT_PUBLIC_SENTRY_RELEASE;
  }

  // Only generate release in production
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  try {
    // Try to get version from package.json
    // In Next.js, we can't directly import package.json in client code
    // So we rely on environment variables set during build
    const version = process.env.npm_package_version || '0.1.0';
    
    // Use build ID if available (set in next.config.ts)
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 
                    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
                    new Date().toISOString().split('T')[0]; // Fallback to date
    
    return `renderiq@${version}-${buildId}`;
  } catch (error) {
    console.warn('Failed to generate Sentry release:', error);
    return undefined;
  }
}

/**
 * Get release metadata for Sentry
 * Can be used to attach additional context to releases
 */
export function getReleaseMetadata(): Record<string, string> {
  return {
    version: process.env.npm_package_version || '0.1.0',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 
             process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 
             'unknown',
    environment: process.env.NODE_ENV || 'development',
    ...(process.env.VERCEL && {
      vercel: 'true',
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown',
    }),
  };
}

