/**
 * Utility functions for tool icons
 */

/**
 * Get the path to a tool's custom SVG icon
 * @param slug - The tool slug
 * @returns The path to the tool's icon SVG file
 */
export function getToolIconPath(slug: string): string {
  return `/apps/icons/${slug}.svg`;
}

