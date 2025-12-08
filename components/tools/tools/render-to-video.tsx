'use client';

import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface RenderToVideoProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function RenderToVideo({ tool, projectId, onHintChange, hintMessage }: RenderToVideoProps) {
  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      hintMessage={hintMessage}
      multipleImages={false}
      maxImages={1}
    />
  );
}


