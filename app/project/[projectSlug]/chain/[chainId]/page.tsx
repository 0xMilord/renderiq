'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { useProjectBySlug } from '@/lib/hooks/use-projects';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';

export default function ProjectChainPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const chainId = params.chainId as string;
  
  const { project, loading: projectLoading } = useProjectBySlug(projectSlug);
  const { chain, loading: chainLoading, fetchChain } = useRenderChain(chainId);

  // Debug logging
  useEffect(() => {
    logger.log('🔍 ProjectChainPage: Component state', {
      projectSlug,
      chainId,
      hasProject: !!project,
      projectId: project?.id,
      hasChain: !!chain,
      chainRendersCount: chain?.renders?.length || 0,
      projectLoading,
      chainLoading
    });
  }, [projectSlug, chainId, project, chain, projectLoading, chainLoading]);

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

  if (projectLoading || chainLoading) {
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






