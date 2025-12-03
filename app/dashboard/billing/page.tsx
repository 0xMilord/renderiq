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
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your subscription, credits, and billing information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading subscription...</div>}>
              <SubscriptionCard />
            </Suspense>
            
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading credits...</div>}>
              <CreditsCard />
            </Suspense>

            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading payments...</div>}>
              <RecentPayments />
            </Suspense>

            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading transactions...</div>}>
              <RecentTransactions />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading overview...</div>}>
              <BillingOverview />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Payment methods are managed through Razorpay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 border border-border rounded-lg bg-muted/50">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Payment methods are securely stored and managed by Razorpay. 
                    When you make a payment, your payment method will be saved for future use.
                  </p>
                </div>
                
                <Button variant="outline" className="w-full text-sm" asChild>
                  <Link href="/pricing">
                    <CreditCard className="h-4 w-4 mr-2 shrink-0" />
                    Make a Payment
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading invoices...</div>}>
              <InvoicesList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
