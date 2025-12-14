/**
 * Integration tests for usePaddleSDK hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePaddleSDK } from '@/lib/hooks/use-paddle-sdk';

declare global {
  interface Window {
    Paddle?: any;
  }
}

describe('usePaddleSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).Paddle;
    
    // Clean up scripts
    const scripts = document.querySelectorAll('script[src*="paddle"]');
    scripts.forEach(script => script.remove());
  });

  afterEach(() => {
    delete (window as any).Paddle;
  });

  it('should initialize with loading state', () => {
    process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY = 'test-key';
    
    const { result } = renderHook(() => usePaddleSDK());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoaded).toBe(false);
  });

  it('should detect already loaded Paddle', () => {
    (window as any).Paddle = {
      Environment: { set: vi.fn() },
      Setup: vi.fn(),
    };
    process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY = 'test-key';

    const { result } = renderHook(() => usePaddleSDK());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle missing key', () => {
    delete process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY;

    const { result } = renderHook(() => usePaddleSDK());

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should load Paddle SDK', async () => {
    process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY = 'test-key';
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT = 'sandbox';

    // Mock script loading
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName) as HTMLScriptElement;
        setTimeout(() => {
          (window as any).Paddle = {
            Environment: { set: vi.fn() },
            Setup: vi.fn(),
          };
          script.onload?.(new Event('load') as any);
        }, 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    const { result } = renderHook(() => usePaddleSDK());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    }, { timeout: 2000 });
  });
});

