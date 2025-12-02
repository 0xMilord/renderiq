'use client';

import { useEffect } from 'react';

/**
 * Console Security Warning Component
 * Displays Meta-style security warnings in browser console
 * Prevents account hijacking and unauthorized access
 */
export function ConsoleSecurityWarning() {
  useEffect(() => {
    // Only show in production
    if (process.env.NODE_ENV !== 'production') return;

    // Wait for console to be ready
    const timer = setTimeout(() => {
      // Clear console first
      console.clear();

      // Display security warning
      console.log(
        '%c⚠️ SECURITY WARNING ⚠️',
        'color: #ff0000; font-size: 20px; font-weight: bold; padding: 10px;'
      );
      
      console.log(
        '%cSTOP!',
        'color: #ff0000; font-size: 16px; font-weight: bold;'
      );
      
      console.log(
        '%cThis is a browser feature intended for developers. ' +
        'If someone told you to copy-paste something here to enable a feature or "hack" someone\'s account, ' +
        'it is a scam and will give them access to your account.',
        'color: #333; font-size: 14px; line-height: 1.5;'
      );
      
      console.log(
        '%cDo not paste any code here that you do not understand. ' +
        'Doing so may compromise your account security.',
        'color: #ff6600; font-size: 14px; font-weight: bold;'
      );
      
      console.log(
        '%cIf you are a developer and understand what you are doing, ' +
        'you can safely ignore this warning.',
        'color: #666; font-size: 12px; font-style: italic;'
      );

      // Additional warnings
      console.warn(
        '%c⚠️ Account Security Notice',
        'color: #ff0000; font-weight: bold;'
      );
      
      console.warn(
        'Never share your authentication tokens, API keys, or session data with anyone. ' +
        'Legitimate support will never ask you to paste code in the console.'
      );

      // Log security event
      if (typeof window !== 'undefined') {
        // Track console access (non-intrusive)
        try {
          fetch('/api/security/console-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            }),
          }).catch(() => {
            // Silently fail - don't expose errors
          });
        } catch {
          // Silently fail
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

