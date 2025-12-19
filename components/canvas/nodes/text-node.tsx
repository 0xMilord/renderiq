'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Type } from 'lucide-react';
import { TextNodeData } from '@/lib/types/canvas';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function TextNode(props: any) {
  const { data, id } = props;
  const nodeColors = useNodeColors();
  
  // ✅ FIXED: Use local state that syncs with prop data (from connections)
  const [localPrompt, setLocalPrompt] = useState<string>(data?.prompt || '');
  
  // ✅ FIXED: Sync local state when prop data changes (from prompt-builder connection)
  useEffect(() => {
    if (data?.prompt !== undefined && data.prompt !== localPrompt) {
      setLocalPrompt(data.prompt);
    }
  }, [data?.prompt]);
  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newPrompt = e.target.value;
      setLocalPrompt(newPrompt);
      
      // Update node data through React Flow's update mechanism
      const event = new CustomEvent('nodeDataUpdate', {
        detail: { nodeId: id, data: { ...data, prompt: newPrompt } },
      });
      window.dispatchEvent(event);
    },
    [data, id]
  );

  // Get status from node data or default to idle
  const status = (data as any)?.status || NodeExecutionStatus.IDLE;
  const progress = (data as any)?.progress;

  return (
    <BaseNode
      title="Text Node"
      icon={Type}
      nodeType="text"
      nodeId={String(id)}
      status={status}
      progress={progress}
      inputs={[{ id: 'text', position: Position.Left, type: 'text', label: 'Text' }]}
      outputs={[{ id: 'text', position: Position.Right, type: 'text', label: 'Text' }]}
    >
      <Textarea
        value={localPrompt}
        onChange={handleChange}
        placeholder={data?.placeholder || 'Enter your prompt...'}
        className="min-h-[100px] bg-background resize-none nodrag nopan"
        style={{ borderColor: `${nodeColors.color}40`, color: 'inherit' }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="text-xs text-muted-foreground text-right">
        {localPrompt.length} characters
      </div>
    </BaseNode>
  );
}

