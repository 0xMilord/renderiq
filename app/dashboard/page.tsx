import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/services/auth-cache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Image, 
  TrendingUp, 
  Zap
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
      ProjectsDAL.getByUserIdWithRenderCounts(user.id, 100, 0), // All projects for pagination with render counts
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

    // ✅ FIXED: Batch fetch latest renders for all projects to show thumbnails
    const projectIds = projectsData?.map(p => p.id) || [];
    const latestRenders = projectIds.length > 0 
      ? await ProjectsDAL.getLatestRendersForProjects(projectIds, 1)
      : [];
    
    // Attach latest renders to projects
    const rendersByProject = latestRenders.reduce((acc, render) => {
      if (!acc[render.projectId]) {
        acc[render.projectId] = [];
      }
      acc[render.projectId].push(render);
      return acc;
    }, {} as Record<string, typeof latestRenders>);
    
    const projectsWithRenders = (projectsData || []).map(project => ({
      ...project,
      latestRenders: rendersByProject[project.id] || []
    }));

    recentProjects = projectsWithRenders;
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

        {/* Quick Stats - Standardized Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
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
