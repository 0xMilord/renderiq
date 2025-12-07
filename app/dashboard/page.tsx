import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderOpen, 
  Image, 
  CreditCard, 
  TrendingUp, 
  Clock,
  Users,
  Zap,
  Sparkles,
  Paintbrush
} from 'lucide-react';
import Link from 'next/link';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { BillingDAL } from '@/lib/dal/billing';
import { ActivityDAL } from '@/lib/dal/activity';
import { db } from '@/lib/db';
import { projects, renders } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { RecentProjectsPaginated } from '@/components/dashboard/recent-projects-paginated';
import { RecentActivityPaginated } from '@/components/dashboard/recent-activity-paginated';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { user } = await getCachedUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch dashboard data
  let recentProjects = [];
  let recentActivity = [];
  let totalProjects = 0;
  let totalRenders = 0;
  let completedRenders = 0;
  let userCredits = 0;
  
  try {
    // Fetch counts and recent items in parallel
    // Optimized: Removed redundant project count query - can be derived from projectsData.length
    const [
      projectsData,
      activityData,
      creditsData,
      renderCountResult
    ] = await Promise.all([
      ProjectsDAL.getByUserId(user.id, 100), // All projects for pagination
      ActivityDAL.getUserActivity(user.id, 100), // Unified activity feed (renders + likes)
      BillingDAL.getUserCreditsWithReset(user.id), // User credits
      // Get total render count and completed count in single query
      db.select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${renders.status} = 'completed')`
      })
        .from(renders)
        .where(eq(renders.userId, user.id))
    ]);

    recentProjects = projectsData || [];
    recentActivity = activityData || [];
    userCredits = creditsData?.balance || 0;
    // Derive project count from fetched data instead of separate query
    totalProjects = projectsData?.length || 0;
    totalRenders = renderCountResult[0]?.total || 0;
    completedRenders = renderCountResult[0]?.completed || 0;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Continue with default values if there's an error
  }

  const successRate = totalRenders > 0 ? Math.round((completedRenders / totalRenders) * 100) : 0;

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Quick Actions Ribbon */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-sm font-medium text-muted-foreground">Quick Actions:</span>
              <div className="h-4 w-px bg-border hidden sm:block" />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
              <Button asChild size="default" variant="default" className="flex-1 min-w-0">
                <Link href="/render" className="flex items-center justify-center">
                  <Sparkles className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Render</span>
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="relative flex-1 min-w-0">
                <Link href="/canvas" className="flex items-center justify-center">
                  <Paintbrush className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Canvas</span>
                  <span className="hidden sm:inline ml-1.5 text-[10px] font-medium opacity-60">ALPHA</span>
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="flex-1 min-w-0">
                <Link href="/dashboard/projects" className="flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Projects</span>
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="flex-1 min-w-0">
                <Link href="/dashboard/billing" className="flex items-center justify-center">
                  <CreditCard className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Billing</span>
                </Link>
              </Button>
              <Button asChild size="default" variant="outline" className="flex-1 min-w-0">
                <Link href="/gallery" className="flex items-center justify-center">
                  <Image className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Gallery</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats - Standardized Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-card text-card-foreground flex flex-col gap-1 rounded-xl border shadow-sm p-3 sm:p-4 relative overflow-hidden">
            <FolderOpen className="absolute top-2 right-2 h-16 w-16 text-muted-foreground opacity-10" />
            <div className="relative z-10">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
            </div>
            <div className="text-2xl font-bold leading-tight relative z-10">{totalProjects}</div>
            <p className="text-xs text-muted-foreground leading-tight relative z-10">
              Total
            </p>
          </div>

          <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border shadow-sm p-3 sm:p-4 relative overflow-hidden">
            <Image className="absolute top-2 right-2 h-16 w-16 text-muted-foreground opacity-10" />
            <div className="relative z-10">
              <CardTitle className="text-sm font-medium">Renders</CardTitle>
            </div>
            <div className="text-2xl font-bold leading-tight relative z-10">{totalRenders}</div>
            <p className="text-xs text-muted-foreground leading-tight relative z-10">
              {completedRenders} done
            </p>
          </div>

          <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border shadow-sm p-3 sm:p-4 relative overflow-hidden">
            <TrendingUp className="absolute top-2 right-2 h-16 w-16 text-muted-foreground opacity-10" />
            <div className="relative z-10">
              <CardTitle className="text-sm font-medium">Success</CardTitle>
            </div>
            <div className="text-2xl font-bold leading-tight relative z-10">{successRate}%</div>
            <p className="text-xs text-muted-foreground leading-tight relative z-10">
              Rate
            </p>
          </div>

          <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border shadow-sm p-3 sm:p-4 relative overflow-hidden">
            <Zap className="absolute top-2 right-2 h-16 w-16 text-muted-foreground opacity-10" />
            <div className="relative z-10">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
            </div>
            <div className="text-2xl font-bold leading-tight relative z-10">{userCredits}</div>
            <p className="text-xs text-muted-foreground leading-tight relative z-10">
              <Link href="/dashboard/billing" className="text-primary hover:underline">
                Manage
              </Link>
            </p>
          </div>
        </div>

        {/* Recent Projects & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <RecentProjectsPaginated projects={recentProjects} />
          <RecentActivityPaginated activities={recentActivity} />
        </div>

      </div>
    </div>
  );
}
