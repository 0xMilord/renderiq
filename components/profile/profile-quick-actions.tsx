'use client';

import { Button } from '@/components/ui/button';
import { Settings, Bell, CreditCard } from 'lucide-react';
import Link from 'next/link';

export function ProfileQuickActions() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
        <Link href="/dashboard/settings">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
        <Link href="/dashboard/settings?tab=notifications">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
        <Link href="/dashboard/billing">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Billing</span>
        </Link>
      </Button>
    </div>
  );
}

