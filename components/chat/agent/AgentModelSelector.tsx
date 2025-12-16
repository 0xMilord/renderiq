'use client';

import { useValue } from 'tldraw';
import type { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { AGENT_MODEL_DEFINITIONS, type AgentModelName } from '@/agent-kit/worker/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain } from 'lucide-react';

interface AgentModelSelectorProps {
  agent: TldrawAgent | null;
}

/**
 * Styled model selector for agent
 * Allows users to choose which AI model the agent uses
 */
export function AgentModelSelector({ agent }: AgentModelSelectorProps) {
  if (!agent) return null;

  const modelName = useValue(agent.$modelName);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={modelName}
        onValueChange={(value) => agent.$modelName.set(value as AgentModelName)}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs border-muted-foreground/20">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-muted-foreground" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.values(AGENT_MODEL_DEFINITIONS).map((model) => (
            <SelectItem key={model.name} value={model.name}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

