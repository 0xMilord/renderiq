/**
 * String utility functions
 */

/**
 * Convert text to sentence case (first letter uppercase, rest lowercase)
 * @param text - The text to convert
 * @returns The text in sentence case
 */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  // Convert to sentence case: first letter uppercase, rest lowercase
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

