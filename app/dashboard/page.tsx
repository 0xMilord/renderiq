import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Fetch user's projects and recent renders
  let projects = [];
  let recentRenders = [];
  
  try {
    [projects, recentRenders] = await Promise.all([
      ProjectsDAL.getByUserId(user.id, 5),
      RendersDAL.getByUser(user.id, null, 5)
    ]);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Continue with empty arrays if there's an error
  }

  const totalProjects = projects.length;
  const totalRenders = recentRenders.length;
  const completedRenders = recentRenders.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your projects and track your AI renders.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                Active architectural projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Renders</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRenders}</div>
              <p className="text-xs text-muted-foreground">
                {completedRenders} completed successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRenders > 0 ? Math.round((completedRenders / totalRenders) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Rendering success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/billing" className="text-primary hover:underline">
                  Manage credits
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Start creating with our AI engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Link href="/engine/exterior-ai">
                    <div className="text-2xl">🏢</div>
                    <span className="text-sm">Exterior AI</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Link href="/engine/interior-ai">
                    <div className="text-2xl">🏠</div>
                    <span className="text-sm">Interior AI</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Link href="/engine/furniture-ai">
                    <div className="text-2xl">🪑</div>
                    <span className="text-sm">Furniture AI</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Link href="/engine/site-plan-ai">
                    <div className="text-2xl">🗺️</div>
                    <span className="text-sm">Site Plan AI</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest renders and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRenders.length > 0 ? (
                  recentRenders.slice(0, 3).map((render) => (
                    <div key={render.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          {render.type === 'video' ? '🎥' : '🖼️'}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {render.prompt}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(render.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        render.status === 'completed' ? 'default' :
                        render.status === 'processing' ? 'secondary' :
                        render.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {render.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No renders yet</p>
                    <p className="text-xs">Start by creating your first AI render</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>
                    Your latest architectural projects
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/dashboard/projects">
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            project.status === 'completed' ? 'default' :
                            project.status === 'processing' ? 'secondary' :
                            project.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {project.status}
                          </Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/projects/${project.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs">Create your first project to get started</p>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/projects">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community
                </CardTitle>
                <CardDescription>
                  Explore the gallery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Discover amazing architectural renders from our community of designers and architects.
                </p>
                <Button asChild className="w-full">
                  <Link href="/gallery">
                    <Image className="h-4 w-4 mr-2" />
                    Browse Gallery
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing
                </CardTitle>
                <CardDescription>
                  Manage your subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade your plan for more credits and advanced features.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
