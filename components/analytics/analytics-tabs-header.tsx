'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, CreditCard, Zap, Database, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalyticsTabsHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'overview';

  if (pathname !== '/dashboard/analytics') {
    return null;
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'renders', label: 'Renders', icon: TrendingUp },
    { value: 'credits', label: 'Credits', icon: CreditCard },
    { value: 'api', label: 'API', icon: Zap },
    { value: 'storage', label: 'Storage', icon: Database },
    { value: 'projects', label: 'Projects', icon: FolderOpen },
  ];

  return (
    <div className="flex items-center gap-1 ml-4 border rounded-md p-1 bg-muted/50">
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
              'flex items-center gap-2',
              isActive && 'bg-background shadow-sm'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

