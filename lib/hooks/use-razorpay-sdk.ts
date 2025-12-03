'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_ID = 'razorpay-checkout-script';

/**
 * Simple, shared hook to load Razorpay SDK once globally
 * Based on Razorpay's official documentation - keep it simple!
 */
export function useRazorpaySDK() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already loaded? Return immediately
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script tag already exists (loaded by another component)
    const existingScript = document.getElementById(SCRIPT_ID) || 
                          document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    
    if (existingScript) {
      // Script exists, wait for window.Razorpay to be available
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
          setIsLoaded(true);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.Razorpay) {
          setIsLoading(false);
          setError('Razorpay SDK failed to load - check network connection or disable ad blockers');
          console.error('Razorpay SDK timeout - window.Razorpay not available after 10 seconds');
        }
      }, 10000);

      return () => clearInterval(checkInterval);
    }

    // Create and load script (only once, shared globally)
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      // Give Razorpay a moment to initialize
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
          setIsLoaded(true);
          setIsLoading(false);
          console.log('✅ Razorpay SDK loaded successfully');
        } else {
          // Script loaded but window.Razorpay not available yet
          // Wait a bit more (sometimes it takes a moment)
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.Razorpay) {
              setIsLoaded(true);
              setIsLoading(false);
              console.log('✅ Razorpay SDK available after delay');
            } else {
              setIsLoading(false);
              setError('Razorpay SDK loaded but not initialized');
              console.error('❌ Razorpay SDK script loaded but window.Razorpay is undefined');
            }
          }, 500);
        }
      }, 200);
    };

    script.onerror = () => {
      setIsLoading(false);
      setError('Failed to load payment gateway');
      
      // Check if script was blocked
      const scriptElement = document.getElementById(SCRIPT_ID);
      if (!scriptElement) {
        console.error('Script element was removed - possible CSP violation or ad blocker');
        toast.error('Payment gateway blocked. Please disable ad blockers and refresh the page.', {
          duration: 5000,
        });
      } else {
        console.error('Script load failed - network error or CSP violation');
        toast.error('Failed to load payment gateway. Please check your connection and refresh.', {
          duration: 5000,
        });
      }
    };

    // Append to document head (better for CSP compliance)
    try {
      document.head.appendChild(script);
      console.log('📦 Loading Razorpay SDK...');
    } catch (err) {
      setIsLoading(false);
      setError('Failed to initialize payment gateway');
      console.error('Failed to append Razorpay script:', err);
      toast.error('Failed to initialize payment gateway. Please refresh the page.', {
        duration: 5000,
      });
    }

    // Cleanup: Don't remove script on unmount - it's shared globally!
    // The script stays in DOM for other components to use
    return () => {
      // No cleanup needed - script stays loaded
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    Razorpay: typeof window !== 'undefined' ? window.Razorpay : null,
  };
}

