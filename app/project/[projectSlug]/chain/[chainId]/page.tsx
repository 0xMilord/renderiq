'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { getProjectBySlug } from '@/lib/actions/projects.actions';
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
  const { user, loading: authLoading, initialized, initialize } = useAuthStore();
  
  // ✅ OPTIMIZED: Combined state for parallel loading
  const [project, setProject] = useState<Project | null>(null);
  const [chain, setChain] = useState<RenderChainWithRenders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ OPTIMIZED: Fetch project and chain in parallel
  const fetchData = useCallback(async () => {
    if (!projectSlug || !chainId) return;
    
    setLoading(true);
    setError(null);

    try {
      // ✅ OPTIMIZED: Parallelize project and chain fetching
      const [projectResult, chainResult] = await Promise.all([
        getProjectBySlug(projectSlug),
        getRenderChain(chainId),
      ]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('❌ ProjectChainPage: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectSlug, chainId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchChain = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

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
    <div className="h-[calc(100vh-var(--navbar-height))] pt-[var(--navbar-height)] bg-background overflow-hidden">
      {/* Unified Chat Interface */}
      <div className="h-full">
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
        />
      </div>
    </div>
  );
}






