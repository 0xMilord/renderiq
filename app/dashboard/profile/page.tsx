import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Settings, Bell, CreditCard, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileStats } from '@/components/profile/profile-stats';
import { RecentActivity } from '@/components/profile/recent-activity';
import { RecentProjectsSection } from '@/components/profile/recent-projects-section';

export default function ProfilePage() {
  return (
    <div className="h-full">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Suspense fallback={<div>Loading profile...</div>}>
              <ProfileHeader />
            </Suspense>
            
            <Suspense fallback={<div>Loading stats...</div>}>
              <ProfileStats />
            </Suspense>

            <Suspense fallback={<div>Loading activity...</div>}>
              <RecentActivity />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Common profile management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button asChild variant="outline" className="w-full justify-start text-sm">
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4 mr-2 shrink-0" />
                    Account Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start text-sm">
                  <Link href="/dashboard/settings#notifications">
                    <Bell className="h-4 w-4 mr-2 shrink-0" />
                    Notifications
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start text-sm">
                  <Link href="/dashboard/billing">
                    <CreditCard className="h-4 w-4 mr-2 shrink-0" />
                    Billing & Subscription
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Suspense fallback={
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Recent Projects</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your latest architectural projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-border rounded-lg bg-card">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted animate-pulse rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                          <div className="h-3 sm:h-4 w-24 sm:w-32 bg-muted animate-pulse rounded" />
                          <div className="h-2 sm:h-3 w-16 sm:w-24 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            }>
              <RecentProjectsSection />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
