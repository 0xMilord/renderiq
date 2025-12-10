'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { useProjects } from '@/lib/hooks/use-projects';
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { Project } from '@/lib/db/schema';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateProjectModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProjectCreated?: (project: Project) => void;
  platform?: 'render' | 'tools' | 'canvas'; // Platform context
}

// Predefined strings for auto-generation
const PROJECT_NAMES = [
  'Creative Studio', 'Design Lab', 'Art Project', 'Visual Works', 'Creative Hub',
  'Design Space', 'Art Studio', 'Visual Lab', 'Creative Works', 'Design Studio',
  'Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta', 'Project Echo'
];

const PROJECT_DESCRIPTIONS = [
  'A creative project for exploring new ideas',
  'Design and visualization workspace',
  'Artistic expression and experimentation',
  'Visual design and creative exploration',
  'Innovative design project',
  'Creative workspace for visual projects',
  'Design and art collaboration space',
  'Visual creativity and experimentation hub'
];

const PROJECT_TAGS = [
  'design', 'creative', 'art', 'visual', 'project', 'workspace', 'studio', 'lab'
];

// Generate random project data
function generateRandomProject() {
  const name = PROJECT_NAMES[Math.floor(Math.random() * PROJECT_NAMES.length)];
  const description = PROJECT_DESCRIPTIONS[Math.floor(Math.random() * PROJECT_DESCRIPTIONS.length)];
  const tagCount = Math.floor(Math.random() * 3) + 2; // 2-4 tags
  const selectedTags = PROJECT_TAGS.sort(() => 0.5 - Math.random()).slice(0, tagCount);
  return { name, description, tags: selectedTags.join(', ') };
}

export function CreateProjectModal({ 
  children, 
  open: controlledOpen, 
  onOpenChange, 
  onProjectCreated,
  platform = 'render' 
}: CreateProjectModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // ✅ FIXED: Only call useProjects when modal is actually open to prevent unnecessary fetches
  // This prevents the hook from running when modal is closed
  const projectsHook = useProjects();
  const { addProject } = projectsHook;
  const router = useRouter();
  
  // Limit reached dialog state
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitDialogData, setLimitDialogData] = useState<{
    limitType: 'projects' | 'renders_per_project' | 'credits' | 'quality' | 'video' | 'api';
    current: number;
    limit: number | null;
    planName: string;
    message?: string;
  } | null>(null);
  
  // Form state - auto-filled by default
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [tags, setTags] = useState('');

  // Fix hydration error by only rendering Dialog on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-fill form when dialog opens
  useEffect(() => {
    if (open && !projectName) {
      const random = generateRandomProject();
      setProjectName(random.name);
      setDescription(random.description);
      setTags(random.tags);
    }
  }, [open, projectName]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setProjectName('');
      setDescription('');
      setLogoFile(null);
      setLogoPreview(null);
      setTags('');
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  }, [open]);

  // Handle logo file upload
  const handleLogoChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setLogoFile(file);
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [CreateProjectModal] Form submitted');
    
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for the existing createProject function
      const formData = new FormData();
      formData.append('projectName', projectName.trim());
      formData.append('platform', platform); // Pass platform
      
      // Add description if provided
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      
      // Add tags if provided
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tagArray.length > 0) {
          formData.append('tags', JSON.stringify(tagArray));
        }
      }
      
      // Handle logo/file upload
      if (logoFile) {
        formData.append('file', logoFile);
        logger.log('📝 [CreateProjectModal] Using user-provided logo');
      } else {
        // No logo provided, generate DiceBear URL as fallback
        const shapes = ['square', 'circle', 'triangle', 'hexagon', 'pentagon', 'octagon'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const dicebearUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(projectName + randomShape)}&backgroundColor=transparent&shape1Color=4a90e2&shape2Color=7b68ee&shape3Color=ff6b6b`;
        formData.append('dicebearUrl', dicebearUrl);
        logger.log('📝 [CreateProjectModal] Using auto-generated DiceBear avatar');
      }

      logger.log('🎨 [CreateProjectModal] Calling addProject...');
      const result = await addProject(formData);
      logger.log('📊 [CreateProjectModal] addProject result:', result);
      logger.log('📊 [CreateProjectModal] limitReached check:', {
        success: result.success,
        limitReached: (result as any).limitReached,
        hasLimitData: !!(result as any).limitType,
      });
      
      // ✅ FIXED: Check if limit was reached - pass through all limit data
      if (!result.success && (result as any).limitReached) {
        const limitData = result as any;
        logger.log('🚨 [CreateProjectModal] Limit reached, opening dialog:', limitData);
        setLimitDialogData({
          limitType: limitData.limitType || 'projects',
          current: limitData.current || 0,
          limit: limitData.limit || null,
          planName: limitData.planName || 'Free',
          message: result.error,
        });
        setLimitDialogOpen(true);
        setLoading(false); // ✅ FIXED: Stop loading state when showing dialog
        return;
      }
      
      if (result.success) {
        logger.log('✅ [CreateProjectModal] Project created successfully');
        toast.success('Project created successfully');
        setOpen(false);
        // ✅ Notify parent component about the new project with full data for optimistic update
        if (onProjectCreated && 'data' in result && result.data && typeof result.data === 'object' && 'id' in result.data) {
          onProjectCreated(result.data as Project);
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

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild suppressHydrationWarning>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Quick project creation. All fields are pre-filled - just click Create!
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Compact layout: Image (64x64) on left, Name and Description stacked on right */}
          <div className="flex gap-4 items-start">
            {/* Logo Upload - 64x64 */}
            <div className="flex-shrink-0">
              <Label className="text-xs text-muted-foreground mb-1 block">Logo</Label>
              {logoPreview ? (
                <div className="relative">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-background border border-border"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <FileUpload
                  multiple={false}
                  maxFiles={1}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] }}
                  onFilesChange={handleLogoChange}
                  className="w-16 h-16"
                />
              )}
            </div>

            {/* Name and Description stacked */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="projectName" className="text-xs">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  name="projectName"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  maxLength={100}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Project description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-xs">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="design, creative, art"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !projectName.trim()} 
              className="flex-1 sm:flex-initial"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Limit Reached Dialog */}
      {limitDialogData && (
        <LimitReachedDialog
          isOpen={limitDialogOpen}
          onClose={() => {
            setLimitDialogOpen(false);
            setLimitDialogData(null);
          }}
          limitType={limitDialogData.limitType}
          current={limitDialogData.current}
          limit={limitDialogData.limit}
          planName={limitDialogData.planName}
          message={limitDialogData.message}
          onManage={() => {
            router.push('/dashboard/projects');
          }}
        />
      )}
    </Dialog>
  );
}
