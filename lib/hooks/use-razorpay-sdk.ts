'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_ID = 'razorpay-checkout-script';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const LOAD_TIMEOUT = 10000; // 10 seconds

// Production-safe logging
const isProduction = process.env.NODE_ENV === 'production';
const log = (...args: any[]) => {
  if (!isProduction) {
    console.log(...args);
  }
};
const logError = (...args: any[]) => {
  console.error(...args); // Always log errors
};
const logWarn = (...args: any[]) => {
  if (!isProduction) {
    console.warn(...args);
  }
};

// Global state to prevent multiple loads
let globalLoadPromise: Promise<void> | null = null;
let globalLoadAttempts = 0;

/**
 * Production-ready shared hook to load Razorpay SDK once globally
 * Handles retries, production logging, and error recovery
 */
export function useRazorpaySDK() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Validate environment variable
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      logError('❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
      setIsLoading(false);
      setError('Payment gateway not configured');
      toast.error('Payment gateway is not configured. Please contact support.');
      return;
    }

    // Already loaded? Return immediately
    if (typeof window !== 'undefined' && window.Razorpay) {
      log('✅ Razorpay SDK already loaded');
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script tag already exists (loaded by another component)
    const existingScript = document.getElementById(SCRIPT_ID) || 
                          document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    
    if (existingScript) {
      log('📦 Script tag exists, waiting for Razorpay to initialize...');
      // Script exists, wait for window.Razorpay to be available
      const checkInterval = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(checkInterval);
          return;
        }
        if (typeof window !== 'undefined' && window.Razorpay) {
          log('✅ Razorpay SDK available from existing script');
          setIsLoaded(true);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);

      // Timeout after configured delay
      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        if (!mountedRef.current) return;
        if (!window.Razorpay) {
          logError('❌ Razorpay SDK timeout - window.Razorpay not available after', LOAD_TIMEOUT, 'ms');
          setIsLoading(false);
          setError('Razorpay SDK failed to load - check network connection or disable ad blockers');
          // Retry if we haven't exceeded max retries
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            logWarn(`⚠️ Retrying Razorpay SDK load (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);
            setTimeout(() => {
              if (mountedRef.current) {
                setIsLoading(true);
                setError(null);
                // Trigger reload by removing script and retrying
                if (existingScript.parentNode) {
                  existingScript.parentNode.removeChild(existingScript);
                }
                // Retry will happen on next render
                window.location.reload();
              }
            }, RETRY_DELAY);
          }
        }
      }, LOAD_TIMEOUT);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };
    }

    // Use global promise to prevent multiple simultaneous loads
    if (!globalLoadPromise) {
      globalLoadPromise = new Promise<void>((resolve, reject) => {
        globalLoadAttempts++;
        log(`📦 Loading Razorpay SDK (attempt ${globalLoadAttempts})...`);

        // Create and load script (only once, shared globally)
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';

        const loadTimeout = setTimeout(() => {
          if (!window.Razorpay) {
            logError('❌ Razorpay SDK load timeout');
            reject(new Error('Razorpay SDK load timeout'));
          }
        }, LOAD_TIMEOUT);

        script.onload = () => {
          clearTimeout(loadTimeout);
          // Give Razorpay a moment to initialize
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.Razorpay) {
              log('✅ Razorpay SDK loaded successfully');
              globalLoadPromise = null;
              globalLoadAttempts = 0;
              resolve();
            } else {
              // Script loaded but window.Razorpay not available yet
              // Wait a bit more (sometimes it takes a moment)
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.Razorpay) {
                  log('✅ Razorpay SDK available after delay');
                  globalLoadPromise = null;
                  globalLoadAttempts = 0;
                  resolve();
                } else {
                  logError('❌ Razorpay SDK script loaded but window.Razorpay is undefined');
                  globalLoadPromise = null;
                  reject(new Error('Razorpay SDK loaded but not initialized'));
                }
              }, 500);
            }
          }, 200);
        };

        script.onerror = (event) => {
          clearTimeout(loadTimeout);
          logError('❌ Razorpay SDK script load error:', event);
          globalLoadPromise = null;
          
          // Retry if we haven't exceeded max attempts
          if (globalLoadAttempts < MAX_RETRIES) {
            logWarn(`⚠️ Retrying Razorpay SDK load (attempt ${globalLoadAttempts + 1}/${MAX_RETRIES})...`);
            setTimeout(() => {
              globalLoadPromise = null;
              // Remove failed script
              if (script.parentNode) {
                script.parentNode.removeChild(script);
              }
              reject(new Error(`Load failed, will retry (attempt ${globalLoadAttempts})`));
            }, RETRY_DELAY);
          } else {
            reject(new Error('Razorpay SDK failed to load after multiple attempts'));
          }
        };

        // Append to document head (better for CSP compliance)
        try {
          document.head.appendChild(script);
          log('✅ Razorpay script element appended to DOM');
          
          // Additional check after a moment to see if script is still there
          setTimeout(() => {
            const checkScript = document.getElementById(SCRIPT_ID);
            if (!checkScript) {
              logWarn('⚠️ Script element was removed shortly after append - possible CSP violation');
            }
          }, 500);
        } catch (err) {
          clearTimeout(loadTimeout);
          logError('❌ Failed to append Razorpay script to DOM:', err);
          globalLoadPromise = null;
          reject(err);
        }
      });
    }

    // Wait for global load promise
    globalLoadPromise
      .then(() => {
        if (!mountedRef.current) return;
        if (typeof window !== 'undefined' && window.Razorpay) {
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setIsLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load payment gateway';
        setError(errorMessage);
        
        // Enhanced error handling
        const scriptElement = document.getElementById(SCRIPT_ID);
        const errorInfo = {
          error: errorMessage,
          scriptSrc: RAZORPAY_SCRIPT_URL,
          scriptId: SCRIPT_ID,
          scriptElementExists: !!scriptElement,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          online: typeof navigator !== 'undefined' ? navigator.onLine : true,
          isProduction,
          timestamp: new Date().toISOString(),
        };
        
        logError('❌ Razorpay SDK load failed:', errorInfo);
        
        if (!scriptElement) {
          logError('⚠️ Script element was removed - possible CSP violation or ad blocker');
          toast.error('Payment gateway blocked. Please disable ad blockers and refresh the page.', {
            duration: 6000,
          });
        } else {
          toast.error('Failed to load payment gateway. Please check your connection and refresh.', {
            duration: 6000,
          });
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    Razorpay: typeof window !== 'undefined' ? window.Razorpay : null,
  };
}

