/**
 * Utility functions for app icons
 * Note: Uses "apps" terminology for client-facing paths
 */

/**
 * Get the path to an app's custom SVG icon
 * @param appId - The app ID (not slug, since icon files use IDs)
 * @returns The path to the app's icon SVG file
 */
export function getAppIconPath(appId: string): string {
  return `/apps/icons/${appId}.svg`;
}

/**
 * @deprecated Use getAppIconPath instead. Kept for backward compatibility.
 */
export function getToolIconPath(appId: string): string {
  return getAppIconPath(appId);
}

