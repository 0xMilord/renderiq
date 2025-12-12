/**
 * Paddle SDK Hook
 * 
 * Loads and initializes Paddle.js for client-side checkout
 */

'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Paddle?: any;
  }
}

export function usePaddleSDK() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Paddle is already loaded
    if (window.Paddle) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Paddle.js
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      const paddlePublicKey = process.env.NEXT_PUBLIC_PADDLE_PUBLIC_KEY;
      const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';

      if (!paddlePublicKey) {
        setError('Paddle public key not configured');
        setIsLoading(false);
        return;
      }

      try {
        // Initialize Paddle
        window.Paddle.Environment.set(paddleEnvironment);
        window.Paddle.Setup({ 
          token: paddlePublicKey,
        });

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Paddle');
      } finally {
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load Paddle SDK');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    Paddle: typeof window !== 'undefined' ? window.Paddle : null,
  };
}

