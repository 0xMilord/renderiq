'use client';

import { useCallback } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Type } from 'lucide-react';
import { TextNodeData } from '@/lib/types/canvas';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function TextNode(props: any) {
  const { data, id } = props;
  const nodeData = data || { prompt: '', placeholder: 'Enter your prompt...' };
  const nodeColors = useNodeColors();
  
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
      nodeId={String(id)}
      status={status}
      progress={progress}
      inputs={[{ id: 'text', position: Position.Left, type: 'text', label: 'Text' }]}
      outputs={[{ id: 'text', position: Position.Right, type: 'text', label: 'Text' }]}
    >
      <Textarea
        value={nodeData.prompt || ''}
        onChange={handleChange}
        placeholder={nodeData.placeholder || 'Enter your prompt...'}
        className="min-h-[100px] bg-background resize-none nodrag nopan"
        style={{ borderColor: `${nodeColors.color}40`, color: 'inherit' }}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="text-xs text-muted-foreground text-right">
        {(nodeData.prompt || '').length} characters
      </div>
    </BaseNode>
  );
}

