/**
 * Integration tests for useRazorpaySDK hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRazorpaySDK } from '@/lib/hooks/use-razorpay-sdk';

declare global {
  interface Window {
    Razorpay: any;
  }
}

describe('useRazorpaySDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).Razorpay;
    
    // Clean up scripts
    const scripts = document.querySelectorAll('script[src*="razorpay"]');
    scripts.forEach(script => script.remove());
  });

  afterEach(() => {
    delete (window as any).Razorpay;
  });

  it('should initialize with loading state', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-key';
    
    const { result } = renderHook(() => useRazorpaySDK());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoaded).toBe(false);
  });

  it('should detect already loaded SDK', () => {
    (window as any).Razorpay = {};
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-key';

    const { result } = renderHook(() => useRazorpaySDK());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle missing key', () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    const { result } = renderHook(() => useRazorpaySDK());

    expect(result.current.error).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should load SDK script', async () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-key';

    // Mock script loading
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName) as HTMLScriptElement;
        setTimeout(() => {
          (window as any).Razorpay = {};
          script.onload?.(new Event('load') as any);
        }, 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    const { result } = renderHook(() => useRazorpaySDK());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    }, { timeout: 2000 });
  });
});

