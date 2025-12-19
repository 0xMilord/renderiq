'use client';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/profile/profile-settings';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { RenderSettings } from '@/components/profile/render-settings';
import { SecuritySettings } from '@/components/profile/security-settings';
import { useSearchParams } from 'next/navigation';

export function SettingsClient() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsContent value="profile" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading profile settings...</div>}>
          <ProfileSettings />
        </Suspense>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading notification settings...</div>}>
          <NotificationSettings />
        </Suspense>
      </TabsContent>

      <TabsContent value="renders" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading render settings...</div>}>
          <RenderSettings />
        </Suspense>
      </TabsContent>

      <TabsContent value="security" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading security settings...</div>}>
          <SecuritySettings />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

