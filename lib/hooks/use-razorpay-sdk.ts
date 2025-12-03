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

    script.onerror = (event) => {
      setIsLoading(false);
      setError('Failed to load payment gateway');
      
      // Check if script was blocked
      const scriptElement = document.getElementById(SCRIPT_ID);
      
      // Enhanced debugging information
      const errorInfo = {
        scriptSrc: RAZORPAY_SCRIPT_URL,
        scriptId: SCRIPT_ID,
        scriptElementExists: !!scriptElement,
        scriptReadyState: scriptElement?.getAttribute('src') || 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        timestamp: new Date().toISOString(),
      };
      
      // Log as warn to avoid alarming users - error is already shown via toast
      console.warn('⚠️ Razorpay SDK load failed:', errorInfo);
      console.warn('Event details:', event);
      
      // Check for CSP violations in console (browser will log separately)
      if (typeof window !== 'undefined') {
        // Check if we can see CSP errors (they appear in console)
        console.warn('💡 Troubleshooting tips:');
        console.warn('1. Check browser console for CSP violation messages');
        console.warn('2. Verify network connectivity');
        console.warn('3. Check if ad blockers are enabled');
        console.warn('4. Try accessing:', RAZORPAY_SCRIPT_URL);
        console.warn('5. Check browser DevTools → Network tab for blocked requests');
      }
      
      if (!scriptElement) {
        console.error('⚠️ Script element was removed - possible CSP violation or ad blocker');
        toast.error('Payment gateway blocked. Please disable ad blockers and refresh the page.', {
          duration: 5000,
        });
      } else {
        // Use warn instead of error to avoid alarming users unnecessarily
        // The actual error will be shown via toast notification
        console.warn('⚠️ Razorpay SDK: Script load failed - network error or CSP violation');
        console.error('Script element exists but failed to load. Possible causes:');
        console.error('1. Network connectivity issue');
        console.error('2. CSP (Content Security Policy) blocking the script');
        console.error('3. CORS (Cross-Origin) restrictions');
        console.error('4. Ad blocker or browser extension blocking');
        console.error('5. Firewall or proxy blocking external scripts');
        console.error('');
        console.error('🔍 Diagnostic Information:');
        console.error('- Script URL:', RAZORPAY_SCRIPT_URL);
        console.error('- Script in DOM:', !!scriptElement);
        console.error('- Online status:', typeof navigator !== 'undefined' ? navigator.onLine : 'unknown');
        
        // Try to fetch the script URL directly to test connectivity (non-blocking)
        if (typeof fetch !== 'undefined') {
          fetch(RAZORPAY_SCRIPT_URL, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
              console.log('✅ Script URL is accessible (HEAD request succeeded) - issue may be CSP or ad blocker');
            })
            .catch((fetchError) => {
              console.error('❌ Script URL fetch test failed:', fetchError);
              console.error('This suggests a network, CORS, or CSP issue');
            });
        }
        
        toast.error('Failed to load payment gateway. Check console for details, disable ad blockers, and refresh.', {
          duration: 6000,
        });
      }
    };

    // Append to document head (better for CSP compliance)
    try {
      // Verify script URL is accessible before appending
      console.log('📦 Loading Razorpay SDK from:', RAZORPAY_SCRIPT_URL);
      console.log('📦 Script ID:', SCRIPT_ID);
      
      document.head.appendChild(script);
      console.log('✅ Razorpay script element appended to DOM');
      
      // Additional check after a moment to see if script is still there
      setTimeout(() => {
        const checkScript = document.getElementById(SCRIPT_ID);
        if (!checkScript) {
          console.warn('⚠️ Script element was removed shortly after append - possible CSP violation');
        }
      }, 500);
    } catch (err) {
      setIsLoading(false);
      setError('Failed to initialize payment gateway');
      console.error('❌ Failed to append Razorpay script to DOM:', err);
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

