import type { Render } from '@/lib/types/render';

/**
 * Simplified chain helper utilities
 * Single source of truth: chain.renders array
 */

/**
 * Get all completed renders from a chain, sorted by chainPosition
 */
export function getCompletedRenders(renders: Render[] | null | undefined): Render[] {
  if (!renders || renders.length === 0) return [];
  
  return renders
    .filter(r => r.status === 'completed' && r.outputUrl)
    .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));
}

/**
 * Get the latest completed render (highest chainPosition)
 */
export function getLatestRender(renders: Render[] | null | undefined): Render | null {
  if (!renders || renders.length === 0) return null;
  
  // Find the render with the highest chainPosition that is completed
  const completed = renders.filter(r => r.status === 'completed' && r.outputUrl);
  if (completed.length === 0) return null;
  
  // Find the one with the highest chainPosition (not just last in sorted array)
  return completed.reduce((latest, current) => {
    const latestPos = latest.chainPosition ?? -1;
    const currentPos = current.chainPosition ?? -1;
    return currentPos > latestPos ? current : latest;
  });
}

/**
 * Get render by version number (index in completed renders array)
 * @param renders - Array of renders
 * @param versionNumber - Version number (1-based, e.g., 10 for version 10)
 * @returns The render at that version, or null if not found
 */
export function getRenderByVersion(renders: Render[] | null | undefined, versionNumber: number): Render | null {
  const completed = getCompletedRenders(renders);
  if (versionNumber < 1 || versionNumber > completed.length) return null;
  
  // Version number is 1-based index in completed renders array
  // Version 1 = first completed render (index 0)
  // Version 10 = 10th completed render (index 9)
  return completed[versionNumber - 1] || null;
}

/**
 * Get version number for a render (1-based index in completed renders array)
 * This is NOT chainPosition + 1, because failed renders are filtered out
 * @param render - The render to get version number for
 * @param renders - Array of all renders (to find index in completed renders)
 * @returns Version number (1-based) or null if not found
 */
export function getVersionNumber(render: Render | null | undefined, renders?: Render[] | null | undefined): number | null {
  if (!render) return null;
  
  // If renders array is provided, find the index in completed renders
  if (renders) {
    const completed = getCompletedRenders(renders);
    const index = completed.findIndex(r => r.id === render.id);
    if (index !== -1) {
      return index + 1; // 1-based version number
    }
  }
  
  // Fallback: if no renders array, we can't determine version number accurately
  // This should rarely happen, but return null to indicate we can't determine it
  return null;
}

/**
 * Get render by ID from chain.renders (always use this instead of message.render)
 */
export function getRenderById(renders: Render[] | null | undefined, renderId: string): Render | null {
  if (!renders) return null;
  return renders.find(r => r.id === renderId) || null;
}

