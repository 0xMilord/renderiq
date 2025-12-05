'use client';

import { useState } from 'react';
import { ToolConfig } from '@/lib/tools/registry';
import { ToolOrchestrator } from '@/components/tools/tool-orchestrator';
import { ToolLayout } from '@/components/tools/tool-layout';

interface ToolPageClientProps {
  tool: ToolConfig;
}

export function ToolPageClient({ tool }: ToolPageClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <ToolLayout tool={tool} onProjectChange={setSelectedProjectId}>
      <ToolOrchestrator tool={tool} projectId={selectedProjectId} />
    </ToolLayout>
  );
}

