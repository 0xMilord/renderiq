'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAllUserChains } from '@/lib/hooks/use-render-chain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  MessageSquare, 
  Building2, 
  Loader2,
  Search,
  FolderOpen
} from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';

export default function ChatPage() {
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const { chains, loading: chainsLoading } = useAllUserChains();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isCreatingChain, setIsCreatingChain] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateNewChain = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setIsCreatingChain(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      const chainName = project ? `${project.name} - Chat Chain` : 'New Chat Chain';
      
      const result = await createRenderChain(
        selectedProjectId,
        chainName,
        'AI Chat render chain'
      );

      if (result.success && result.data) {
        router.push(`/${project?.slug || 'project'}/chat/${result.data.id}`);
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

  const handleSelectExistingChain = (chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      const project = projects.find(p => p.id === chain.projectId);
      router.push(`/${project?.slug || 'project'}/chat/${chainId}`);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChains = chains.filter(chain => {
    const project = projects.find(p => p.id === chain.projectId);
    return project && project.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (projectsLoading || chainsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading</h2>
            <p className="text-muted-foreground">
              Loading your projects and chains...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">AI Chat Interface</h1>
            <p className="text-muted-foreground text-lg">
              Start a conversation with AI to generate amazing architectural renders
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or chains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create New Chain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Start New Chat</span>
                </CardTitle>
                <CardDescription>
                  Create a new AI chat session for a project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-select">Select Project</Label>
                  <select
                    id="project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    aria-label="Select project"
                  >
                    <option value="">Choose a project...</option>
                    {filteredProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  onClick={handleCreateNewChain}
                  disabled={!selectedProjectId || isCreatingChain}
                  className="w-full"
                >
                  {isCreatingChain ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start New Chat
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Chains */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Continue Chat</span>
                </CardTitle>
                <CardDescription>
                  Resume an existing AI chat session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredChains.length > 0 ? (
                  <div className="space-y-2">
                    {filteredChains.map((chain) => {
                      const project = projects.find(p => p.id === chain.projectId);
                      return (
                        <Button
                          key={chain.id}
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                          onClick={() => handleSelectExistingChain(chain.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div className="text-left">
                              <div className="font-medium">{chain.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {project?.name}
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No matching chains found' : 'No existing chains'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
