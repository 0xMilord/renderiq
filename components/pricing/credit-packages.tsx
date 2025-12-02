'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CreditPackagesProps {
  packages: any[];
  userCredits?: any;
  onPurchaseComplete?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CreditPackages({ packages, userCredits, onPurchaseComplete }: CreditPackagesProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (packageId: string, packageData: any) => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading, please wait...');
      return;
    }

    try {
      setLoading(packageId);

      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditPackageId: packageId }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const { orderId, amount, currency } = orderResult.data;

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Convert to paise
        currency: currency,
        name: 'Renderiq',
        description: packageData.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              const totalCredits = packageData.credits + (packageData.bonusCredits || 0);
              toast.success(
                `Payment successful! ${totalCredits} credits added to your account.`
              );
              
              if (onPurchaseComplete) {
                onPurchaseComplete();
              }
              
              // Refresh page to update credit balance
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              throw new Error(verifyResult.error || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed');
          }
        },
        prefill: {
          email: userCredits?.email || '',
          name: userCredits?.name || '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setLoading(null);
      });
    } catch (error: any) {
      console.error('Error processing purchase:', error);
      toast.error(error.message || 'Failed to process purchase');
      setLoading(null);
    }
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No credit packages available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
        <p className="text-muted-foreground">
          Purchase credits for pay-as-you-go usage. Credits never expire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
          const pricePerCredit = parseFloat(pkg.price) / totalCredits;

          return (
            <Card key={pkg.id} className={`relative ${pkg.isPopular ? 'ring-2 ring-primary' : ''}`}>
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  {pkg.bonusCredits > 0 ? (
                    <Sparkles className="h-6 w-6 text-primary" />
                  ) : (
                    <Coins className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                {pkg.description && (
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Credits */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-foreground">
                    {totalCredits.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} credits
                    {pkg.bonusCredits > 0 && (
                      <span className="text-primary"> + {pkg.bonusCredits} bonus</span>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      ₹{parseFloat(pkg.price).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{pricePerCredit.toFixed(2)} per credit
                  </p>
                </div>

                {/* Value proposition */}
                {pkg.bonusCredits > 0 && (
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-primary">
                      Get {pkg.bonusCredits} bonus credits!
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.id, pkg)}
                  disabled={loading === pkg.id || !razorpayLoaded}
                >
                  {loading === pkg.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase Credits'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

