'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProjectBySlug } from '@/lib/actions/projects.actions';
import { getCanvasFileByIdAction } from '@/lib/actions/canvas-files.actions';
import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Project } from '@/lib/db/schema';
import { AlphaWarningBanner } from '@/components/ui/alpha-warning-banner';

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const fileId = params.fileId as string; // Route param is fileId (actual UUID)
  const { user, loading: authLoading, initialized } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectSlug || !fileId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch project first
      const projectResult = await getProjectBySlug(projectSlug);
      
      if (!projectResult.success || !projectResult.data) {
        setError(projectResult.error || 'Failed to load project');
        setLoading(false);
        return;
      }

      setProject(projectResult.data);

      // Fetch canvas file by ID
      const fileResult = await getCanvasFileByIdAction(fileId);
      
      if (fileResult.success && fileResult.file) {
        // Verify the file belongs to the project
        if (fileResult.file.projectId !== projectResult.data.id) {
          setError('Canvas file does not belong to this project');
          setLoading(false);
          return;
        }
        setFile(fileResult.file);
        logger.log('✅ CanvasEditorPage: Loaded canvas file', { fileId: fileResult.file.id });
      } else {
        setError(fileResult.error || 'Failed to load canvas file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('❌ CanvasEditorPage: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectSlug, fileId]);

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
    if (project && file) {
      logger.log('🔍 CanvasEditorPage: Component state', {
        projectSlug,
        routeFileId: fileId,
        hasProject: !!project,
        projectId: project?.id,
        hasFile: !!file,
        fileId: file?.id,
        loading
      });
    }
  }, [projectSlug, fileId, project, file, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background pt-[var(--navbar-height)] flex items-center justify-center">
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
      <div className="fixed inset-0 bg-background pt-[var(--navbar-height)] flex items-center justify-center">
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

  if (!file) {
    return (
      <div className="fixed inset-0 bg-background pt-[var(--navbar-height)] flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2 text-card-foreground">Canvas File Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The canvas file you're looking for doesn't exist.
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
                onClick={() => router.push(`/canvas`)}
                variant="outline"
              >
                View Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background pt-[var(--navbar-height)] overflow-hidden flex flex-col">
      {/* Alpha Warning Banner */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <AlphaWarningBanner platform="canvas" />
      </div>
      
      {/* Canvas Editor */}
      <div className="flex-1 overflow-hidden">
      <CanvasEditor
        projectId={project.id}
        fileId={file.id}
        projectSlug={projectSlug}
        projectName={project.name}
        fileName={file.name || 'Canvas'}
      />
      </div>
    </div>
  );
}

