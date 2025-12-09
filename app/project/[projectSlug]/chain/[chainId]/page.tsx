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

  // ✅ FIXED: Don't wait for user - fetch critical data first, then load dropdown data lazily
  useEffect(() => {
    if (!projectSlug || !chainId) return;
    if (authLoading) return; // Wait for auth to finish loading
    
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
        }

        if (chainResult.success && chainResult.data) {
          setChain(chainResult.data);
        } else {
          setError(chainResult.error || 'Failed to load chain');
        }
        
        // ✅ CRITICAL: Set loading to false after critical data loads
        setLoading(false);
        
        // ✅ OPTIMIZED: Load dropdown data lazily (non-blocking) - don't wait for user
        if (projectResult.success && chainResult.success) {
          // Load projects and chains in background (don't block page render)
          // Check for user in the promise, not in the condition
          Promise.all([
            getUserProjects(),
          ]).then(([projectsResult]) => {
            if (!mounted) return;
            
            if (projectsResult.success && projectsResult.data) {
              const projectsList = projectsResult.data.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
              }));
              setProjects(projectsList);

              // Fetch chains lazily (can be slow, don't block)
              Promise.all(
                projectsResult.data.map(project => getProjectChains(project.id))
              ).then(chainResults => {
                if (!mounted) return;
                
                const allChains: Array<{ id: string; name: string; projectId: string }> = [];
                chainResults.forEach((result, index) => {
                  if (result.success && result.data) {
                    const projectId = projectsResult.data[index].id;
                    result.data.forEach(chain => {
                      allChains.push({
                        id: chain.id,
                        name: chain.name,
                        projectId: projectId,
                      });
                    });
                  }
                });
                
                setChains(allChains);
              }).catch(err => {
                logger.error('❌ ProjectChainPage: Error fetching chains:', err);
                // Don't fail the whole page if chains fail to load
              });
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
  }, [projectSlug, chainId, authLoading]); // ✅ FIXED: Removed user from deps - don't wait for it

  // ✅ FIXED: fetchChain only fetches chain data, not all projects/chains
  // This is called by polling, so it should be lightweight
  const fetchChain = useCallback(async () => {
    if (!chainId || !user) return;
    
    try {
      const chainResult = await getRenderChain(chainId);
      if (chainResult.success && chainResult.data) {
        setChain(chainResult.data);
      }
    } catch (err) {
      logger.error('❌ ProjectChainPage: Error fetching chain:', err);
      // Don't show error to user for polling failures
    }
  }, [chainId, user]);

  // ✅ REMOVED: Duplicate initialize() call
  // AuthProvider already calls initialize(), no need to call it here
  // Components should only read from store, not initialize it

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);

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

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/dashboard/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
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
            onBackToProjects={() => router.push('/render')}
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






