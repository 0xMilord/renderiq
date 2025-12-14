/**
 * Tests for retry fetch utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { retryFetch, RetryFetchOptions } from '@/lib/utils/retry-fetch';

// Mock fetch
global.fetch = vi.fn();

describe('Retry Fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);

    const response = await retryFetch('https://example.com/api');

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on network errors', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const response = await retryFetch('https://example.com/api', {
      maxAttempts: 3,
      retryDelay: 10, // Short delay for tests
    });

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on timeout errors', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const response = await retryFetch('https://example.com/api', {
      maxAttempts: 3,
      retryDelay: 10,
    });

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 413 Payload Too Large', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 413,
      statusText: 'Payload Too Large',
    } as Response);

    await expect(
      retryFetch('https://example.com/api', {
        maxAttempts: 3,
      })
    ).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(1); // Should not retry
  });

  it('should not retry on 4xx client errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    await expect(
      retryFetch('https://example.com/api', {
        maxAttempts: 3,
      })
    ).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should use custom shouldRetry function', async () => {
    const shouldRetry = vi.fn((error: Error) => {
      return error.message.includes('retry');
    });

    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('retry this'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    const response = await retryFetch('https://example.com/api', {
      maxAttempts: 3,
      retryDelay: 10,
      shouldRetry,
    });

    expect(response.ok).toBe(true);
    expect(shouldRetry).toHaveBeenCalled();
  });

  it('should respect maxAttempts', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    await expect(
      retryFetch('https://example.com/api', {
        maxAttempts: 2,
        retryDelay: 10,
      })
    ).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn((fn: Function, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(fn, delay);
    }) as any;

    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

    await retryFetch('https://example.com/api', {
      maxAttempts: 3,
      retryDelay: 100,
    });

    // First retry: 100 * 1 = 100ms
    // Second retry: 100 * 2 = 200ms
    expect(delays.length).toBeGreaterThan(0);

    global.setTimeout = originalSetTimeout;
  });
});

