import { Suspense } from 'react';
import { SettingsClient } from './settings-client';

export default function ProfileSettingsPage() {
  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading settings...</div>}>
          <SettingsClient />
        </Suspense>
      </div>
    </div>
  );
}
