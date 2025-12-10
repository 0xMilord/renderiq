'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { Project } from '@/lib/db/schema';

interface DuplicateProjectModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectDuplicated?: (project: Project) => void;
}

export function DuplicateProjectModal({ project, open, onOpenChange, onProjectDuplicated }: DuplicateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { duplicateProject } = useProjects();
  const [projectName, setProjectName] = useState('');

  // Set default name when modal opens
  useEffect(() => {
    if (open && project) {
      setProjectName(`${project.name} (Copy)`);
    }
  }, [open, project]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [DuplicateProjectModal] Form submitted');
    
    const name = projectName.trim();
    if (!name) {
      toast.error('Please enter a project name');
      return;
    }

    setLoading(true);
    try {
      logger.log('📝 [DuplicateProjectModal] Duplicating project:', project.id);

      const result = await duplicateProject(project.id, name);
      logger.log('📊 [DuplicateProjectModal] duplicateProject result:', result);
      
      if (result.success && result.data) {
        logger.log('✅ [DuplicateProjectModal] Project duplicated successfully');
        toast.success('Project duplicated successfully');
        onOpenChange(false);
        setProjectName('');
        // Reset form safely
        if (formRef.current) {
          formRef.current.reset();
        }
        // Notify parent component about the duplicated project
        if (onProjectDuplicated) {
          onProjectDuplicated(result.data);
        }
      } else {
        console.error('❌ [DuplicateProjectModal] Project duplication failed:', result.error);
        toast.error(result.error || 'Failed to duplicate project');
      }
    } catch (error) {
      console.error('❌ [DuplicateProjectModal] Unexpected error:', error);
      toast.error('An error occurred while duplicating the project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Duplicate Project</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{project.name}&quot;. You can change the name if needed.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">New Project Name</Label>
              <Input
                id="projectName"
                name="projectName"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                maxLength={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                This will create a copy of the project with all its chats and renders.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Duplicating...' : 'Duplicate Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

