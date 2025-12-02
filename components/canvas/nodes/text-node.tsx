'use client';

import { useCallback } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Type } from 'lucide-react';
import { TextNodeData } from '@/lib/types/canvas';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function TextNode({ data, id }: NodeProps<{ data: TextNodeData }>) {
  const nodeData = data || { prompt: '', placeholder: 'Enter your prompt...' };
  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Update node data through React Flow's update mechanism
      // This will be handled by the parent component
      const event = new CustomEvent('nodeDataUpdate', {
        detail: { nodeId: id, data: { ...nodeData, prompt: e.target.value } },
      });
      window.dispatchEvent(event);
    },
    [nodeData, id]
  );

  // Get status from node data or default to idle
  const status = (data as any)?.status || NodeExecutionStatus.IDLE;
  const progress = (data as any)?.progress;

  return (
    <BaseNode
      title="Text Node"
      icon={Type}
      nodeType="text"
      nodeId={id}
      status={status}
      progress={progress}
      outputs={[{ id: 'text', position: Position.Right, type: 'text' }]}
    >
      <Textarea
        value={nodeData.prompt || ''}
        onChange={handleChange}
        placeholder={nodeData.placeholder || 'Enter your prompt...'}
        className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none nodrag nopan"
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="text-xs text-muted-foreground text-right">
        {(nodeData.prompt || '').length} characters
      </div>
    </BaseNode>
  );
}

