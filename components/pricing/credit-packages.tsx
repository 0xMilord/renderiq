'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { GradientCard } from '@/components/ui/gradient-card';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/lib/hooks/use-currency';
import { useRazorpaySDK } from '@/lib/hooks/use-razorpay-sdk';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { calculateSavings } from '@/lib/utils/pricing';

// Helper function to format numbers (no compact formatting)
const formatNumberCompact = (num: number | string | null | undefined): string => {
  const number = typeof num === 'string' ? parseFloat(num) : (num || 0);
  const value = isNaN(number) ? 0 : number;
  return Math.round(value).toLocaleString();
};

// Helper function to format currency with proper decimal places
const formatCurrencyCompact = (amount: number, currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];
  const symbol = currencyInfo.symbol;
  
  // INR: Show whole numbers (no decimals for 100, but show decimals if needed like 100.50)
  // USD: Always show 2 decimal places (1.00, 1.10)
  // JPY: No decimals
  let formatted: string;
  if (currency === 'JPY') {
    formatted = Math.round(amount).toLocaleString('en-US');
  } else if (currency === 'INR') {
    // For INR, only show decimals if they exist (not .00)
    const hasDecimals = amount % 1 !== 0;
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  } else {
    // USD and other currencies: Always show 2 decimal places
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  
  return `${symbol}${formatted}`;
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
  const { currency, currencyInfo, exchangeRate, format, loading: currencyLoading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});
  const [currencyUpdateTrigger, setCurrencyUpdateTrigger] = useState(0); // Force re-calculation
  
  // Use simplified shared Razorpay SDK loader
  const { isLoaded: razorpayLoaded, isLoading: razorpayLoading, Razorpay } = useRazorpaySDK();

  // Determine if dark mode is active
  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Use Paddle USD prices directly (no conversion)
  useEffect(() => {
    if (packages.length === 0) {
      return;
    }

    // ✅ FIXED: Use Paddle USD prices directly from database (no conversion)
    // Paddle prices are stored in the database and match Paddle's Price IDs exactly
    const converted: Record<string, number> = {};
    for (const pkg of packages) {
      // For USD (international/Paddle users): MUST use Paddle USD price directly
      // paddlePriceUSD is stored as decimal (e.g., 1.00 = $1.00) - matches Paddle Price ID exactly
      if (currency === 'USD') {
        // Check if this is a free package (price = 0)
        const basePrice = typeof pkg.price === 'string' ? parseFloat(pkg.price) : Number(pkg.price);
        const isFreePackage = !isNaN(basePrice) && basePrice === 0;
        
        // CRITICAL: For USD, we MUST use paddlePriceUSD, never fall back to INR price
        // Check both camelCase and snake_case field names (database might return either)
        const paddlePrice = pkg.paddlePriceUSD || pkg.paddle_price_usd;
        
        if (paddlePrice != null && paddlePrice !== '' && paddlePrice !== undefined) {
          const price = typeof paddlePrice === 'string' 
            ? parseFloat(paddlePrice) 
            : Number(paddlePrice);
          if (!isNaN(price)) {
            converted[pkg.id] = price; // Allow 0 for free packages
            if (price > 0) {
              console.log(`✅ Using paddlePriceUSD for ${pkg.name}: ${price}`);
            }
            continue;
          }
        }
        
        // Handle free packages: if base price is 0, use 0.00 for USD
        if (isFreePackage) {
          converted[pkg.id] = 0;
          continue;
        }
        
        // If paddlePriceUSD is missing for paid packages, log error with full package data for debugging
        console.error(`⚠️ Missing paddlePriceUSD for package ${pkg.id} (${pkg.name}).`, {
          paddlePriceUSD: pkg.paddlePriceUSD,
          paddle_price_usd: pkg.paddle_price_usd,
          price: pkg.price,
          fullPackage: pkg
        });
        converted[pkg.id] = 0;
        continue;
      }

      // For INR (India/Razorpay users): Use INR price directly
      // price is stored in rupees (e.g., 100 = ₹100, not ₹1.00)
      if (currency === 'INR') {
        const price = typeof pkg.price === 'string' 
          ? parseFloat(pkg.price) 
          : Number(pkg.price);
        converted[pkg.id] = isNaN(price) ? 0 : price;
        continue;
      }

      // Fallback for other currencies (shouldn't happen)
      const price = typeof pkg.price === 'string' 
        ? parseFloat(pkg.price) 
        : Number(pkg.price);
      converted[pkg.id] = isNaN(price) ? 0 : price;
    }
    setConvertedPrices(converted);
  }, [currency, packages, currencyLoading, currencyUpdateTrigger]); // Added currencyUpdateTrigger to force updates

  // Listen for currency changes from CurrencyToggle (same tab)
  // Force re-calculation when currency changes via custom event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCurrencyChange = () => {
      // Force re-calculation by incrementing trigger
      // This ensures the price conversion useEffect runs again with updated currency
      setCurrencyUpdateTrigger(prev => prev + 1);
    };
    
    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []); // Empty deps - just listen for events

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

    try {
      setLoading(packageId);
      // Show processing dialog
      setProcessingDialog({ open: true, message: 'Please wait while process is being started...' });

      // ✅ MIGRATED: Use server action instead of API route
      const { createPaymentOrderAction } = await import('@/lib/actions/payment.actions');
      const orderResult = await createPaymentOrderAction(packageId, currency);

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const { orderId, amount, currency: orderCurrency, checkoutUrl } = orderResult.data;

      // Check if this is a Paddle checkout (has checkoutUrl)
      if (checkoutUrl) {
        // Paddle hosted checkout - redirect to checkout URL
        setProcessingDialog({ open: false, message: '' });
        window.location.href = checkoutUrl;
        return;
      }

      // Razorpay checkout - continue with existing flow
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Payment gateway is not configured. Please contact support.');
        console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
        setLoading(null);
        setProcessingDialog({ open: false, message: '' });
        return;
      }

      // Check if Razorpay SDK is available
      if (!Razorpay || typeof window === 'undefined') {
        if (razorpayLoading) {
          toast.info('Payment gateway is loading, please wait a moment...', { duration: 3000 });
        } else {
          toast.error('Payment gateway is not available. Please refresh the page.', { duration: 5000 });
        }
        setLoading(null);
        setProcessingDialog({ open: false, message: '' });
        return;
      }

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
            // CRITICAL: Close Razorpay modal and processing dialog FIRST
            // This ensures the verification dialog is visible immediately
            if (razorpayInstanceRef.current) {
              try {
                razorpayInstanceRef.current.close();
              } catch (e) {
                // Ignore errors when closing
              }
              razorpayInstanceRef.current = null;
            }
            setRazorpayOpen(false);
            setProcessingDialog({ open: false, message: '' });
            
            // Show verification dialog IMMEDIATELY - user needs feedback right away
            setVerificationDialog({ open: true, message: 'Payment successful! Verifying your payment...' });
            
            // Small delay to ensure UI updates (dialog becomes visible)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Log the response to debug field names
            console.log('🔍 Razorpay handler response:', response);
            
            // Razorpay response can have either format:
            // - razorpay_order_id, razorpay_payment_id, razorpay_signature (newer)
            // - order_id, payment_id, signature (older)
            const orderId = response.razorpay_order_id || response.order_id;
            const paymentId = response.razorpay_payment_id || response.payment_id;
            const signature = response.razorpay_signature || response.signature;
            
            // Ensure all required Razorpay fields are present
            if (!orderId || !paymentId || !signature) {
              console.error('❌ Missing Razorpay fields:', {
                orderId: !!orderId,
                paymentId: !!paymentId,
                signature: !!signature,
                responseKeys: Object.keys(response),
                fullResponse: response
              });
              throw new Error('Missing Razorpay payment verification data');
            }

            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({ error: 'Payment verification failed' }));
              throw new Error(errorData.error || `Payment verification failed: ${verifyResponse.status}`);
            }

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              // Update dialog message to show success before redirect
              setVerificationDialog({ open: true, message: 'Payment verified! Redirecting to success page...' });
              setLoading(null);
              
              // Small delay to show success message, then redirect
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // ✅ OPTIMIZED: Redirect immediately after showing success
              const orderId = response.razorpay_order_id || response.order_id;
              const paymentId = response.razorpay_payment_id || response.payment_id;
              window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId}&razorpay_order_id=${orderId}&razorpay_payment_id=${paymentId}`;
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
      
      // CRITICAL: Add payment failure handler
      // Note: Webhook will update order status to "failed", so we don't need to do it here
      razorpay.on('payment.failed', async (response: any) => {
        console.error('❌ Razorpay payment failed:', response);
        setLoading(null);
        setProcessingDialog({ open: false, message: '' });
        setVerificationDialog({ open: false, message: '' });
        razorpayInstanceRef.current = null; // Clear reference
        const errorDescription = response.error?.description || response.error?.reason || 'Unknown error';
        
        logger.log('🚫 Payment failed:', { orderId, error: errorDescription });
        
        toast.error(`Payment failed: ${errorDescription}`);
        // Redirect to failure page
        // Webhook will handle updating order status to "failed"
        window.location.href = `/payment/failure?razorpay_order_id=${orderId}&error_description=${encodeURIComponent(errorDescription)}`;
      });
      
      // CRITICAL: Close processing dialog BEFORE opening Razorpay iframe
      // This prevents dialog from blocking interaction with Razorpay
      setProcessingDialog({ open: false, message: '' });
      
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
    <div className="space-y-4">
      {/* Sort packages by display_order */}
      {/* ✅ OPTIMIZED: Memoize sorted packages to avoid recalculating on every render */}
      {useMemo(() => {
        const sortedPackages = [...packages].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        return (
          <div className="grid grid-cols-4 gap-4">
            {sortedPackages.slice(0, 8).map((pkg) => {
              const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
              // Calculate price per credit: price / totalCredits
              // Use the converted price (USD or INR) for accurate calculation
              const packagePrice = convertedPrices[pkg.id] || (currency === 'USD' && pkg.paddlePriceUSD ? parseFloat(pkg.paddlePriceUSD) : parseFloat(pkg.price));
              const pricePerCredit = totalCredits > 0 ? packagePrice / totalCredits : 0;

              return (
                <GradientCard
                  key={pkg.id}
                  title={pkg.name}
                  description={
                    <>
                      {pkg.description || undefined}
                      {pkg.pricingTier === 'bulk' && (
                        <span className="block mt-1 text-[hsl(72,87%,62%)] text-xs font-semibold">
                          Best Value
                        </span>
                      )}
                    </>
                  }
                  isPopular={pkg.isPopular}
                  className="h-full"
                  glowColor="rgba(209, 242, 74, 0.7)"
                >
                  {/* Credits and Pricing Information - Compact layout */}
                  <div className="space-y-1 mb-2">
                    {/* Credits */}
                    <div className="text-center">
                      <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[hsl(0,0%,7%)]'}`}>
                        {formatNumberCompact(Number(totalCredits) || 0)} <span className="text-sm font-normal">Credits</span>
                      </div>
                      {pkg.bonusCredits > 0 && (
                        <div className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatNumberCompact(Number(pkg.credits) || 0)} + <span className="text-[hsl(72,87%,62%)]">{formatNumberCompact(Number(pkg.bonusCredits) || 0)} bonus</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="text-center">
                      <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[hsl(0,0%,7%)]'}`}>
                        {currencyLoading || !convertedPrices[pkg.id] 
                          ? '...' 
                          : formatCurrencyCompact(convertedPrices[pkg.id], currency)}
                      </div>
                    </div>
                  </div>

                  {/* Buy Now Button */}
                  <div className="space-y-0.5">
                    <Button
                      className="w-full bg-[hsl(72,87%,62%)] text-[hsl(0,0%,7%)] hover:bg-[hsl(72,87%,55%)] font-semibold text-sm flex flex-col items-center justify-center py-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg.id, pkg);
                      }}
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
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : razorpayLoading || !razorpayLoaded ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <span>Buy Now</span>
                          {!currencyLoading && convertedPrices[pkg.id] && (
                            <span className="text-[8px] font-normal opacity-75 leading-tight">
                              {formatCurrencyCompact(pricePerCredit, currency)}/credit
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    {/* Show savings for bulk packages below button */}
                    {pkg.pricingTier === 'bulk' && (() => {
                      const savings = calculateSavings(Number(totalCredits), pricePerCredit);
                      if (savings.percentage > 0) {
                        return (
                          <div className="text-[10px] text-[hsl(72,87%,62%)] font-semibold text-center">
                            Save {savings.percentage.toFixed(0)}%
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </GradientCard>
              );
            })}
          </div>
        );
      }, [packages, isDarkMode, currencyLoading, convertedPrices, currency, loading, razorpayLoaded, razorpayLoading, handlePurchase])}


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
              
              /* CRITICAL: Ensure verification dialog is always on top of everything */
              [data-verification-dialog="true"] {
                z-index: 9999 !important;
                position: fixed !important;
              }
              
              /* Ensure overlay for verification dialog is also on top */
              [data-slot="dialog-overlay"]:has(+ [data-slot="dialog-content"][data-verification-dialog="true"]) {
                z-index: 9998 !important;
              }
            `,
          }}
        />
      )}
      
      {/* Additional style for verification dialog z-index - ensure it's always on top */}
      {verificationDialog.open && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Force verification dialog overlay to be on top of everything */
              [data-slot="dialog-overlay"] {
                z-index: 9998 !important;
                position: fixed !important;
              }
              
              /* Force verification dialog content to be on top of everything */
              [data-verification-dialog="true"],
              [data-slot="dialog-content"][data-verification-dialog="true"] {
                z-index: 9999 !important;
                position: fixed !important;
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

      {/* Verification Dialog - shows immediately after payment */}
      <Dialog 
        open={verificationDialog.open} 
        onOpenChange={(open) => {
          // Prevent closing during verification - user must wait
          if (!open && verificationDialog.open) {
            // Only allow closing if verification is complete (check if message contains "Redirecting")
            if (verificationDialog.message.includes('Redirecting')) {
              setVerificationDialog({ open: false, message: '' });
            }
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md" 
          data-verification-dialog="true"
          style={{ zIndex: 9999 }}
          onPointerDownOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Processing Payment</DialogTitle>
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

