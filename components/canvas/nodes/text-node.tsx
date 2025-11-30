'use client';

import { useCallback } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Type } from 'lucide-react';
import { TextNodeData } from '@/lib/types/canvas';
import { BaseNode } from './base-node';

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

  return (
    <BaseNode
      title="Text Node"
      icon={Type}
      nodeType="text"
      nodeId={id}
      outputs={[{ id: 'text', position: Position.Right, type: 'text' }]}
    >
      <Textarea
        value={nodeData.prompt || ''}
        onChange={handleChange}
        placeholder={nodeData.placeholder || 'Enter your prompt...'}
        className="min-h-[100px] bg-[#1e1e1e] border-[#3d3d3d] text-white placeholder:text-[#8c8c8c] resize-none nodrag nopan"
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="text-xs text-[#8c8c8c] text-right">
        {(nodeData.prompt || '').length} characters
      </div>
    </BaseNode>
  );
}

