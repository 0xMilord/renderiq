'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const paymentOrderId = searchParams.get('payment_order_id');
  const razorpayOrderId = searchParams.get('razorpay_order_id');
  const razorpaySubscriptionId = searchParams.get('razorpay_subscription_id');
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  // Handle both paddle_transaction_id and _ptxn (Paddle's redirect parameter)
  const paddleTransactionId = searchParams.get('paddle_transaction_id') || searchParams.get('_ptxn');
  const paddleSubscriptionId = searchParams.get('paddle_subscription_id');
  const verification = searchParams.get('verification');

  useEffect(() => {
    // Allow access if we have at least one payment identifier (Razorpay or Paddle)
    if (!paymentOrderId && !razorpayOrderId && !razorpaySubscriptionId && !razorpayPaymentId && !paddleTransactionId && !paddleSubscriptionId) {
      toast.error('Invalid payment information');
      router.push('/pricing');
      return;
    }

    // If verification is pending, check subscription status once (webhook will handle the rest)
    if (verification === 'pending' && razorpaySubscriptionId) {
      // Check subscription status once - webhook will handle activation
      checkSubscriptionStatus();
    } else {
      // Fetch payment details and receipt
      fetchPaymentDetails();
    }
  }, [paymentOrderId, razorpayOrderId, razorpaySubscriptionId, razorpayPaymentId, verification]);

  const checkSubscriptionStatus = async () => {
    try {
      // Check subscription status once - webhook will handle activation
      const verifyResponse = await fetch('/api/payments/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: razorpaySubscriptionId,
        }),
      });
      
      const verifyResult = await verifyResponse.json();
      
      // If subscription is already active, show success
      if (verifyResult.success && (verifyResult.data?.alreadyActive || verifyResult.data?.activated)) {
        // Try to get payment order ID from subscription
        if (razorpaySubscriptionId) {
          // ✅ MIGRATED: Use server action instead of API route
          const { getPaymentOrderBySubscriptionAction } = await import('@/lib/actions/payment.actions');
          const paymentData = await getPaymentOrderBySubscriptionAction(razorpaySubscriptionId);
          if (paymentData.success && paymentData.data?.id) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('payment_order_id', paymentData.data.id);
            newUrl.searchParams.delete('verification');
            window.history.replaceState({}, '', newUrl.toString());
            fetchPaymentDetails();
            return;
          }
        }
        // If we can't get payment order, just show success without receipt
        setLoading(false);
        return;
      }
      
      // If not active yet, webhook will handle it - show message
      setLoading(false);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);

      // ✅ MIGRATED: Use server action instead of API route
      if (paymentOrderId) {
        // We have payment order ID - fetch payment first (required), receipt in parallel (optional)
        const { getPaymentOrderAction, getReceiptAction } = await import('@/lib/actions/payment.actions');
        const paymentData = await getPaymentOrderAction(paymentOrderId);
        
        if (paymentData.success && paymentData.data) {
          setPaymentData(paymentData.data);
          setLoading(false); // Show page immediately with payment data
        } else {
          // Payment data not found or invalid - still show success page
          console.warn('Payment data not found or invalid:', paymentData);
          setLoading(false);
        }

        // ✅ MIGRATED: Fetch receipt in background using server action (non-blocking)
        getReceiptAction(paymentOrderId)
          .then(receiptData => {
            if (receiptData?.success && receiptData.data?.receiptUrl) {
              setReceiptUrl(receiptData.data.receiptUrl);
            }
          })
          .catch(err => console.error('Error fetching receipt:', err));
      } else if (razorpaySubscriptionId) {
        // ✅ MIGRATED: Use server action instead of API route
        const { getPaymentOrderBySubscriptionAction, getReceiptAction } = await import('@/lib/actions/payment.actions');
        const paymentData = await getPaymentOrderBySubscriptionAction(razorpaySubscriptionId);

        if (paymentData.success && paymentData.data) {
          const payment = paymentData.data;
          setPaymentData(payment);
          
          // Update URL with payment order ID if found
          if (payment.id) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('payment_order_id', payment.id);
            newUrl.searchParams.delete('verification');
            window.history.replaceState({}, '', newUrl.toString());
            
            setLoading(false); // Show page immediately with payment data
            
            // ✅ MIGRATED: Fetch receipt in background using server action (non-blocking)
            getReceiptAction(payment.id)
              .then(receiptData => {
                if (receiptData?.success && receiptData.data?.receiptUrl) {
                  setReceiptUrl(receiptData.data.receiptUrl);
                }
              })
              .catch(err => console.error('Error fetching receipt:', err));
          } else {
            setLoading(false);
          }
        } else {
          // ✅ MIGRATED: Fallback: try history using server action (less efficient but works)
          const { getPaymentHistoryAction, getReceiptAction } = await import('@/lib/actions/payment.actions');
          const historyData = await getPaymentHistoryAction({ limit: 10 });
          if (historyData.success && historyData.data?.payments) {
            const payment = historyData.data.payments.find((p: any) => 
              p.razorpaySubscriptionId === razorpaySubscriptionId || 
              (p.type === 'subscription' && p.status === 'completed')
            );
            if (payment) {
              setPaymentData(payment);
              if (payment.id) {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('payment_order_id', payment.id);
                newUrl.searchParams.delete('verification');
                window.history.replaceState({}, '', newUrl.toString());
                
                setLoading(false); // Show page immediately with payment data
                
                // ✅ MIGRATED: Fetch receipt in background using server action (non-blocking)
                getReceiptAction(payment.id)
                  .then(receiptData => {
                    if (receiptData?.success && receiptData.data?.receiptUrl) {
                      setReceiptUrl(receiptData.data.receiptUrl);
                    }
                  })
                  .catch(err => console.error('Error fetching receipt:', err));
              } else {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } else if (paddleTransactionId || paddleSubscriptionId) {
        // Paddle payment - try to get payment order by transaction/subscription ID
        const { getPaymentOrderBySubscriptionAction, getReceiptAction } = await import('@/lib/actions/payment.actions');
        
        // Try to find payment order by Paddle transaction/subscription ID
        const { getPaymentHistoryAction } = await import('@/lib/actions/payment.actions');
        const historyData = await getPaymentHistoryAction({ limit: 10 });
        
        if (historyData.success && historyData.data?.payments) {
          const payment = historyData.data.payments.find((p: any) => 
            p.paddleTransactionId === paddleTransactionId || 
            p.paddleSubscriptionId === paddleSubscriptionId ||
            (p.type === 'subscription' && p.status === 'completed' && p.paymentProvider === 'paddle')
          );
          
          if (payment) {
            setPaymentData(payment);
            if (payment.id) {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('payment_order_id', payment.id);
              window.history.replaceState({}, '', newUrl.toString());
              
              setLoading(false);
              
              getReceiptAction(payment.id)
                .then(receiptData => {
                  if (receiptData?.success && receiptData.data?.receiptUrl) {
                    setReceiptUrl(receiptData.data.receiptUrl);
                  }
                })
                .catch(err => console.error('Error fetching receipt:', err));
            } else {
              setLoading(false);
            }
          } else {
            // Payment verified but order details not yet available - webhook will update
            console.log('Paddle payment verified but order details not yet available. Webhook will update.');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else if (razorpayOrderId || razorpayPaymentId) {
        // We only have Razorpay IDs but no payment order ID yet
        // Payment was verified, so show success page even without full details
        // The payment order will be created/updated by the webhook
        console.log('Payment verified but order details not yet available. Webhook will update.');
        setLoading(false);
      } else {
        // No payment identifiers - should not reach here due to early return
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!paymentOrderId) {
      toast.error('Payment order ID not found');
      return;
    }

    try {
      // Fetch PDF with download parameter
      const response = await fetch(`/api/payments/receipt/${paymentOrderId}?download=true`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      // Verify content type is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf')) {
        console.warn('Unexpected content type:', contentType);
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Verify blob is actually a PDF
      if (blob.type && !blob.type.includes('pdf')) {
        console.warn('Blob type is not PDF:', blob.type);
      }
      
      const url = window.URL.createObjectURL(blob);
      
      // Create download link with proper attributes to force download
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${paymentOrderId}.pdf`;
      link.style.display = 'none';
      link.setAttribute('download', `receipt_${paymentOrderId}.pdf`);
      link.setAttribute('target', '_self'); // Ensure it doesn't open in new tab
      
      // Append to body
      document.body.appendChild(link);
      
      // Trigger download immediately
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Error downloading receipt. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Your payment has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          {paymentData && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {paymentData.currency || 'INR'} {parseFloat(paymentData.amount || '0').toFixed(2)}
                </span>
              </div>
              {paymentData.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Number:</span>
                  <span className="font-mono text-sm">{paymentData.invoiceNumber}</span>
                </div>
              )}
              {paymentData.referenceDetails && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">
                    {paymentData.referenceDetails.name || 'Credit Package'}
                  </span>
                </div>
              )}
              {paymentData.type === 'credit_package' && paymentData.referenceDetails && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits Added:</span>
                  <span className="font-semibold text-green-600">
                    +{(paymentData.referenceDetails.credits || 0) + (paymentData.referenceDetails.bonusCredits || 0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {paymentOrderId && (
              <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href="/dashboard/billing">
                View Billing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              A receipt has been sent to your email address.{' '}
              {paymentData?.type === 'credit_package' && (
                <span>Credits have been added to your account.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}


