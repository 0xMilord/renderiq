'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Paddle Redirect Handler
 * 
 * Handles Paddle payment redirects that come to the home page with ?_ptxn parameter
 * Redirects to payment success page with proper transaction ID
 */
export function PaddleRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ptxn = searchParams.get('_ptxn');
    
    if (ptxn) {
      // Paddle redirects with ?_ptxn=transaction_id
      // Redirect to payment success page with proper parameter
      const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.startsWith('192.168.') ||
                          window.location.hostname.startsWith('10.');
      
      // Use current origin (works for both localhost and production)
      const baseUrl = window.location.origin;
      
      // Redirect to payment success page with paddle_transaction_id
      const redirectUrl = `${baseUrl}/payment/success?paddle_transaction_id=${ptxn}`;
      
      console.log('🔄 Paddle redirect detected (_ptxn parameter), redirecting to payment success:', redirectUrl);
      router.replace(redirectUrl);
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}

