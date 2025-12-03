'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Zap, Crown, Building2, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useCurrency } from '@/lib/hooks/use-currency';
import { useRazorpaySDK } from '@/lib/hooks/use-razorpay-sdk';
import { logger } from '@/lib/utils/logger';

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
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string; planId?: string }>({ open: false, message: '' });
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  const { currency, currencyInfo, exchangeRate, format, convert, loading: currencyLoading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});
  
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

  const filteredPlans = plans.filter((plan) => {
    // Filter by billing interval
    const matchesInterval = billingInterval === 'year' ? plan.interval === 'year' : plan.interval === 'month';
    // Exclude free plans
    const isNotFree = plan.name?.toLowerCase() !== 'free' && parseFloat(plan.price) > 0;
    return matchesInterval && isNotFree;
  });

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(planId);
      
      // Create subscription via API
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const result = await response.json();

      if (!result.success) {
        // Handle duplicate subscription error
        if (result.hasExistingSubscription || result.hasPendingSubscription) {
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
              if (verifyResult.data?.activated && verifyResult.data?.creditsAdded) {
                toast.success(`Payment successful! ${verifyResult.data.newBalance || ''} credits added.`);
                // Redirect to success page
                setTimeout(() => {
                  window.location.href = `/payment/success?payment_order_id=${verifyResult.data.paymentOrderId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id}`;
                }, 1500);
              } else if (verifyResult.data?.alreadyActive) {
                toast.success('Payment successful! Subscription is already active.');
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else if (verifyResult.data?.status) {
                toast.info(verifyResult.data.message || 'Payment is processing. Credits will be added shortly.');
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              } else {
                toast.success('Payment successful!');
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }
            } else {
              // CRITICAL: Even if verification fails, redirect to success page
              // Webhook will handle the actual payment processing
              logger.warn('⚠️ Payment verification failed but payment was successful. Redirecting to success page - webhook will handle.');
              toast.warning('Payment successful, but verification is pending. Credits will be added via webhook shortly.');
              
              // Redirect to success page with available IDs
              setTimeout(() => {
                const successUrl = `/payment/success?payment_order_id=${result.data.subscriptionId || ''}&razorpay_subscription_id=${response.razorpay_subscription_id || result.data.subscriptionId}&razorpay_payment_id=${response.razorpay_payment_id || ''}&verification=pending`;
                window.location.href = successUrl;
              }, 2000);
            }
          } catch (error: any) {
            console.error('Error in payment success handler:', error);
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
            toast.info('Payment cancelled');
          },
          escape: true,
          animation: true,
        },
      };

      const razorpayInstance = new Razorpay(options);
      
      // CRITICAL: Add payment failure handler to prevent users being marked pro on failure
      razorpayInstance.on('payment.failed', async (response: any) => {
        console.error('Payment failed:', response);
        setLoading(null);
        const errorDescription = response.error?.description || 'Unknown error';
        
        // IMPORTANT: Cancel/delete the pending subscription to prevent user being marked pro
        try {
          const cancelResponse = await fetch('/api/payments/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: result.data.subscriptionId,
            }),
          });
          
          if (!cancelResponse.ok) {
            console.error('Failed to cancel subscription after payment failure');
          }
        } catch (error) {
          console.error('Error cancelling subscription:', error);
        }
        
        toast.error(`Payment failed: ${errorDescription}`);
        // Redirect to failure page
        window.location.href = `/payment/failure?razorpay_subscription_id=${result.data.subscriptionId}&error_description=${encodeURIComponent(errorDescription)}`;
      });

      razorpayInstance.open();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
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
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const Icon = planIcons[plan.name.toLowerCase().replace(' ', '-')] || Zap;
          const priceInINR = parseFloat(plan.price);
          const convertedPrice = convertedPrices[plan.id] || (currency === 'INR' ? priceInINR : priceInINR * exchangeRate);
          const monthlyPrice = plan.interval === 'year' ? convertedPrice / 12 : convertedPrice;
          const annualPrice = plan.interval === 'year' ? convertedPrice : convertedPrice * 12;
          const savings = plan.interval === 'year' ? Math.round((1 - convertedPrice / annualPrice) * 100) : 0;

          // Check if this is the user's current plan
          const isCurrentPlan = userSubscription?.subscription?.planId === plan.id;
          const hasActiveSubscription = userSubscription?.subscription?.status === 'active';
          const hasPendingSubscription = userSubscription?.subscription?.status === 'pending';
          const currentPlanPrice = userSubscription?.plan ? parseFloat(userSubscription.plan.price) : 0;
          const isUpgrade = hasActiveSubscription && !isCurrentPlan && parseFloat(plan.price) > currentPlanPrice;
          const isDowngrade = hasActiveSubscription && !isCurrentPlan && parseFloat(plan.price) < currentPlanPrice;

          return (
            <Card key={plan.id} className="relative">
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}
              {hasPendingSubscription && isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-yellow-500 text-white">
                    Payment Pending
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-foreground">
                      {currencyLoading || !convertedPrices[plan.id] 
                        ? '...' 
                        : format(convertedPrices[plan.id] || parseFloat(plan.price))}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      /{plan.interval}
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-500 mt-1">
                      Save {savings}% with annual billing
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {currencyLoading || !convertedPrices[plan.id]
                      ? '...'
                      : `${format(monthlyPrice)}/month`}
                  </p>
                </div>

                {/* Credits */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {plan.creditsPerMonth.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">credits per month</div>
                </div>

                {/* Features */}
                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Limits */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Max Projects:</span>
                    <span className="font-medium">
                      {plan.maxProjects ? plan.maxProjects.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renders per Project:</span>
                    <span className="font-medium">
                      {plan.maxRendersPerProject ? plan.maxRendersPerProject.toLocaleString() : 'Unlimited'}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    loading === plan.id || 
                    !razorpayLoaded || 
                    razorpayLoading || 
                    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 
                    parseFloat(plan.price) === 0 ||
                    (isCurrentPlan && hasActiveSubscription) ||
                    hasPendingSubscription
                  }
                  variant={isCurrentPlan && hasActiveSubscription ? 'outline' : 'default'}
                  title={
                    isCurrentPlan && hasActiveSubscription
                      ? 'This is your current plan'
                      : hasPendingSubscription
                      ? 'You have a pending subscription. Please wait for payment to complete.'
                      : !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
                      ? 'Payment gateway not configured' 
                      : razorpayLoading || !razorpayLoaded
                        ? 'Payment gateway is loading...' 
                        : undefined
                  }
                >
                  {loading === plan.id ? (
                    'Processing...'
                  ) : razorpayLoading || !razorpayLoaded ? (
                    'Loading...'
                  ) : isCurrentPlan && hasActiveSubscription ? (
                    'Current Plan'
                  ) : hasPendingSubscription && isCurrentPlan ? (
                    'Payment Pending'
                  ) : isUpgrade ? (
                    'Upgrade Plan'
                  ) : isDowngrade ? (
                    'Downgrade Plan'
                  ) : parseFloat(plan.price) === 0 ? (
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
    </div>
  );
}

