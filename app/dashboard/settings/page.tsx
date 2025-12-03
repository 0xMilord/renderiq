import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/profile/profile-settings';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { RenderSettings } from '@/components/profile/render-settings';
import { SecuritySettings } from '@/components/profile/security-settings';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm py-2 sm:py-1.5">Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm py-2 sm:py-1.5">Notifications</TabsTrigger>
            <TabsTrigger value="renders" className="text-xs sm:text-sm py-2 sm:py-1.5">Render Settings</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm py-2 sm:py-1.5">Security</TabsTrigger>
          </TabsList>

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
