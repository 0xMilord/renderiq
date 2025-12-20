'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Bell, Paintbrush, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

function SettingsTabsHeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  if (pathname !== '/dashboard/settings') {
    return null;
  }

  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value === 'profile') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'renders', label: 'Render Settings', icon: Paintbrush },
    { value: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="flex-1 flex items-center gap-1 border rounded-md p-1 bg-muted/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        return (
          <Button
            key={tab.value}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              isActive && 'bg-background shadow-sm'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

// ✅ FIX: Export wrapped component with Suspense boundary
export function SettingsTabsHeader() {
  return (
    <Suspense fallback={<div className="flex-1 h-10 bg-muted animate-pulse rounded shrink-0" />}>
      <SettingsTabsHeaderContent />
    </Suspense>
  );
}
