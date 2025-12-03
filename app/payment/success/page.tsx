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
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');

  useEffect(() => {
    if (!paymentOrderId) {
      toast.error('Invalid payment information');
      router.push('/pricing');
      return;
    }

    // Fetch payment details and receipt
    fetchPaymentDetails();
  }, [paymentOrderId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);

      // Get receipt URL
      const receiptResponse = await fetch(`/api/payments/receipt/${paymentOrderId}`);
      if (receiptResponse.ok) {
        const receiptData = await receiptResponse.json();
        if (receiptData.success && receiptData.data?.receiptUrl) {
          setReceiptUrl(receiptData.data.receiptUrl);
        }
      }

      // Get payment history to find this payment
      const historyResponse = await fetch('/api/payments/history?limit=1');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success && historyData.data?.payments?.[0]) {
          setPaymentData(historyData.data.payments[0]);
        }
      }

      setLoading(false);
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
          <p className="text-muted-foreground">Loading payment details...</p>
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

