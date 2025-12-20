'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';
import { useState } from 'react';
import { useProjects } from '@/lib/hooks/use-projects';

function ProjectHeaderTabsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'chains';
  const { projects } = useProjects();
  const [isCreating, setIsCreating] = useState(false);

  // Extract slug from pathname
  const slugMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)$/);
  if (!slugMatch) {
    return null;
  }

  const slug = slugMatch[1];
  const project = projects.find(p => p.slug === slug);

  if (!project) {
    return null;
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'chains') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCreateChain = async () => {
    if (!project?.id) return;
    
    setIsCreating(true);
    try {
      const chainName = `Chain ${new Date().toLocaleDateString()}`;
      const result = await createRenderChain(project.id, chainName, `New render chain for ${project.name}`);
      
      if (result.success && result.data && project) {
        toast.success('Render chain created successfully');
        // Redirect to unified project/chain route
        router.push(`/project/${project.slug}/chain/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create render chain');
      }
    } catch (error) {
      toast.error('Failed to create render chain');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50">
          <Button
            variant={activeTab === 'chains' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('chains')}
            className={cn(
              'flex items-center gap-2',
              activeTab === 'chains' && 'bg-background shadow-sm'
            )}
          >
            <span>Render Chains</span>
          </Button>
          <Button
            variant={activeTab === 'renders' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleTabChange('renders')}
            className={cn(
              'flex items-center gap-2',
              activeTab === 'renders' && 'bg-background shadow-sm'
            )}
          >
            <span>All Renders</span>
          </Button>
        </div>
        {activeTab === 'chains' && (
          <Button 
            onClick={handleCreateChain} 
            size="sm" 
            disabled={isCreating}
            className="shrink-0"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Chain
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}

// ✅ FIX: Export wrapped component with Suspense boundary
export function ProjectHeaderTabs() {
  return (
    <Suspense fallback={<div className="flex-1 h-10 bg-muted animate-pulse rounded shrink-0" />}>
      <ProjectHeaderTabsContent />
    </Suspense>
  );
}

