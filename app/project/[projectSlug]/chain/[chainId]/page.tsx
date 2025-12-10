'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { getProjectBySlug, getUserProjects, getProjectChains } from '@/lib/actions/projects.actions';
import { getRenderChain } from '@/lib/actions/projects.actions';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Project } from '@/lib/db/schema';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

export default function ProjectChainPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const chainId = params.chainId as string;
  const { user, loading: authLoading, initialized } = useAuthStore();
  
  // ✅ OPTIMIZED: Combined state for parallel loading
  const [project, setProject] = useState<Project | null>(null);
  const [chain, setChain] = useState<RenderChainWithRenders | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [chains, setChains] = useState<Array<{ id: string; name: string; projectId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Fetch immediately - middleware already verified auth server-side
  // Actions use getCachedUser() which works with server-side auth
  useEffect(() => {
    if (!projectSlug || !chainId) return;
    // ✅ OPTIMIZED: Don't wait for client-side auth - middleware already verified user exists
    // If middleware allowed the request, user exists server-side
    // Actions will handle auth errors if needed
    
    let mounted = true;
    let hasFetched = false; // Prevent duplicate fetches
    
    const fetchCriticalData = async () => {
      if (hasFetched) return; // Already fetching
      hasFetched = true;
      
      setLoading(true);
      setError(null);

      try {
        // ✅ CRITICAL: Fetch only project and chain first (required for page to render)
        const [projectResult, chainResult] = await Promise.all([
          getProjectBySlug(projectSlug),
          getRenderChain(chainId),
        ]);

        if (!mounted) return;

        if (projectResult.success && projectResult.data) {
          setProject(projectResult.data);
        } else {
          setError(projectResult.error || 'Failed to load project');
          setLoading(false);
          return; // Don't continue if project fails
        }

        if (chainResult.success && chainResult.data) {
          setChain(chainResult.data);
        } else {
          setError(chainResult.error || 'Failed to load chain');
          setLoading(false);
          return; // Don't continue if chain fails
        }
        
        // ✅ CRITICAL: Set loading to false after critical data loads
        setLoading(false);
        
        // ✅ OPTIMIZED: Load dropdown data lazily (non-blocking)
        if (projectResult.success && chainResult.success) {
          // Load projects and chains in background (don't block page render)
          Promise.all([
            getUserProjects(),
          ]).then(async ([projectsResult]) => {
            if (!mounted) return;
            
            if (projectsResult.success && projectsResult.data) {
              const projectsList = projectsResult.data.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
              }));
              setProjects(projectsList);

              // ✅ OPTIMIZED: Batch fetch chains for all projects in ONE query
              try {
                const { getChainsForProjects } = await import('@/lib/actions/projects.actions');
                const projectIds = projectsResult.data.map(p => p.id);
                const chainsResult = await getChainsForProjects(projectIds);
                
                if (!mounted) return;
                
                if (chainsResult.success && chainsResult.data) {
                  const allChains: Array<{ id: string; name: string; projectId: string }> = [];
                  Object.entries(chainsResult.data).forEach(([projectId, chains]) => {
                    chains.forEach(chain => {
                      allChains.push({
                        id: chain.id,
                        name: chain.name,
                        projectId: projectId,
                      });
                    });
                  });
                  
                  setChains(allChains);
                }
              } catch (err) {
                logger.error('❌ ProjectChainPage: Error batch fetching chains:', err);
                // Don't fail the whole page if chains fail to load
              }
            }
          }).catch(err => {
            logger.error('❌ ProjectChainPage: Error fetching projects:', err);
            // Don't fail the whole page if projects fail to load
          });
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        logger.error('❌ ProjectChainPage: Error fetching data:', err);
        setLoading(false);
      }
    };
    
    fetchCriticalData();
    
    return () => {
      mounted = false;
    };
  }, [projectSlug, chainId]); // ✅ FIXED: Fetch immediately - don't wait for client-side auth

  // ✅ FIXED: fetchChain only fetches chain data, not all projects/chains
  // This is called by polling, so it should be lightweight
  // CRITICAL: Must be stable (useCallback with minimal dependencies) to prevent infinite loops
  const fetchChain = useCallback(async () => {
    if (!chainId) return;
    
    try {
      const chainResult = await getRenderChain(chainId);
      if (chainResult.success && chainResult.data) {
        setChain(chainResult.data);
      }
    } catch (err) {
      logger.error('❌ ProjectChainPage: Error fetching chain:', err);
      // Don't show error to user for polling failures
    }
  }, [chainId]); // ✅ CRITICAL: Removed user dependency - auth is already verified

  // ✅ REMOVED: Duplicate initialize() call
  // AuthProvider already calls initialize(), no need to call it here
  // Components should only read from store, not initialize it

  // ✅ REMOVED: Client-side redirect - middleware already handles auth protection
  // The middleware protects /project routes and redirects to /login if no user
  // Client-side redirect causes race conditions and unnecessary redirects
  // If middleware allowed the request, user exists server-side, so we should wait for client-side auth to sync

  // Debug logging
  useEffect(() => {
    if (project && chain) {
      logger.log('🔍 ProjectChainPage: Component state', {
        projectSlug,
        chainId,
        hasProject: !!project,
        projectId: project?.id,
        hasChain: !!chain,
        chainRendersCount: chain?.renders?.length || 0,
        loading
      });
    }
  }, [projectSlug, chainId, project, chain, loading]);

  const handleRenderComplete = (render: any) => {
    logger.log('Render completed:', render);
    // ✅ DO NOT refresh chain data - UnifiedChatInterface manages its own state
    // Calling fetchChain() causes a full page reload which is bad UX
    // The chat interface updates its messages state directly when a render completes
  };

  const handleRenderStart = () => {
    logger.log('Render started');
    // Render start is handled by UnifiedChatInterface
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading Render</h2>
            <p className="text-muted-foreground">
              Setting up your render interface...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ FIXED: Show error state instead of redirecting
  if (error && !project && !chain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Error Loading Project</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Failed to load project or chain'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/render')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Render
              </Button>
              <Button onClick={() => router.push('/dashboard/projects')}>
                Go to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/render')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Render
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Spacer for navbar */}
      <div className="h-[3.5rem] shrink-0"></div>
      {/* Unified Chat Interface - Takes remaining height */}
      {/* ✅ FIXED: Only render UnifiedChatInterface when chain is ready to prevent expensive hook calls */}
      {chain ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <UnifiedChatInterface
            projectId={project.id}
            chainId={chainId}
            chain={chain}
            onRenderComplete={handleRenderComplete}
            onRenderStart={handleRenderStart}
            onRefreshChain={fetchChain}
            projectName={project.name}
            chainName={chain?.name}
            onBackToProjects={() => router.push(`/render`)}
            projects={projects}
            chains={chains}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Loading Chain</h2>
              <p className="text-muted-foreground">
                Loading render chain data...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}






