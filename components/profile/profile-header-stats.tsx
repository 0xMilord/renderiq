'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen, Image, Zap, Clock } from 'lucide-react';
import { useProfileStats } from '@/lib/hooks/use-profile-stats';
import { cn } from '@/lib/utils';

export function ProfileHeaderStats() {
  const { stats, loading, error } = useProfileStats();

  if (loading) {
    return (
      <div className="flex items-center gap-3 ml-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-32" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  // Format average render time - display in seconds for consistency with user's example
  const formatRenderTime = (seconds: number) => {
    return `${Math.round(seconds)}s`;
  };

  const statsData = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      subtext: 'Active projects',
      icon: FolderOpen,
    },
    {
      label: 'Total Renders',
      value: stats.totalRenders,
      subtext: 'All time renders',
      icon: Image,
    },
    {
      label: 'Credits Used',
      value: stats.creditsUsed,
      subtext: `${stats.creditsRemaining} remaining`,
      icon: Zap,
    },
    {
      label: 'Avg. Render Time',
      value: formatRenderTime(stats.averageRenderTime),
      subtext: `Favorite style: ${stats.favoriteStyle.toLowerCase()}`,
      icon: Clock,
    },
  ];

  return (
    <div className="flex items-center gap-2 ml-auto">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="py-1 px-2 border-border/50 bg-card/50">
            <CardContent className="p-0 flex items-center gap-2">
              <div className={cn(
                "p-1 rounded-md",
                "bg-primary/10"
              )}>
                <Icon className="h-3 w-3 text-primary" />
              </div>
              <div className="flex flex-col min-w-0 gap-0">
                <div className="text-[10px] text-muted-foreground truncate">{stat.label}</div>
                <div className="text-sm font-semibold text-foreground truncate leading-tight">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground truncate leading-tight">{stat.subtext}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

