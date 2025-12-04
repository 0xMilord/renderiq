import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { BillingOverview } from '@/components/billing/billing-overview';
import { PlanTicketCard } from '@/components/billing/plan-ticket-card';
import { RecentTransactionsPaginated } from '@/components/billing/recent-transactions-paginated';
import { RecentPaymentsPaginated } from '@/components/billing/recent-payments-paginated';
import { BillingHistoryTable } from '@/components/billing/billing-history-table';
import { InvoicesList } from '@/components/billing/invoices-list';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Billing & Subscription | Renderiq - Manage Your Plan & Credits",
  description: "Manage your Renderiq subscription, view billing history, track credit usage, and download invoices. Manage your plan and payment methods.",
  openGraph: {
    title: "Billing & Subscription | Renderiq - Manage Your Plan & Credits",
    description: "Manage your Renderiq subscription, view billing history, track credit usage, and download invoices.",
    type: "website",
    url: `${siteUrl}/dashboard/billing`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/billing.jpg`,
        width: 1200,
        height: 630,
        alt: "Billing & Subscription - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Billing & Subscription | Renderiq",
    description: "Manage your Renderiq subscription, view billing history, and track credit usage.",
    images: [`${siteUrl}/og/billing.jpg`],
    creator: "@Renderiq",
  },
};

export default function BillingPage() {
  return (
    <div className="h-full">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Row 1: Plan Ticket Card (3/4) + Account Overview (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="text-muted-foreground text-sm">Loading plan info...</div>}>
                <PlanTicketCard />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="text-muted-foreground text-sm">Loading overview...</div>}>
                <BillingOverview />
              </Suspense>
            </div>
          </div>

          {/* Row 2: Recent Payments (1/2) + Recent Transactions (1/2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading payments...</div>}>
              <RecentPaymentsPaginated />
            </Suspense>
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading transactions...</div>}>
              <RecentTransactionsPaginated />
            </Suspense>
          </div>

          {/* Row 3: Billing History Table (3/4) + Recent Invoices (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="text-muted-foreground text-sm">Loading billing history...</div>}>
                <BillingHistoryTable />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="text-muted-foreground text-sm">Loading invoices...</div>}>
                <InvoicesList />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
