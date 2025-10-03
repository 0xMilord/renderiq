'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useRenders } from '@/lib/hooks/use-renders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Plus, Loader2, ArrowRight } from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExteriorAIPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const { chains, fetchChains } = useRenders(selectedProjectId || null);

  // Fetch chains when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchChains();
    }
  }, [selectedProjectId, fetchChains]);

  const handleCreateChain = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }

    setCreating(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      const chainName = project ? `${project.name} - New Chain` : 'New Chain';
      
      const result = await createRenderChain(
        selectedProjectId,
        chainName,
        'New iteration chain'
      );

      if (result.success && result.data) {
        router.push(`/engine/exterior-ai/${result.data.id}`);
      } else {
        alert(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
      alert('Failed to create chain');
    } finally {
      setCreating(false);
    }
  };

  const handleContinueChain = (chainId: string) => {
    router.push(`/engine/exterior-ai/${chainId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Exterior AI Engine</h1>
          <p className="text-lg text-muted-foreground">
            Select a project and chain to start generating
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Select a project, then choose an existing chain or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Project</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chains List */}
            {selectedProjectId && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Existing Chains</label>
                  {chains.length > 0 ? (
                    <div className="space-y-2">
                      {chains.map((chain) => (
                        <div
                          key={chain.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handleContinueChain(chain.id)}
                        >
                          <div className="flex items-center gap-3">
                            <GitBranch className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{chain.name}</p>
                              {chain.description && (
                                <p className="text-sm text-muted-foreground">{chain.description}</p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                      No chains yet for this project
                    </p>
                  )}
                </div>

                {/* Create New Chain Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateChain}
                    disabled={creating}
                    className="w-full"
                    size="lg"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Chain...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Chain
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {!selectedProjectId && (
              <div className="py-8 text-center text-muted-foreground">
                Select a project to view or create chains
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
