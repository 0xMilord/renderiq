'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');

  const razorpayOrderId = searchParams.get('razorpay_order_id');
  const paymentId = searchParams.get('razorpay_payment_id');

  useEffect(() => {
    if (razorpayOrderId) {
      setOrderId(razorpayOrderId);
    }
  }, [razorpayOrderId]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Your payment has been processed successfully. Your credits have been added to your account.
            </p>
            {orderId && (
              <p className="text-xs text-muted-foreground mt-2">
                Order ID: {orderId}
              </p>
            )}
            {paymentId && (
              <p className="text-xs text-muted-foreground">
                Payment ID: {paymentId}
              </p>
            )}
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <p className="text-sm font-medium">What's next?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your credits are now available in your account</li>
              <li>You can start using Renderiq immediately</li>
              <li>A confirmation email has been sent to your registered email address</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleContinue} className="flex-1">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team
              </p>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

