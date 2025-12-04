'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Coins, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/lib/hooks/use-currency';
import { useRazorpaySDK } from '@/lib/hooks/use-razorpay-sdk';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';

// Helper function to format numbers with k/m/b suffixes (no decimals)
const formatNumberCompact = (num: number | string | null | undefined): string => {
  const number = typeof num === 'string' ? parseFloat(num) : (num || 0);
  const value = isNaN(number) ? 0 : number;
  
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return Math.round(value).toString();
};

// Helper function to format currency with k/m/b suffixes
const formatCurrencyCompact = (amount: number, currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];
  const symbol = currencyInfo.symbol;
  const compact = formatNumberCompact(amount);
  return `${symbol}${compact}`;
};

interface CreditPackagesProps {
  packages: any[];
  userCredits?: any;
  onPurchaseComplete?: () => void;
}

export function CreditPackages({ packages, userCredits, onPurchaseComplete }: CreditPackagesProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [processingDialog, setProcessingDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [verificationDialog, setVerificationDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [razorpayOpen, setRazorpayOpen] = useState(false); // Track if Razorpay iframe is open
  const razorpayInstanceRef = useRef<any>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { currency, currencyInfo, exchangeRate, format, changeCurrency, loading: currencyLoading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});
  
  // Use simplified shared Razorpay SDK loader
  const { isLoaded: razorpayLoaded, isLoading: razorpayLoading, Razorpay } = useRazorpaySDK();

  // Determine if dark mode is active
  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Convert all prices when currency or exchange rate changes
  useEffect(() => {
    if (packages.length === 0 || currencyLoading || !exchangeRate) {
      return;
    }

    // Convert prices synchronously using the exchange rate
    const converted: Record<string, number> = {};
    for (const pkg of packages) {
      const priceInINR = parseFloat(pkg.price);
      // Convert using exchange rate directly (no async needed)
      converted[pkg.id] = currency === 'INR' ? priceInINR : priceInINR * exchangeRate;
    }
    setConvertedPrices(converted);
  }, [currency, exchangeRate, packages, currencyLoading]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitor for Razorpay iframe and disable dialogs when it's open
  useEffect(() => {
    if (!mounted) return;

    const checkRazorpayOpen = () => {
      // Check for Razorpay iframe by looking for fixed position divs with iframes
      const fixedDivs = Array.from(document.querySelectorAll('body > div[style*="position: fixed"]'));
      const razorpayIframe = fixedDivs.find((div: any) => {
        const iframe = div.querySelector('iframe');
        if (!iframe) return false;
        const style = window.getComputedStyle(div);
        const zIndex = parseInt(style.zIndex || '0');
        return zIndex > 1000; // Razorpay uses high z-index
      });
      
      const isOpen = !!razorpayIframe;
      setRazorpayOpen(isOpen);

      // Disable pointer events on all dialog overlays when Razorpay is open
      if (isOpen) {
        const dialogOverlays = document.querySelectorAll('[data-slot="dialog-overlay"]');
        const dialogContents = document.querySelectorAll('[data-slot="dialog-content"]');
        
        dialogOverlays.forEach((overlay: any) => {
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '1';
        });
        
        dialogContents.forEach((content: any) => {
          content.style.pointerEvents = 'none';
          content.style.zIndex = '1';
        });
      } else {
        // Re-enable pointer events when Razorpay closes
        const dialogOverlays = document.querySelectorAll('[data-slot="dialog-overlay"]');
        const dialogContents = document.querySelectorAll('[data-slot="dialog-content"]');
        
        dialogOverlays.forEach((overlay: any) => {
          overlay.style.pointerEvents = '';
          overlay.style.zIndex = '';
        });
        
        dialogContents.forEach((content: any) => {
          content.style.pointerEvents = '';
          content.style.zIndex = '';
        });
      }
    };

    // Check immediately and then periodically
    checkRazorpayOpen();
    const interval = setInterval(checkRazorpayOpen, 500);

    // Also watch for mutations (when Razorpay iframe is added/removed)
    const observer = new MutationObserver(checkRazorpayOpen);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [mounted]);

  const handlePurchase = async (packageId: string, packageData: any) => {
    // Check if user is authenticated
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign up or log in to purchase credits');
      setTimeout(() => {
        window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 1500);
      return;
    }

    // Check if Razorpay key is configured first
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error('Payment gateway is not configured. Please contact support.');
      console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
      return;
    }

    // Check if Razorpay SDK is available
    if (!Razorpay || typeof window === 'undefined') {
      if (razorpayLoading) {
        toast.info('Payment gateway is loading, please wait a moment...', { duration: 3000 });
      } else {
        toast.error('Payment gateway is not available. Please refresh the page.', { duration: 5000 });
      }
      return;
    }

    try {
      setLoading(packageId);
      // Show processing dialog
      setProcessingDialog({ open: true, message: 'Please wait while process is being started...' });

      // Create order with currency
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          creditPackageId: packageId,
          currency: currency, // Send selected currency
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const { orderId, amount, currency: orderCurrency } = orderResult.data;

      // Get base URL for logo (use environment variable for production, fallback to window origin)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'https://renderiq.io');
      const logoUrl = `${baseUrl}/logo.svg`; // Use SVG logo from public folder

      // Convert to smallest currency unit (paise for INR, cents for USD, etc.)
      // Most currencies use 100, but JPY uses 1
      const finalCurrency = orderCurrency || currency;
      const currencyMultiplier = finalCurrency === 'JPY' ? 1 : 100;
      
      // Verify Razorpay is available before creating instance
      if (!Razorpay || typeof window === 'undefined') {
        throw new Error('Razorpay SDK is not available. Please refresh the page.');
      }

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: Math.round(amount * currencyMultiplier),
        currency: finalCurrency,
        name: 'Renderiq',
        description: packageData.name,
        image: logoUrl, // Add logo to checkout
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setProcessingDialog({ open: false, message: '' });
            // Show verification dialog
            setVerificationDialog({ open: true, message: 'We are verifying your payment. Please wait...' });
            
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
              setVerificationDialog({ open: false, message: '' });
              // Redirect to success page
              setTimeout(() => {
                window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId}&razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}`;
              }, 500);
            } else {
              setVerificationDialog({ open: false, message: '' });
              throw new Error(verifyResult.error || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            setVerificationDialog({ open: false, message: '' });
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
            setProcessingDialog({ open: false, message: '' });
            setVerificationDialog({ open: false, message: '' });
            razorpayInstanceRef.current = null; // Clear reference
            // No database record exists yet, so nothing to cancel
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
      const razorpay = new Razorpay(options);
      razorpayInstanceRef.current = razorpay;
      
      // CRITICAL: Close processing dialog BEFORE opening Razorpay iframe
      // This prevents dialog from blocking interaction with Razorpay
      setProcessingDialog({ open: false, message: '' });
      
      // CRITICAL: Add payment failure handler
      // Note: Webhook will update order status to "failed", so we don't need to do it here
      razorpay.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response);
        setLoading(null);
        setProcessingDialog({ open: false, message: '' });
        setVerificationDialog({ open: false, message: '' });
        razorpayInstanceRef.current = null; // Clear reference
        const errorDescription = response.error?.description || 'Unknown error';
        
        logger.log('🚫 Payment failed:', { orderId, error: errorDescription });
        
        toast.error(`Payment failed: ${errorDescription}`);
        // Redirect to failure page
        // Webhook will handle updating order status to "failed"
        window.location.href = `/payment/failure?razorpay_order_id=${orderId}&error_description=${encodeURIComponent(errorDescription)}`;
      });
      
      // Small delay to ensure dialog closes before opening Razorpay iframe
      setTimeout(() => {
        // Open Razorpay checkout
        razorpay.open();
      }, 100);
      
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
    } catch (error: any) {
      console.error('Error processing purchase:', error);
      setProcessingDialog({ open: false, message: '' });
      setVerificationDialog({ open: false, message: '' });
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
        
        {/* Currency Selector */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">Currency:</span>
          <Select value={currency} onValueChange={changeCurrency}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                {currencyInfo.symbol} {currencyInfo.code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {/* Show INR first since Razorpay is primarily for Indian market */}
              {Object.values(SUPPORTED_CURRENCIES)
                .sort((a, b) => {
                  // Put INR first
                  if (a.code === 'INR') return -1;
                  if (b.code === 'INR') return 1;
                  return a.code.localeCompare(b.code);
                })
                .map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sort packages by display_order */}
      {(() => {
        const sortedPackages = [...packages].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
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

                  <CardHeader className="pb-2 pt-2 px-3">
                    {/* Package Name with Icon and Buy Now Button - 1 row 2 columns at top */}
                    <div className="grid grid-cols-2 gap-2 items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        {pkg.bonusCredits > 0 ? (
                          <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <Coins className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <CardTitle className="text-sm font-semibold leading-tight truncate">{pkg.name}</CardTitle>
                      </div>
                      <Button
                        className="w-full text-xs h-8"
                        onClick={() => handlePurchase(pkg.id, pkg)}
                        disabled={loading === pkg.id || !razorpayLoaded || razorpayLoading || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
                        title={
                          !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
                            ? 'Payment gateway not configured' 
                            : razorpayLoading || !razorpayLoaded
                              ? 'Payment gateway is loading...' 
                              : ''
                        }
                      >
                        {loading === pkg.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            <span className="text-xs">Processing...</span>
                          </>
                        ) : razorpayLoading || !razorpayLoaded ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            <span className="text-xs">Loading...</span>
                          </>
                        ) : (
                          <span className="text-xs">Buy Now</span>
                        )}
                      </Button>
                    </div>
                    {pkg.description && !isSmallPackage && (
                      <CardDescription className="text-[10px] text-center line-clamp-1">{pkg.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-2 px-3 pb-2 flex-1 flex flex-col">
                    {/* Credits and Pricing - Stack on mobile, side by side on larger screens */}
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                      {/* Credits Column */}
                      <div className="text-center p-1.5 bg-muted rounded">
                        <div className="text-sm font-bold text-foreground">
                          {formatNumberCompact(Number(totalCredits) || 0)}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {formatNumberCompact(Number(pkg.credits) || 0)} credits
                          {pkg.bonusCredits > 0 && (
                            <span className="text-primary"> +{formatNumberCompact(Number(pkg.bonusCredits) || 0)}</span>
                          )}
                        </div>
                      </div>

                      {/* Pricing Column */}
                      <div className="text-center p-1.5 bg-muted rounded">
                        <div className="text-sm font-bold text-foreground">
                          {currencyLoading || !convertedPrices[pkg.id] 
                            ? '...' 
                            : formatCurrencyCompact(convertedPrices[pkg.id], currency)}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          {currencyLoading || !convertedPrices[pkg.id]
                            ? '...'
                            : `${formatCurrencyCompact(Math.round((convertedPrices[pkg.id] || 0) / totalCredits), currency)}/credit`}
                        </div>
                      </div>
                    </div>
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
                z-index: 10000 !important;
              }
              
              /* CRITICAL: Disable pointer events on dialog overlays when Razorpay is open */
              body:has(div[style*="position: fixed"]:has(iframe)) [data-slot="dialog-overlay"] {
                pointer-events: none !important;
                z-index: 1 !important;
              }
              
              /* CRITICAL: Disable pointer events on dialog content when Razorpay is open */
              body:has(div[style*="position: fixed"]:has(iframe)) [data-slot="dialog-content"] {
                pointer-events: none !important;
                z-index: 1 !important;
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

      {/* Processing Dialog - disabled when Razorpay is open */}
      <Dialog open={processingDialog.open && !razorpayOpen} onOpenChange={(open) => !open && setProcessingDialog({ open: false, message: '' })}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
            <DialogDescription>
              {processingDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog - disabled when Razorpay is open */}
      <Dialog open={verificationDialog.open && !razorpayOpen} onOpenChange={(open) => !open && setVerificationDialog({ open: false, message: '' })}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Verifying Payment</DialogTitle>
            <DialogDescription>
              {verificationDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

