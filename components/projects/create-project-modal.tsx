'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';
import { Square, Circle, Triangle, Hexagon, Pentagon, Octagon } from 'lucide-react';

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
  const [selectedShape, setSelectedShape] = useState<string>('square');
  const formRef = useRef<HTMLFormElement>(null);
  const { addProject } = useProjects();

  const shapes = [
    { id: 'square', name: 'Square', icon: Square, color: 'bg-blue-500' },
    { id: 'circle', name: 'Circle', icon: Circle, color: 'bg-green-500' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, color: 'bg-red-500' },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, color: 'bg-purple-500' },
    { id: 'pentagon', name: 'Pentagon', icon: Pentagon, color: 'bg-orange-500' },
    { id: 'octagon', name: 'Octagon', icon: Octagon, color: 'bg-pink-500' },
  ];


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('🚀 [CreateProjectModal] Form submitted');
    
    const projectName = event.currentTarget.projectName.value;
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    console.log('📝 [CreateProjectModal] Preparing form data:', {
      projectName,
      selectedShape
    });

    setLoading(true);
    try {
      // Create a simple project without file upload
      // For now, we'll create a mock project since the current system expects a file
      const mockFile = new File([''], 'shape-project.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('projectName', `${projectName} (${shapes.find(s => s.id === selectedShape)?.name})`);
      formData.append('description', `Project based on ${selectedShape} shape`);

      console.log('🎨 [CreateProjectModal] Calling addProject...');
      const result = await addProject(formData);
      console.log('📊 [CreateProjectModal] addProject result:', result);
      
      if (result.success) {
        console.log('✅ [CreateProjectModal] Project created successfully');
        toast.success('Project created successfully');
        setOpen(false);
        setSelectedShape('square');
        // Reset form safely
        if (formRef.current) {
          formRef.current.reset();
        }
        // Notify parent component about the new project
        if (onProjectCreated && 'data' in result && result.data && typeof result.data === 'object' && 'id' in result.data) {
          onProjectCreated((result.data as { id: string }).id);
        }
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
            Enter a project name and select a base shape to start generating AI renders.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Project Name and Shape Selection Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Shape Selection Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="shape">Base Shape</Label>
                <Select value={selectedShape} onValueChange={setSelectedShape}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shape">
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const selectedShapeData = shapes.find(s => s.id === selectedShape);
                          const IconComponent = selectedShapeData?.icon || Square;
                          return (
                            <>
                              <div className={`w-4 h-4 rounded-full ${selectedShapeData?.color || 'bg-blue-500'} flex items-center justify-center`}>
                                <IconComponent className="h-2.5 w-2.5 text-white" />
                              </div>
                              <span>{selectedShapeData?.name || 'Square'}</span>
                            </>
                          );
                        })()}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((shape) => {
                      const IconComponent = shape.icon;
                      return (
                        <SelectItem key={shape.id} value={shape.id}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${shape.color} flex items-center justify-center`}>
                              <IconComponent className="h-2.5 w-2.5 text-white" />
                            </div>
                            <span>{shape.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
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
