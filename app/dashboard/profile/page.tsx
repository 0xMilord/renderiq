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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common profile management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/profile/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/profile/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Subscription
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Suspense fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest architectural projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
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
