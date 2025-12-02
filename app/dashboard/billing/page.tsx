import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { BillingOverview } from '@/components/billing/billing-overview';
import { SubscriptionCard } from '@/components/billing/subscription-card';
import { CreditsCard } from '@/components/billing/credits-card';
import { RecentTransactions } from '@/components/billing/recent-transactions';
import { RecentPayments } from '@/components/billing/recent-payments';
import { InvoicesList } from '@/components/billing/invoices-list';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">Manage your subscription, credits, and billing information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<div>Loading subscription...</div>}>
              <SubscriptionCard />
            </Suspense>
            
            <Suspense fallback={<div>Loading credits...</div>}>
              <CreditsCard />
            </Suspense>

            <Suspense fallback={<div>Loading payments...</div>}>
              <RecentPayments />
            </Suspense>

            <Suspense fallback={<div>Loading transactions...</div>}>
              <RecentTransactions />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Suspense fallback={<div>Loading overview...</div>}>
              <BillingOverview />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription>
                  Payment methods are managed through Razorpay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Payment methods are securely stored and managed by Razorpay. 
                    When you make a payment, your payment method will be saved for future use.
                  </p>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/pricing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make a Payment
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Suspense fallback={<div>Loading invoices...</div>}>
              <InvoicesList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
