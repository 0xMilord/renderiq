'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Video, Zap, TrendingUp } from 'lucide-react';

interface ProfileStatsProps {
  stats?: {
    totalProjects: number;
    totalRenders: number;
    creditsUsed: number;
    creditsRemaining: number;
    averageRenderTime: number;
    favoriteStyle: string;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const defaultStats = {
    totalProjects: 0,
    totalRenders: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
    averageRenderTime: 0,
    favoriteStyle: 'Modern',
  };

  const userStats = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Image className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            +2 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Renders</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.totalRenders}</div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.creditsUsed}</div>
          <p className="text-xs text-muted-foreground">
            {userStats.creditsRemaining} remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Render Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats.averageRenderTime}s</div>
          <p className="text-xs text-muted-foreground">
            Favorite style: {userStats.favoriteStyle}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
