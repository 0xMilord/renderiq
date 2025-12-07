/**
 * Constants for UnifiedChatInterface component
 * Following React 19 and Next.js 16 best practices
 */

// Polling intervals (in milliseconds)
export const POLLING_INTERVAL = 5000; // 5 seconds
export const POLLING_INTERVAL_FAST = 3000; // 3 seconds for active processing

// Progress increments (percentage points)
export const PROGRESS_INCREMENT_SLOW = 2;
export const PROGRESS_INCREMENT_MEDIUM = 5;
export const PROGRESS_INCREMENT_FAST = 3;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAY_LOCAL_STORAGE = 1000; // 1 second for localStorage saves
export const DEBOUNCE_DELAY_SEARCH = 300; // 300ms for search inputs

// Retry configuration
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

// UI constants
export const CAROUSEL_SCROLL_AMOUNT = 300; // Pixels to scroll per click
export const MAX_MESSAGE_LENGTH = 5000; // Maximum characters in input
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Animation durations (in milliseconds)
export const ANIMATION_DURATION_FAST = 150;
export const ANIMATION_DURATION_NORMAL = 300;
export const ANIMATION_DURATION_SLOW = 500;

