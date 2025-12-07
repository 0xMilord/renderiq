import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/profile/profile-settings';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { RenderSettings } from '@/components/profile/render-settings';
import { SecuritySettings } from '@/components/profile/security-settings';

export default function ProfileSettingsPage() {
  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs defaultValue="profile" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="renders">Render Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

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
      </div>
    </div>
  );
}
