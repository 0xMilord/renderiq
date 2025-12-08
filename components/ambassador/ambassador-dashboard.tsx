'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAmbassadorDashboardAction } from '@/lib/actions/ambassador.actions';
import { AmbassadorStatsCards } from './stats-cards';
import { CustomLinksManager } from './custom-links-manager';
import { CommissionHistory } from './commission-history';
import { PayoutHistory } from './payout-history';
import { ReferralList } from './referral-list';
import { AmbassadorApplicationForm } from './application-form';
import { PendingReview } from './pending-review';
import { AmbassadorFeatures } from './ambassador-features';
import type { Ambassador } from '@/lib/db/schema';

interface AmbassadorDashboardProps {
  initialAmbassador: Ambassador | null;
  initialDashboardData?: {
    ambassador: Ambassador;
    stats: any;
    links: any[];
    referrals: any[];
    commissions: any[];
    payouts: any[];
  } | null;
}

export function AmbassadorDashboard({ initialAmbassador, initialDashboardData }: AmbassadorDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ambassador, setAmbassador] = useState(initialAmbassador);
  const [dashboardData, setDashboardData] = useState(initialDashboardData || null);

  // Only fetch if we have an ambassador but no initial data
  useEffect(() => {
    if (!initialAmbassador) {
      // No ambassador record, show application form
      return;
    }

    // If we already have initial data, use it
    if (initialDashboardData) {
      setDashboardData(initialDashboardData);
      setAmbassador(initialDashboardData.ambassador);
      return;
    }

    // Otherwise fetch fresh data
    async function fetchDashboard() {
      try {
        setLoading(true);
        const result = await getAmbassadorDashboardAction();
        if (result.success && result.data) {
          setDashboardData(result.data);
          setAmbassador(result.data.ambassador);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [initialAmbassador, initialDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show application form if no ambassador record
  if (!ambassador) {
    return (
      <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Application Form - 3/4 width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Apply to Become an Ambassador</CardTitle>
              <CardDescription>
                Join our ambassador program and start earning commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AmbassadorApplicationForm />
            </CardContent>
          </Card>
        </div>

        {/* Features Sidebar - 1/4 width */}
        <div className="lg:col-span-1">
          <AmbassadorFeatures />
        </div>
      </div>
    );
  }

  // Show status based on ambassador status
  const getStatusBadge = () => {
    switch (ambassador.status) {
      case 'rejected':
        return (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your application was rejected. {ambassador.rejectedReason && `Reason: ${ambassador.rejectedReason}`}
            </AlertDescription>
          </Alert>
        );
      case 'active':
        return (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your ambassador account is active! Start sharing your referral links to earn commissions.
            </AlertDescription>
          </Alert>
        );
      case 'suspended':
        return (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your ambassador account has been suspended. Please contact support for more information.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const stats = dashboardData?.stats || {
    totalReferrals: 0,
    activeSubscribers: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    conversionRate: 0,
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
      {/* Main Content - 3/4 width */}
      <div className="lg:col-span-3 space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Ambassador Dashboard</h2>
              <Badge variant={ambassador.status === 'active' ? 'default' : 'secondary'}>
                {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
              </Badge>
            </div>
            <div className="space-y-1">
              {ambassador.code && (
                <p className="text-muted-foreground">
                  Your referral code: <code className="bg-muted px-2 py-1 rounded">{ambassador.code}</code>
                </p>
              )}
              {dashboardData?.volumeTier && (
                <p className="text-sm text-muted-foreground">
                  Current tier: <span className="font-medium">{dashboardData.volumeTier.tierName}</span> 
                  {' '}({dashboardData.volumeTier.discountPercentage}% discount for referrals)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Show pending review screen if pending */}
        {ambassador.status === 'pending' ? (
          <PendingReview applicationDate={ambassador.createdAt} />
        ) : (
          <>
            {getStatusBadge()}

            {/* Only show dashboard content if active */}
            {ambassador.status === 'active' ? (
              <>
                <AmbassadorStatsCards stats={stats} />

                <Tabs defaultValue="links" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="links">Custom Links</TabsTrigger>
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                  </TabsList>

                  <TabsContent value="links" className="space-y-4">
                    <CustomLinksManager
                      links={dashboardData?.links || []}
                      ambassadorCode={ambassador.code || ''}
                      onLinkCreated={async () => {
                        // Refresh dashboard data after link creation
                        const result = await getAmbassadorDashboardAction();
                        if (result.success && result.data) {
                          setDashboardData(result.data);
                        }
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="referrals" className="space-y-4">
                    <ReferralList referrals={dashboardData?.referrals || []} />
                  </TabsContent>

                  <TabsContent value="commissions" className="space-y-4">
                    <CommissionHistory commissions={dashboardData?.commissions || []} />
                  </TabsContent>

                  <TabsContent value="payouts" className="space-y-4">
                    <PayoutHistory payouts={dashboardData?.payouts || []} />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Your dashboard will be available once your application is approved.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Features Sidebar - 1/4 width */}
      <div className="lg:col-span-1">
        <AmbassadorFeatures />
      </div>
    </div>
  );
}

