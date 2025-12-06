/**
 * Feature flags for tools/apps
 * Controls which tools are accessible based on environment
 */

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if a tool is accessible based on feature flags
 * In production: only "render-section-drawing" is accessible
 * In development: all tools are accessible
 */
export function isToolAccessible(toolId: string): boolean {
  // In development, all tools are accessible
  if (isDevelopment()) {
    return true;
  }

  // In production, only render-section-drawing is accessible
  return toolId === 'render-section-drawing';
}

/**
 * Get the effective status of a tool based on feature flags
 * This overrides the registry status in production
 */
export function getEffectiveToolStatus(
  toolId: string,
  registryStatus: 'online' | 'offline'
): 'online' | 'offline' {
  // In development, respect the registry status
  if (isDevelopment()) {
    return registryStatus;
  }

  // In production, only render-section-drawing can be online
  if (toolId === 'render-section-drawing') {
    return 'online';
  }

  // All other tools are offline in production
  return 'offline';
}

