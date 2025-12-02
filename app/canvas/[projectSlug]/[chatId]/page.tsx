'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectBySlug } from '@/lib/hooks/use-projects';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const chatId = params.chatId as string;
  
  const { project, loading: projectLoading } = useProjectBySlug(projectSlug);
  const { chain, loading: chainLoading, fetchChain } = useRenderChain(chatId);

  useEffect(() => {
    logger.log('🔍 CanvasEditorPage: Component state', {
      projectSlug,
      chatId,
      hasProject: !!project,
      projectId: project?.id,
      hasChain: !!chain,
      projectLoading,
      chainLoading
    });
  }, [projectSlug, chatId, project, chain, projectLoading, chainLoading]);

  if (projectLoading || chainLoading) {
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
    <div className="h-[calc(100vh-2.75rem)] bg-background overflow-hidden">
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

