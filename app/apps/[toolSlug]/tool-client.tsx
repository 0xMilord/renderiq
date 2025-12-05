'use client';

import { ToolConfig } from '@/lib/tools/registry';
import { ToolOrchestrator } from '@/components/tools/tool-orchestrator';
import { ToolLayout } from '@/components/tools/tool-layout';

interface ToolPageClientProps {
  tool: ToolConfig;
}

export function ToolPageClient({ tool }: ToolPageClientProps) {
  return (
    <ToolLayout tool={tool}>
      <ToolOrchestrator tool={tool} />
    </ToolLayout>
  );
}

