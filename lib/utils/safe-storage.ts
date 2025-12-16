/**
 * Safe storage wrapper for Zustand persist middleware
 * Prevents SSR errors by checking for window before accessing localStorage
 */

export function getSafeStorage() {
  if (typeof window === 'undefined') {
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
}

