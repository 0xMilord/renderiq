'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProjectBySlug } from '@/lib/actions/projects.actions';
import { getRenderChain } from '@/lib/actions/projects.actions';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Project } from '@/lib/db/schema';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const chatId = params.chatId as string;
  const { user, loading: authLoading, initialized } = useAuthStore();
  
  // ✅ OPTIMIZED: Combined state for parallel loading
  const [project, setProject] = useState<Project | null>(null);
  const [chain, setChain] = useState<RenderChainWithRenders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ OPTIMIZED: Fetch project and chain in parallel
  const fetchData = useCallback(async () => {
    if (!projectSlug || !chatId) return;
    
    setLoading(true);
    setError(null);

    try {
      // ✅ OPTIMIZED: Parallelize project and chain fetching
      const [projectResult, chainResult] = await Promise.all([
        getProjectBySlug(projectSlug),
        getRenderChain(chatId),
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
      logger.error('❌ CanvasEditorPage: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectSlug, chatId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ REMOVED: Duplicate initialize() call
  // AuthProvider already calls initialize(), no need to call it here
  // Components should only read from store, not initialize it

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);

  useEffect(() => {
    if (project && chain) {
      logger.log('🔍 CanvasEditorPage: Component state', {
        projectSlug,
        chatId,
        hasProject: !!project,
        projectId: project?.id,
        hasChain: !!chain,
        loading
      });
    }
  }, [projectSlug, chatId, project, chain, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Loading Canvas</h2>
            <p className="text-muted-foreground">
              Setting up your node editor...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button 
              onClick={() => router.push('/canvas')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Canvas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Canvas Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The canvas workflow you're looking for doesn't exist. A render chain is required to create a canvas.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push(`/canvas`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Canvas
              </Button>
              <Button 
                onClick={() => router.push(`/canvas/${projectSlug}`)}
                variant="outline"
              >
                View Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-var(--navbar-height))] pt-[var(--navbar-height)] bg-background overflow-hidden">
      <CanvasEditor
        projectId={project.id}
        chainId={chain.id}
        projectSlug={projectSlug}
        projectName={project.name}
        chainName={chain.name}
      />
    </div>
  );
}

