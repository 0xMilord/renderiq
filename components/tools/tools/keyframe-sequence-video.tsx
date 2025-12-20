'use client';

import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface KeyframeSequenceVideoProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function KeyframeSequenceVideo({ tool, projectId, onHintChange, hintMessage }: KeyframeSequenceVideoProps) {
  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      hintMessage={hintMessage}
      multipleImages={true}
      maxImages={3} // Keyframe sequence supports up to 3 images
    />
  );
}










