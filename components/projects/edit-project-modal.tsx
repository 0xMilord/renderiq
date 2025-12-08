'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { Project } from '@/lib/db/schema';

interface EditProjectModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: (project: Project) => void;
}

export function EditProjectModal({ project, open, onOpenChange, onProjectUpdated }: EditProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { updateProject } = useProjects();
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    isPublic: project.isPublic || false,
  });

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        isPublic: project.isPublic || false,
      });
    }
  }, [project]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [EditProjectModal] Form submitted');
    
    const projectName = event.currentTarget.projectName.value.trim();
    if (!projectName) {
      toast.error('Please enter a project name');
      return;
    }

    setLoading(true);
    try {
      logger.log('📝 [EditProjectModal] Updating project:', project.id);

      const updateData = {
        name: projectName,
        description: event.currentTarget.description.value.trim() || null,
        isPublic: formData.isPublic,
      };

      logger.log('🎨 [EditProjectModal] Calling updateProject...');
      const result = await updateProject(project.id, updateData);
      logger.log('📊 [EditProjectModal] updateProject result:', result);
      
      if (result.success && result.data) {
        logger.log('✅ [EditProjectModal] Project updated successfully');
        toast.success('Project updated successfully');
        onOpenChange(false);
        // Notify parent component about the updated project
        if (onProjectUpdated) {
          onProjectUpdated(result.data);
        }
      } else {
        console.error('❌ [EditProjectModal] Project update failed:', result.error);
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('❌ [EditProjectModal] Unexpected error:', error);
      toast.error('An error occurred while updating the project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                name="projectName"
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter project description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={500}
                className="w-full resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Public Visibility */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">Public Project</Label>
                <p className="text-xs text-muted-foreground">
                  Make this project visible to others
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
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
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

