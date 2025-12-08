'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Globe, Lock, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/lib/hooks/use-projects';
import type { Project } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface ShareProjectModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: (project: Project) => void;
}

export function ShareProjectModal({ project, open, onOpenChange, onProjectUpdated }: ShareProjectModalProps) {
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateProject } = useProjects();

  const projectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/project/${project.slug}`
    : '';

  useEffect(() => {
    if (open) {
      setIsPublic(project.isPublic);
    }
  }, [open, project.isPublic]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    try {
      const result = await updateProject(project.id, { isPublic: checked });
      if (result.success && result.data) {
        setIsPublic(checked);
        toast.success(checked ? 'Project is now public' : 'Project is now private');
        onProjectUpdated?.(result.data);
      } else {
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Share this project with others. Make it public to allow anyone with the link to view it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <Label htmlFor="public-toggle" className="text-sm font-medium cursor-pointer">
                  {isPublic ? 'Public' : 'Private'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic 
                    ? 'Anyone with the link can view this project'
                    : 'Only you can view this project'
                  }
                </p>
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={loading}
            />
          </div>

          {/* Share Link Section */}
          {isPublic && (
            <div className="space-y-2">
              <Label>Project Link</Label>
              <div className="flex gap-2">
                <Input
                  value={projectUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to allow others to view your project
              </p>
            </div>
          )}

          {!isPublic && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Project is Private</p>
                  <p className="text-xs text-muted-foreground">
                    Make this project public to generate a shareable link. Once public, anyone with the link can view your project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Project Name</span>
              <span className="font-medium">{project.name}</span>
            </div>
            {project.description && (
              <div className="flex items-start justify-between text-sm mt-2">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[60%]">{project.description}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {isPublic && (
            <Button
              onClick={handleCopyLink}
              className="w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

