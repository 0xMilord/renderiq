'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Zap, Crown, Building2, Mail, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/lib/hooks/use-currency';
import { useRazorpaySDK } from '@/lib/hooks/use-razorpay-sdk';
import { logger } from '@/lib/utils/logger';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

// Helper function to format numbers (no compact formatting)
const formatNumberCompact = (num: number | string | null | undefined): string => {
  const number = typeof num === 'string' ? parseFloat(num) : (num || 0);
  const value = isNaN(number) ? 0 : number;
  return Math.round(value).toLocaleString();
};

// Helper function to format currency (no compact formatting)
const formatCurrencyCompact = (amount: number, currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];
  const symbol = currencyInfo.symbol;
  const formatted = Math.round(amount).toLocaleString();
  return `${symbol}${formatted}`;
};

const planIcons: Record<string, any> = {
  free: Zap,
  starter: Zap,
  pro: Crown,
  'pro-annual': Crown,
  enterprise: Building2,
  'enterprise-annual': Building2,
};

interface PricingPlansProps {
  plans: any[];
  userCredits?: any;
  userSubscription?: any;
}

export function PricingPlans({ plans, userCredits, userSubscription }: PricingPlansProps) {
  const [cardBillingInterval, setCardBillingInterval] = useState<Record<string, 'month' | 'year'>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string; planId?: string }>({ open: false, message: '' });
  const [processingDialog, setProcessingDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [verificationDialog, setVerificationDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [razorpayOpen, setRazorpayOpen] = useState(false); // Track if Razorpay iframe is open
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  const { currency, currencyInfo, exchangeRate, format, convert, loading: currencyLoading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});
  const razorpayInstanceRef = useRef<any>(null); // Prevent duplicate instances
  
  // Use simplified shared Razorpay SDK loader
  const { isLoaded: razorpayLoaded, isLoading: razorpayLoading, Razorpay } = useRazorpaySDK();


  // Convert plan prices when currency or exchange rate changes
  useEffect(() => {
    if (plans.length === 0 || currencyLoading || !exchangeRate) {
      return;
    }

    const converted: Record<string, number> = {};
    for (const plan of plans) {
      const priceInINR = parseFloat(plan.price);
      // Convert directly without using convert function to avoid dependency issues
      converted[plan.id] = currency === 'INR' ? priceInINR : priceInINR * exchangeRate;
    }
    setConvertedPrices(converted);
  }, [currency, exchangeRate, plans, currencyLoading]);

  // Monitor for Razorpay iframe and disable dialogs when it's open
  useEffect(() => {
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
  }, []);

  // Group plans by base name (without "Annual" suffix) and show monthly by default
  const groupedPlans = useMemo(() => {
    const groups: Record<string, { monthly?: any; annual?: any }> = {};
    
    plans.forEach((plan) => {
      // Extract base name (remove " Annual" suffix)
      const baseName = plan.name.replace(/\s+Annual$/, '').toLowerCase();
      
      if (!groups[baseName]) {
        groups[baseName] = {};
      }
      
      if (plan.interval === 'month') {
        groups[baseName].monthly = plan;
      } else if (plan.interval === 'year') {
        groups[baseName].annual = plan;
      }
    });
    
    return groups;
  }, [plans]);

  // Get plans to display - use monthly by default, or annual if selected for that card
  const filteredPlans = useMemo(() => {
    return Object.values(groupedPlans)
      .map((group) => {
        // Check if annual is selected for this plan group
        const planName = (group.monthly?.name || group.annual?.name || '').replace(/\s+Annual$/, '').toLowerCase();
        const selectedInterval = cardBillingInterval[planName] || 'month';
        
        if (selectedInterval === 'year' && group.annual) {
          return group.annual;
        }
        return group.monthly || group.annual;
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by price ascending (Free, Starter, Pro, Enterprise)
        const priceA = parseFloat(a.price || '0');
        const priceB = parseFloat(b.price || '0');
        return priceA - priceB;
      });
  }, [groupedPlans, cardBillingInterval]);

  // Collect all unique features from all plans for comparison table (use monthly plans for comparison)
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    Object.values(groupedPlans).forEach((group) => {
      const plan = group.monthly || group.annual;
      if (plan && plan.features && Array.isArray(plan.features)) {
        plan.features.forEach((feature: string) => featureSet.add(feature));
      }
    });
    // Add limits as separate features
    featureSet.add('Max Projects');
    featureSet.add('Renders per Project');
    return Array.from(featureSet).sort();
  }, [groupedPlans]);

  // Helper to get feature value for a plan
  const getPlanFeatureValue = (plan: any, feature: string): string | boolean => {
    // Check if it's a regular feature
    if (plan.features && Array.isArray(plan.features)) {
      if (plan.features.includes(feature)) {
        return true;
      }
    }
    
    // Handle special features
    if (feature === 'Max Projects') {
      if (plan.maxProjects === null || plan.maxProjects === undefined) {
        return 'Unlimited';
      }
      return plan.maxProjects.toString();
    }
    
    if (feature === 'Renders per Project') {
      if (plan.maxRendersPerProject === null || plan.maxRendersPerProject === undefined) {
        return 'Unlimited';
      }
      return plan.maxRendersPerProject.toString();
    }
    
    return false;
  };

  const handleSubscribe = async (planId: string) => {
    // Check if user is authenticated
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign up or log in to subscribe');
      setTimeout(() => {
        window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 1500);
      return;
    }

    try {
      setLoading(planId);
      // Show processing dialog
      setProcessingDialog({ open: true, message: 'Please wait while process is being started...' });
      
      // Determine if this is a plan change (upgrade/downgrade)
      // If user has active subscription and is selecting a different plan, it's a plan change
      const hasActiveSubscription = userSubscription?.subscription?.status === 'active';
      const isDifferentPlan = userSubscription?.subscription?.planId !== planId;
      const isPlanChange = hasActiveSubscription && isDifferentPlan; // Any plan change (upgrade or downgrade)
      
      // Get plan details for logging
      const newPlan = plans.find(p => p.id === planId);
      const currentPlanPrice = parseFloat(userSubscription?.plan?.price || '0');
      const newPlanPrice = parseFloat(newPlan?.price || '0');
      const isUpgrade = isPlanChange && newPlanPrice > currentPlanPrice;
      const isDowngrade = isPlanChange && newPlanPrice < currentPlanPrice;
      
      logger.log('🔄 Plan change detection:', {
        hasActiveSubscription,
        isDifferentPlan,
        currentPlanId: userSubscription?.subscription?.planId,
        newPlanId: planId,
        currentPlanName: userSubscription?.plan?.name,
        newPlanName: newPlan?.name,
        currentPlanPrice,
        newPlanPrice,
        isUpgrade,
        isDowngrade,
        isPlanChange,
      });
      
      // ✅ MIGRATED: Use server action instead of API route
      const { createPaymentSubscriptionAction } = await import('@/lib/actions/payment.actions');
      const result = await createPaymentSubscriptionAction(planId, isPlanChange);

      if (!result.success) {
        // Handle duplicate subscription error
        if (result.hasExistingSubscription) {
          toast.error(result.error || 'You already have a subscription');
          // Optionally redirect to billing page
          setTimeout(() => {
            window.location.href = '/dashboard/billing';
          }, 2000);
          return;
        }
        
        // Show detailed error message, especially for subscriptions not enabled
        if (result.requiresRazorpaySupport) {
          // Show user-friendly error dialog
          setErrorDialog({
            open: true,
            message: result.error || 'Subscriptions feature is not enabled on your Razorpay account.',
            planId: planId
          });
        } else {
          toast.error(result.error || 'Failed to create subscription');
        }
        return;
      }

      // Check if Razorpay key is configured
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Payment gateway is not configured. Please contact support.');
        console.error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
        setLoading(null);
        return;
      }

      // Check if Razorpay SDK is loaded
      if (!Razorpay || typeof window === 'undefined') {
        if (razorpayLoading) {
          toast.info('Payment gateway is loading, please wait...', { duration: 3000 });
        } else {
          toast.error('Payment gateway is not available. Please refresh the page.', { duration: 5000 });
        }
        setLoading(null);
        return;
      }

      // Initialize Razorpay checkout
      
      // Get base URL for logo
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'https://renderiq.io');
      const logoUrl = `${baseUrl}/logo.svg`; // Use SVG logo from public folder
      
      const options = {
        key: razorpayKey,
        subscription_id: result.data.subscriptionId,
        name: 'Renderiq',
        description: 'Subscription Plan',
        image: logoUrl, // Add logo to checkout
        handler: async (response: any) => {
          try {
            setLoading(null);
            setProcessingDialog({ open: false, message: '' });
            // Show verification dialog
            setVerificationDialog({ open: true, message: 'We are verifying your payment. Please wait...' });
            
            // Verify subscription payment with signature (like credit packages)
            // Response contains: razorpay_payment_id, razorpay_subscription_id, razorpay_signature
            toast.info('Verifying payment...', { duration: 2000 });
            
            const verifyResponse = await fetch('/api/payments/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscriptionId: response.razorpay_subscription_id || result.data.subscriptionId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              setVerificationDialog({ open: false, message: '' });
              if (verifyResult.data?.activated && verifyResult.data?.creditsAdded) {
                toast.success(`Payment successful! ${verifyResult.data.newBalance || ''} credits added.`);
                // ✅ OPTIMIZED: Redirect immediately without delay
                window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id}`;
              } else if (verifyResult.data?.alreadyActive) {
                toast.success('Payment successful! Subscription is already active.');
                // ✅ OPTIMIZED: Redirect immediately without delay
                window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id}`;
              } else if (verifyResult.data?.status) {
                toast.info(verifyResult.data.message || 'Payment is processing. Credits will be added shortly.');
                // ✅ OPTIMIZED: Redirect immediately without delay
                window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id}&verification=pending`;
              } else {
                toast.success('Payment successful!');
                setTimeout(() => {
                  window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id}`;
                }, 500);
              }
            } else {
              // CRITICAL: Even if verification fails, redirect to success page
              // Webhook will handle the actual payment processing
              logger.warn('⚠️ Payment verification failed but payment was successful. Redirecting to success page - webhook will handle.');
              toast.warning('Payment successful, but verification is pending. Credits will be added via webhook shortly.');
              setVerificationDialog({ open: false, message: '' });
              
              // Redirect to success page with available IDs
              setTimeout(() => {
                const successUrl = `/payment/success?payment_order_id=${result.data.subscriptionId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id || ''}&verification=pending`;
                window.location.href = successUrl;
              }, 500);
            }
          } catch (error: any) {
            console.error('Error in payment success handler:', error);
            setVerificationDialog({ open: false, message: '' });
            toast.error('Payment successful but there was an error. Please refresh the page.');
            setLoading(null);
          }
        },
        prefill: {
          email: userCredits?.email || '',
          name: userCredits?.name || '',
        },
        theme: {
          color: '#D1F24A', // Use neon green accent color
          backdrop_color: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
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
          escape: true,
          animation: true,
        },
      };

      // CRITICAL: Prevent duplicate Razorpay instances
      // Close any existing instance before creating a new one
      if (razorpayInstanceRef.current) {
        try {
          razorpayInstanceRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
        razorpayInstanceRef.current = null;
      }

      const razorpayInstance = new Razorpay(options);
      razorpayInstanceRef.current = razorpayInstance; // Store reference
      
      // CRITICAL: Close processing dialog BEFORE opening Razorpay iframe
      // This prevents dialog from blocking interaction with Razorpay
      setProcessingDialog({ open: false, message: '' });
      
      // Payment failure handler
      razorpayInstance.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response);
        setLoading(null);
        setProcessingDialog({ open: false, message: '' });
        setVerificationDialog({ open: false, message: '' });
        razorpayInstanceRef.current = null; // Clear reference
        const errorDescription = response.error?.description || 'Unknown error';
        
        // No database record exists yet, so nothing to cancel
        toast.error(`Payment failed: ${errorDescription}`);
        // Redirect to failure page
        window.location.href = `/payment/failure?razorpay_subscription_id=${result.data.subscriptionId}&error_description=${encodeURIComponent(errorDescription)}`;
      });

      // Small delay to ensure dialog closes before opening Razorpay iframe
      setTimeout(() => {
        // Open Razorpay checkout (only once)
        razorpayInstance.open();
      }, 100);
      
      // Apply styling to Razorpay modal after it opens
      setTimeout(() => {
        const styleRazorpayModal = () => {
          // Find Razorpay's modal overlay
          const overlays = Array.from(document.querySelectorAll('div[style*="position: fixed"]'))
            .filter((el: any) => {
              const style = window.getComputedStyle(el);
              const zIndex = parseInt(style.zIndex || '0');
              return zIndex > 1000 && el.querySelector('iframe');
            });
          
          overlays.forEach((overlay: any) => {
            // Style overlay
            overlay.style.backdropFilter = 'blur(8px)';
            overlay.style.backgroundColor = isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)';
            
            // Style modal container
            const modalContainer = overlay.querySelector('div');
            if (modalContainer) {
              modalContainer.style.backgroundColor = isDarkMode ? 'hsl(0 0% 7%)' : 'hsl(0 0% 100%)';
              modalContainer.style.borderRadius = '12px';
              modalContainer.style.maxWidth = '90vw';
              modalContainer.style.maxHeight = '90vh';
              modalContainer.style.width = '90vw';
              modalContainer.style.height = '90vh';
            }
            
            // Style iframe
            const iframe = overlay.querySelector('iframe');
            if (iframe) {
              iframe.style.borderRadius = '12px';
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              // Fix font issues - ensure proper font rendering
              iframe.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            }
          });
        };
        
        styleRazorpayModal();
        // Re-apply styles periodically in case modal is re-rendered
        const styleInterval = setInterval(styleRazorpayModal, 500);
        setTimeout(() => clearInterval(styleInterval), 10000); // Stop after 10 seconds
      }, 300);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      setProcessingDialog({ open: false, message: '' });
      setVerificationDialog({ open: false, message: '' });
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setLoading(null);
    }
  };

  if (filteredPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No subscription plans available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="text-left">
        <h2 className="text-xl font-bold mb-1">Subscription Plans</h2>
        <p className="text-xs text-muted-foreground">For unlimited usage and full feature access</p>
      </div>

      {/* Plans Grid - Always 4 columns on laptops and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => {
          const Icon = planIcons[plan.name.toLowerCase().replace(/\s+annual$/, '').replace(' ', '-')] || Zap;
          const planBaseName = plan.name.replace(/\s+Annual$/, '').toLowerCase();
          const planGroup = groupedPlans[planBaseName];
          const selectedInterval = cardBillingInterval[planBaseName] || 'month';
          
          const priceInINR = parseFloat(plan.price);
          const convertedPrice = convertedPrices[plan.id] || (currency === 'INR' ? priceInINR : priceInINR * exchangeRate);
          
          // Calculate prices for both intervals
          const monthlyPlan = planGroup?.monthly;
          const annualPlan = planGroup?.annual;
          const monthlyPrice = monthlyPlan ? (convertedPrices[monthlyPlan.id] || (currency === 'INR' ? parseFloat(monthlyPlan.price) : parseFloat(monthlyPlan.price) * exchangeRate)) : convertedPrice;
          const annualPrice = annualPlan ? (convertedPrices[annualPlan.id] || (currency === 'INR' ? parseFloat(annualPlan.price) : parseFloat(annualPlan.price) * exchangeRate)) : convertedPrice * 12;
          
          // Calculate savings for annual
          const savings = annualPlan && monthlyPlan ? Math.round((1 - (annualPrice / 12) / monthlyPrice) * 100) : 0;
          
          // Current plan price based on selected interval
          const currentPrice = selectedInterval === 'year' && annualPlan ? annualPrice : monthlyPrice;
          const currentPlan = selectedInterval === 'year' && annualPlan ? annualPlan : monthlyPlan || plan;

          // Check if this is the user's current plan
          const isCurrentPlan = userSubscription?.subscription?.planId === currentPlan.id;
          const hasActiveSubscription = userSubscription?.subscription?.status === 'active';
          const userPlanPrice = userSubscription?.plan ? parseFloat(userSubscription.plan.price) : 0;
          const isUpgrade = hasActiveSubscription && !isCurrentPlan && currentPrice > userPlanPrice;
          const isDowngrade = hasActiveSubscription && !isCurrentPlan && currentPrice < userPlanPrice;
          
          // Check if annual plan is available
          const hasAnnualOption = !!annualPlan;

          return (
            <Card key={plan.id} className="relative transition-all duration-300 hover:shadow-[0_-10px_100px_10px_rgba(209,242,74,0.25),0_0_20px_rgba(209,242,74,0.3)] hover:-translate-y-1 gap-0">
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && hasActiveSubscription && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{planBaseName.charAt(0).toUpperCase() + planBaseName.slice(1)}</CardTitle>
                    <CardDescription className="text-xs">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Billing Toggle on Card */}
                {hasAnnualOption && (
                  <div className="flex justify-center -mt-1">
                    <div className="bg-muted rounded-lg p-0.5">
                      <button
                        onClick={() => setCardBillingInterval({ ...cardBillingInterval, [planBaseName]: 'month' })}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          selectedInterval === 'month'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setCardBillingInterval({ ...cardBillingInterval, [planBaseName]: 'year' })}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          selectedInterval === 'year'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Annual
                        {savings > 0 && (
                          <span className="ml-1 text-green-500">({savings}% off)</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center flex-wrap gap-1">
                    <span className="text-lg sm:text-xl font-bold text-foreground">
                      {currencyLoading || !currentPrice
                        ? '...' 
                        : formatCurrencyCompact(currentPrice, currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      /{selectedInterval === 'year' ? 'year' : 'month'}
                    </span>
                  </div>
                  {selectedInterval === 'year' && savings > 0 && (
                    <p className="text-xs text-green-500 mt-1">
                      Save {savings}% vs monthly
                    </p>
                  )}
                  {selectedInterval === 'year' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {currencyLoading || !currentPrice
                        ? '...'
                        : `${formatCurrencyCompact(Math.round(currentPrice / 12), currency)}/month`}
                    </p>
                  )}
                </div>

                {/* Credits */}
                <div className="text-center p-2 bg-muted rounded-lg">
                  <div className="text-base sm:text-lg font-bold text-foreground">
                    {formatNumberCompact(Number(currentPlan.creditsPerMonth) || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">credits per month</div>
                </div>

                {/* Separator above button */}
                <div className="border-t border-border"></div>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(currentPlan.id)}
                  disabled={
                    loading === currentPlan.id || 
                    !razorpayLoaded || 
                    razorpayLoading || 
                    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 
                    parseFloat(currentPlan.price) === 0 ||
                    (isCurrentPlan && hasActiveSubscription)
                  }
                  variant={isCurrentPlan && hasActiveSubscription ? 'outline' : 'default'}
                  title={
                    isCurrentPlan && hasActiveSubscription
                      ? 'This is your current plan'
                      : !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
                      ? 'Payment gateway not configured' 
                      : razorpayLoading || !razorpayLoaded
                        ? 'Payment gateway is loading...' 
                        : undefined
                  }
                >
                  {loading === currentPlan.id ? (
                    'Processing...'
                  ) : razorpayLoading || !razorpayLoaded ? (
                    'Loading...'
                  ) : isCurrentPlan && hasActiveSubscription ? (
                    'Current Plan'
                  ) : isUpgrade ? (
                    'Upgrade Plan'
                  ) : isDowngrade ? (
                    'Downgrade Plan'
                  ) : parseFloat(currentPlan.price) === 0 ? (
                    'Get Started'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison Table - Show monthly plans for comparison */}
      {Object.keys(groupedPlans).length > 0 && allFeatures.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse bg-card text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-muted/50 z-10">Feature</th>
                  {Object.entries(groupedPlans).map(([baseName, group]) => {
                    const displayName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
                    return (
                      <th key={baseName} className="text-center px-2 py-2 font-semibold min-w-[100px]">
                        {displayName}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-foreground font-medium sticky left-0 bg-card z-10">{feature}</td>
                    {Object.values(groupedPlans).map((group, idx) => {
                      const plan = group.monthly || group.annual;
                      const featureValue = getPlanFeatureValue(plan, feature);
                      return (
                        <td key={idx} className="px-2 py-2 text-center">
                          {featureValue === true ? (
                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                          ) : typeof featureValue === 'string' ? (
                            <span className="font-medium text-foreground">{featureValue}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Razorpay Modal Styling */}
      {typeof window !== 'undefined' && (
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
              
              /* Style Razorpay iframe container - fix font and width issues */
              body > div[style*="position: fixed"]:has(iframe) iframe {
                border-radius: 12px !important;
                width: 100% !important;
                height: 100% !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              
              /* Fix Razorpay iframe content font rendering */
              body > div[style*="position: fixed"]:has(iframe) iframe * {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
            `,
          }}
        />
      )}

      {/* Error Dialog for Subscriptions Not Enabled */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Subscription Creation Failed</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Unable to create subscription. This could be due to plan not found, subscriptions feature not enabled, or account mode mismatch.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Troubleshooting Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>Verify Plan Exists:</strong> Check Razorpay Dashboard → Products → Plans
                  <br />
                  <span className="text-xs">Look for Plan ID: plan_Rn3lmBVjGI02dN</span>
                </li>
                <li>
                  <strong>Check Account Mode:</strong> Ensure you're using {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'} mode keys
                  <br />
                  <span className="text-xs">Plan IDs are different between test and live modes</span>
                </li>
                <li>
                  <strong>Verify Subscriptions Enabled:</strong> Look for "Subscriptions" section in Dashboard
                </li>
                <li>
                  <strong>Contact Support:</strong> If plan exists but still fails, contact Razorpay support
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Account Details:</h4>
              <div className="text-sm text-muted-foreground space-y-1 font-mono text-xs bg-muted p-2 rounded">
                <p>• Account Mode: {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'}</p>
                <p>• Plan ID: plan_Rn3lmBVjGI02dN</p>
                <p>• Plan Name: Pro</p>
                <p>• Dashboard: {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes('rzp_test') ? 'https://dashboard.razorpay.com/app/test' : 'https://dashboard.razorpay.com/app'}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                window.open('https://dashboard.razorpay.com', '_blank');
              }}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Razorpay Dashboard
            </Button>
            <Button
              onClick={() => {
                const subject = encodeURIComponent('Enable Subscriptions Feature');
                const body = encodeURIComponent(`Hi Razorpay Support,

I need to enable the Subscriptions/Recurring Payments feature on my Razorpay account.

Account Details:
- Mode: ${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'}
- Plan ID: plan_Rn3lmBVjGI02dN
- Plan Name: Pro

I'm trying to create subscriptions using the API but getting "URL not found" error (400).
Please enable the Subscriptions feature so I can use the subscriptions API.

Thank you!`);
                window.location.href = `mailto:support@razorpay.com?subject=${subject}&body=${body}`;
              }}
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

