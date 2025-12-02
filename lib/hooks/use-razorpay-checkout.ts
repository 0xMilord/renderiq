import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (paymentId: string, orderId: string, signature: string) => void;
  onFailure?: (error: any) => void;
}

export function useRazorpayCheckout() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      toast.error('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const openCheckout = useCallback(
    async (options: RazorpayCheckoutOptions) => {
      if (!razorpayLoaded) {
        toast.error('Payment gateway is loading, please wait...');
        return;
      }

      if (!window.Razorpay) {
        toast.error('Payment gateway not available');
        return;
      }

      setLoading(true);

      try {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          throw new Error('Razorpay key not configured');
        }

        const razorpay = new window.Razorpay({
          key: razorpayKey,
          amount: options.amount * 100, // Convert to paise
          currency: options.currency,
          name: options.name,
          description: options.description,
          order_id: options.orderId,
          prefill: options.prefill,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payments/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                // Redirect to success page
                window.location.href = `/payment/success?payment_order_id=${verifyData.data.paymentOrderId}&razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}`;
                options.onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
              } else {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed');
              options.onFailure?.(error);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              options.onFailure?.({ code: 'USER_CLOSED', description: 'User closed the payment modal' });
            },
          },
        });

        razorpay.on('payment.failed', (response: any) => {
          setLoading(false);
          const errorDescription = response.error?.description || 'Payment failed';
          window.location.href = `/payment/failure?razorpay_order_id=${options.orderId}&error_description=${encodeURIComponent(errorDescription)}`;
          options.onFailure?.(response.error);
        });

        razorpay.open();
      } catch (error) {
        setLoading(false);
        console.error('Razorpay checkout error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to open payment gateway');
        options.onFailure?.(error);
      }
    },
    [razorpayLoaded]
  );

  return {
    openCheckout,
    razorpayLoaded,
    loading,
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}


