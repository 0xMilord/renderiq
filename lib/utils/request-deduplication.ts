/**
 * Request Deduplication Utility
 * Prevents duplicate API calls when multiple components request the same data simultaneously
 */

type PendingRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

// Global cache for pending requests
const pendingRequests = new Map<string, PendingRequest<any>>();

// Cache for completed requests (short-lived, 5 seconds)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Deduplicates requests by key
 * If a request with the same key is already pending, returns the existing promise
 * Otherwise, creates a new request and caches it
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  useCache = true
): Promise<T> {
  // Check cache first (if enabled)
  if (useCache) {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data);
    }
  }

  // Check if request is already pending
  const pending = pendingRequests.get(key);
  if (pending) {
    // Request is already in flight, return existing promise
    return pending.promise;
  }

  // Create new request
  const promise = requestFn()
    .then((data) => {
      // Cache the result
      if (useCache) {
        requestCache.set(key, { data, timestamp: Date.now() });
      }
      // Remove from pending requests
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      // Remove from pending requests on error
      pendingRequests.delete(key);
      throw error;
    });

  // Store pending request
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clears the request cache
 */
export function clearRequestCache(): void {
  requestCache.clear();
  pendingRequests.clear();
}

/**
 * Clears expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of requestCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      requestCache.delete(key);
    }
  }

  // Clear stale pending requests (older than 30 seconds)
  for (const [key, pending] of pendingRequests.entries()) {
    if (now - pending.timestamp >= 30000) {
      pendingRequests.delete(key);
    }
  }
}

// Clean up expired cache entries every 10 seconds
if (typeof window !== 'undefined') {
  setInterval(clearExpiredCache, 10000);
}

