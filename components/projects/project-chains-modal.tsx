'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Plus, Loader2, Search } from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Project, RenderChain, Render } from '@/lib/db/schema';

interface ChainWithRenders extends RenderChain {
  renders: Render[];
}

interface ProjectChainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  chains: ChainWithRenders[];
  onChainSelect?: (chainId: string) => void;
}

export function ProjectChainsModal({ 
  isOpen, 
  onClose, 
  project, 
  chains,
  onChainSelect 
}: ProjectChainsModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingChain, setIsCreatingChain] = useState(false);

  const filteredChains = chains.filter(chain =>
    chain.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNewChain = async () => {
    if (!project) return;
    
    setIsCreatingChain(true);
    try {
      const chainName = `${project.name} - Render ${chains.length + 1}`;
      
      const result = await createRenderChain(
        project.id,
        chainName,
        'Render chain'
      );

      if (result.success && result.data) {
        router.push(`/project/${project.slug || 'project'}/chain/${result.data.id}`);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
      toast.error('Failed to create chain');
    } finally {
      setIsCreatingChain(false);
    }
  };

  const handleChainClick = (chainId: string) => {
    if (onChainSelect) {
      onChainSelect(chainId);
    } else {
      router.push(`/project/${project?.slug || 'project'}/chain/${chainId}`);
    }
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            Select a chat or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Chains List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredChains.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'No chats found' : 'No chats yet'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateNewChain} disabled={isCreatingChain}>
                    {isCreatingChain ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Chat
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainClick(chain.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent text-left transition-colors"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{chain.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {chain.renders.length} render{chain.renders.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New Button */}
          {filteredChains.length > 0 && (
            <Button 
              onClick={handleCreateNewChain} 
              disabled={isCreatingChain}
              className="w-full"
            >
              {isCreatingChain ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

