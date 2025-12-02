'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface CreateProjectModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectModal({ children, open: controlledOpen, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { addProject } = useProjects();


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [CreateProjectModal] Form submitted');
    
    const projectName = event.currentTarget.projectName.value;
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setLoading(true);
    try {
      // Generate a random shape for the project
      const shapes = ['square', 'circle', 'triangle', 'hexagon', 'pentagon', 'octagon'];
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      
      logger.log('📝 [CreateProjectModal] Creating project with random shape:', randomShape);

      // Generate DiceBear URL
      const dicebearUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(projectName + randomShape)}&backgroundColor=transparent&shape1Color=4a90e2&shape2Color=7b68ee&shape3Color=ff6b6b`;
      
      // Create a mock file for the DiceBear URL
      const mockFile = new File([''], `shape-${randomShape}.svg`, { type: 'image/svg+xml' });
      
      // Create FormData for the existing createProject function
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('projectName', projectName);
      formData.append('description', `AI-generated project with ${randomShape} shape`);
      formData.append('dicebearUrl', dicebearUrl); // Add DiceBear URL as metadata

      logger.log('🎨 [CreateProjectModal] Calling addProject...');
      const result = await addProject(formData);
      logger.log('📊 [CreateProjectModal] addProject result:', result);
      
      if (result.success) {
        logger.log('✅ [CreateProjectModal] Project created successfully');
        toast.success('Project created successfully');
        setOpen(false);
        // Reset form safely
        if (formRef.current) {
          formRef.current.reset();
        }
        // Notify parent component about the new project
        if (onProjectCreated && 'data' in result && result.data && typeof result.data === 'object' && 'id' in result.data) {
          onProjectCreated((result.data as { id: string }).id);
        }
        // Refetch projects to update the list
        // The projects will be refetched automatically due to revalidatePath in the action
      } else {
        console.error('❌ [CreateProjectModal] Project creation failed:', result.error);
        toast.error(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('❌ [CreateProjectModal] Unexpected error:', error);
      toast.error('An error occurred while creating the project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a project name to create a new AI project with a unique shape-based avatar.
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
                required
                maxLength={100}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
