'use client';

import { useState } from 'react';
import { ToolConfig } from '@/lib/tools/registry';
import { ToolOrchestrator } from '@/components/tools/tool-orchestrator';
import { ToolLayout } from '@/components/tools/tool-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { isToolAccessible } from '@/lib/tools/feature-flags';
import { AlphaWarningBanner } from '@/components/ui/alpha-warning-banner';

interface ToolPageClientProps {
  tool: ToolConfig;
}

export function ToolPageClient({ tool }: ToolPageClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Check if tool is accessible (respects feature flags)
  const isAccessible = isToolAccessible(tool.id);

  // Show offline message if tool is not accessible
  if (!isAccessible || tool.status === 'offline') {
    return (
      <ToolLayout tool={tool} onProjectChange={setSelectedProjectId} hintMessage={hintMessage}>
        <div className="w-full max-w-[1920px] mx-auto py-12 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Wrench className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">{tool.name}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  Offline
                </Badge>
              </div>
              <CardDescription className="text-base">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-center text-muted-foreground">
                  This tool is currently offline and under development. Check back soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool} onProjectChange={setSelectedProjectId} hintMessage={hintMessage}>
      <ToolOrchestrator tool={tool} projectId={selectedProjectId} onHintChange={setHintMessage} hintMessage={hintMessage} />
    </ToolLayout>
  );
}

