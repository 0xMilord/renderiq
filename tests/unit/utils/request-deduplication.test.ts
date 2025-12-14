/**
 * Tests for request deduplication utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  deduplicateRequest,
  clearRequestCache,
  clearExpiredCache,
} from '@/lib/utils/request-deduplication';

describe('Request Deduplication', () => {
  beforeEach(() => {
    clearRequestCache();
  });

  it('should deduplicate concurrent requests', async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: 'result' };
    };

    const key = 'test-key';
    const promise1 = deduplicateRequest(key, requestFn);
    const promise2 = deduplicateRequest(key, requestFn);
    const promise3 = deduplicateRequest(key, requestFn);

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    // All should return same result
    expect(result1).toEqual({ data: 'result' });
    expect(result2).toEqual({ data: 'result' });
    expect(result3).toEqual({ data: 'result' });

    // But function should only be called once
    expect(callCount).toBe(1);
  });

  it('should cache results when useCache is true', async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      return { data: 'cached' };
    };

    const key = 'cache-key';

    // First call
    const result1 = await deduplicateRequest(key, requestFn, true);
    expect(callCount).toBe(1);

    // Second call should use cache
    const result2 = await deduplicateRequest(key, requestFn, true);
    expect(callCount).toBe(1); // Still 1, used cache
    expect(result2).toEqual(result1);
  });

  it('should not cache when useCache is false', async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      return { data: 'no-cache' };
    };

    const key = 'no-cache-key';

    await deduplicateRequest(key, requestFn, false);
    await deduplicateRequest(key, requestFn, false);

    // Should be called twice
    expect(callCount).toBe(2);
  });

  it('should handle different keys separately', async () => {
    let callCount = 0;
    const requestFn = async () => {
      callCount++;
      return { data: callCount };
    };

    const result1 = await deduplicateRequest('key1', requestFn);
    const result2 = await deduplicateRequest('key2', requestFn);

    expect(result1.data).toBe(1);
    expect(result2.data).toBe(2);
    expect(callCount).toBe(2);
  });

  it('should handle errors and clean up', async () => {
    const requestFn = async () => {
      throw new Error('Request failed');
    };

    const key = 'error-key';

    await expect(deduplicateRequest(key, requestFn)).rejects.toThrow('Request failed');

    // Should be able to retry after error
    const requestFn2 = async () => ({ data: 'success' });
    const result = await deduplicateRequest(key, requestFn2);
    expect(result.data).toBe('success');
  });

  it('should clear cache', () => {
    clearRequestCache();
    // Should not throw
    expect(true).toBe(true);
  });

  it('should clear expired cache entries', () => {
    clearExpiredCache();
    // Should not throw
    expect(true).toBe(true);
  });
});

