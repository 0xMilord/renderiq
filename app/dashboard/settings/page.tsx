import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/profile/profile-settings';
import { NotificationSettings } from '@/components/profile/notification-settings';
import { RenderSettings } from '@/components/profile/render-settings';
import { SecuritySettings } from '@/components/profile/security-settings';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="renders">Render Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Suspense fallback={<div>Loading profile settings...</div>}>
              <ProfileSettings />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Suspense fallback={<div>Loading notification settings...</div>}>
              <NotificationSettings />
            </Suspense>
          </TabsContent>

          <TabsContent value="renders" className="space-y-6">
            <Suspense fallback={<div>Loading render settings...</div>}>
              <RenderSettings />
            </Suspense>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Suspense fallback={<div>Loading security settings...</div>}>
              <SecuritySettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
