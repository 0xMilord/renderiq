'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

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
  const razorpayInstanceRef = useRef<any>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Determine if dark mode is active
  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if Razorpay SDK is already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      // Script exists, wait for it to load
      if (window.Razorpay) {
        setRazorpayLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setRazorpayLoaded(true));
      }
      return;
    }

    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
      } else {
        console.error('Razorpay SDK loaded but window.Razorpay is not available');
        toast.error('Failed to initialize payment gateway');
      }
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - it might be used by other components
    };
  }, []);

  const handlePurchase = async (packageId: string, packageData: any) => {
    // Check if Razorpay SDK is available
    if (!window.Razorpay) {
      toast.error('Payment gateway is not available. Please refresh the page.');
      return;
    }

    // Check if Razorpay key is configured
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error('Payment gateway is not configured. Please contact support.');
      console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
      return;
    }

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

      // Get base URL for logo (use environment variable for production, fallback to window origin)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'https://renderiq.io');
      const logoUrl = `${baseUrl}/logo.svg`; // Use SVG logo from public folder

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: amount * 100, // Convert to paise
        currency: currency,
        name: 'Renderiq',
        description: packageData.name,
        image: logoUrl, // Add logo to checkout
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
              setLoading(null);
              // Redirect to success page
              window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId}&razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}`;
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
          color: '#D1F24A', // Always use neon green accent color
          backdrop_color: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)', // Semi-transparent backdrop
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
            toast.info('Payment cancelled');
          },
          escape: true, // Allow ESC key to close
          animation: true, // Enable animations
        },
        // Configure modal to prevent blocking
        config: {
          display: {
            blocks: {
              banks: {
                name: 'All payment methods',
                instruments: [
                  {
                    method: 'upi',
                  },
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                  {
                    method: 'wallet',
                  },
                ],
              },
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
      };

      // Store Razorpay instance
      const razorpay = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpay;
      
      // Open Razorpay checkout
      razorpay.open();
      
      // Style Razorpay modal to be theme-aware after it opens
      const styleRazorpayModal = () => {
        // Find Razorpay's modal overlay (it's usually a div with fixed positioning and high z-index)
        const overlays = Array.from(document.querySelectorAll('div[style*="position: fixed"]'))
          .filter((el: any) => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex || '0');
            return zIndex > 1000 && el.querySelector('iframe');
          });
        
        if (overlays.length > 0) {
          const overlay = overlays[0] as HTMLElement;
          // Style the backdrop - make it visible and theme-aware
          overlay.style.backgroundColor = isDarkMode 
            ? 'rgba(0, 0, 0, 0.85)' 
            : 'rgba(0, 0, 0, 0.5)';
          overlay.style.backdropFilter = 'blur(8px)';
          
          // Find the iframe container and make it theme-aware with proper sizing
          const containers = Array.from(overlay.querySelectorAll('div'))
            .filter((div: any) => div.querySelector('iframe'));
          
          containers.forEach((container: HTMLElement) => {
            container.style.backgroundColor = isDarkMode ? 'hsl(0 0% 7%)' : 'hsl(0 0% 100%)';
            container.style.borderRadius = '12px';
            container.style.boxShadow = isDarkMode 
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            // Set size to 90vw x 90vh
            container.style.maxWidth = '90vw';
            container.style.maxHeight = '90vh';
            container.style.width = '90vw';
            container.style.height = '90vh';
          });
        }
      };
      
      // Try multiple times as Razorpay modal might take time to render
      setTimeout(styleRazorpayModal, 200);
      setTimeout(styleRazorpayModal, 500);
      setTimeout(styleRazorpayModal, 1000);
      
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        setLoading(null);
        const errorDescription = response.error?.description || 'Unknown error';
        window.location.href = `/payment/failure?razorpay_order_id=${orderId}&error_description=${encodeURIComponent(errorDescription)}`;
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

      {/* Sort packages by display_order */}
      {(() => {
        const sortedPackages = [...packages].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {sortedPackages.map((pkg) => {
              const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
              const pricePerCredit = parseFloat(pkg.price) / totalCredits;
              const isSmallPackage = pkg.credits <= 50;

              return (
                <Card key={pkg.id} className={`relative flex flex-col ${pkg.isPopular ? 'ring-2 ring-primary' : ''} ${isSmallPackage ? 'h-full' : ''}`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2 pt-4 px-3">
                    <div className={`${isSmallPackage ? 'w-8 h-8' : 'w-10 h-10'} bg-muted rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      {pkg.bonusCredits > 0 ? (
                        <Sparkles className={`${isSmallPackage ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                      ) : (
                        <Coins className={`${isSmallPackage ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />
                      )}
                    </div>
                    <CardTitle className={`${isSmallPackage ? 'text-sm' : 'text-base'} font-semibold leading-tight`}>{pkg.name}</CardTitle>
                    {pkg.description && !isSmallPackage && (
                      <CardDescription className="text-xs mt-1 line-clamp-2">{pkg.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 px-3 pb-3 flex-1 flex flex-col">
                    {/* Credits */}
                    <div className={`text-center ${isSmallPackage ? 'p-2' : 'p-3'} bg-muted rounded-lg`}>
                      <div className={`${isSmallPackage ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
                        {totalCredits.toLocaleString()}
                      </div>
                      <div className={`${isSmallPackage ? 'text-xs' : 'text-sm'} text-muted-foreground mt-0.5`}>
                        {pkg.credits.toLocaleString()} credits
                        {pkg.bonusCredits > 0 && (
                          <span className="text-primary"> +{pkg.bonusCredits}</span>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="text-center">
                      <div className="flex items-baseline justify-center">
                        <span className={`${isSmallPackage ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
                          ₹{parseFloat(pkg.price).toLocaleString()}
                        </span>
                      </div>
                      <p className={`${isSmallPackage ? 'text-xs' : 'text-sm'} text-muted-foreground mt-0.5`}>
                        ₹{pricePerCredit.toFixed(2)}/credit
                      </p>
                    </div>

                    {/* Value proposition */}
                    {pkg.bonusCredits > 0 && !isSmallPackage && (
                      <div className="bg-primary/10 rounded-lg p-2 text-center">
                        <p className="text-xs font-medium text-primary">
                          +{pkg.bonusCredits} bonus!
                        </p>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      className={`w-full ${isSmallPackage ? 'text-xs h-8' : 'text-sm h-9'} mt-auto`}
                      onClick={() => handlePurchase(pkg.id, pkg)}
                      disabled={loading === pkg.id || !razorpayLoaded}
                    >
                      {loading === pkg.id ? (
                        <>
                          <Loader2 className={`${isSmallPackage ? 'h-3 w-3' : 'h-4 w-4'} mr-1.5 animate-spin`} />
                          <span className={isSmallPackage ? 'text-xs' : ''}>Processing...</span>
                        </>
                      ) : (
                        <span className={isSmallPackage ? 'text-xs' : ''}>Buy Now</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}

      {/* Inject global styles for Razorpay modal theming */}
      {mounted && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Style Razorpay modal overlay - target high z-index fixed elements with iframe */
              body > div[style*="position: fixed"]:has(iframe) {
                backdrop-filter: blur(8px) !important;
                background-color: ${isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)'} !important;
              }
              
              /* Make Razorpay modal container theme-aware and sized to 90vw x 90vh */
              body > div[style*="position: fixed"]:has(iframe) > div {
                background-color: ${isDarkMode ? 'hsl(0 0% 7%)' : 'hsl(0 0% 100%)'} !important;
                border-radius: 12px !important;
                box-shadow: ${isDarkMode 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'} !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                width: 90vw !important;
                height: 90vh !important;
              }
              
              /* Style Razorpay iframe container */
              body > div[style*="position: fixed"]:has(iframe) iframe {
                border-radius: 12px !important;
                width: 100% !important;
                height: 100% !important;
              }
            `,
          }}
        />
      )}
    </div>
  );
}

