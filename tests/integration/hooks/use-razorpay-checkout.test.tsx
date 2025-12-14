/**
 * Integration tests for useRazorpayCheckout hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRazorpayCheckout } from '@/lib/hooks/use-razorpay-checkout';

// Mock window.Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

describe('useRazorpayCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any existing scripts
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      existingScript.remove();
    }
  });

  afterEach(() => {
    delete (window as any).Razorpay;
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useRazorpayCheckout());

    expect(result.current.razorpayLoaded).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should load Razorpay SDK', async () => {
    // Mock script loading
    const mockRazorpay = vi.fn();
    (window as any).Razorpay = mockRazorpay;

    // Mock script onload
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName) as HTMLScriptElement;
        setTimeout(() => {
          script.onload?.(new Event('load') as any);
        }, 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    const { result } = renderHook(() => useRazorpayCheckout());

    await waitFor(() => {
      expect(result.current.razorpayLoaded).toBe(true);
    }, { timeout: 2000 });
  });

  it('should open checkout when SDK is loaded', async () => {
    const mockRazorpayInstance = {
      open: vi.fn(),
      on: vi.fn(),
    };

    const mockRazorpay = vi.fn(() => mockRazorpayInstance);
    (window as any).Razorpay = mockRazorpay;

    // Mock environment variable
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-key';

    const { result } = renderHook(() => useRazorpayCheckout());

    // Wait for SDK to load
    await waitFor(() => {
      expect(result.current.razorpayLoaded).toBe(true);
    }, { timeout: 2000 });

    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    await result.current.openCheckout({
      orderId: 'order-123',
      amount: 1000,
      currency: 'INR',
      name: 'Test',
      description: 'Test payment',
      onSuccess,
      onFailure,
    });

    expect(mockRazorpay).toHaveBeenCalled();
  });

  it('should handle SDK load errors', async () => {
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        const script = originalCreateElement.call(document, tagName) as HTMLScriptElement;
        setTimeout(() => {
          script.onerror?.(new Event('error') as any);
        }, 10);
        return script;
      }
      return originalCreateElement.call(document, tagName);
    });

    const { result } = renderHook(() => useRazorpayCheckout());

    // Should handle error gracefully
    await waitFor(() => {
      expect(result.current.razorpayLoaded).toBe(false);
    }, { timeout: 2000 });
  });
});

