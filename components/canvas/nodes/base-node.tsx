'use client';

import { ReactNode } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { NodeStatusIndicator } from '../node-status-indicator';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

interface BaseNodeProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  inputs?: Array<{
    id: string;
    position: Position;
    label?: string;
    type?: 'text' | 'image' | 'style' | 'material';
  }>;
  outputs?: Array<{
    id: string;
    position: Position;
    label?: string;
    type?: 'text' | 'image' | 'style' | 'material' | 'variants';
  }>;
  className?: string;
  nodeType?: 'text' | 'image' | 'variants' | 'style' | 'material';
  nodeId?: string;
  status?: NodeExecutionStatus;
  progress?: number;
}

// Color scheme for different node types
const nodeColors = {
  text: {
    header: 'bg-[#2d5016] border-[#4a7c2a]',
    icon: 'text-[#6bcf33]',
    accent: '#6bcf33',
  },
  image: {
    header: 'bg-[#1a3d5c] border-[#2d5f8f]',
    icon: 'text-[#4a9eff]',
    accent: '#4a9eff',
  },
  variants: {
    header: 'bg-[#5c1a3d] border-[#8f2d5f]',
    icon: 'text-[#ff4a9e]',
    accent: '#ff4a9e',
  },
  style: {
    header: 'bg-[#5c3d1a] border-[#8f5f2d]',
    icon: 'text-[#ff9e4a]',
    accent: '#ff9e4a',
  },
  material: {
    header: 'bg-[#3d1a5c] border-[#5f2d8f]',
    icon: 'text-[#9e4aff]',
    accent: '#9e4aff',
  },
};

// Handle colors by type
const handleColors = {
  text: '#6bcf33',
  image: '#4a9eff',
  style: '#ff9e4a',
  material: '#9e4aff',
  variants: '#ff4a9e',
};

export function BaseNode({
  title,
  icon: Icon,
  children,
  inputs = [],
  outputs = [],
  className = '',
  nodeType = 'text',
  nodeId,
  status = NodeExecutionStatus.IDLE,
  progress,
}: BaseNodeProps) {
  const colors = nodeColors[nodeType] || nodeColors.text;
  const accentColor = colors.accent;
  const { deleteElements } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId) {
      deleteElements({ nodes: [{ id: nodeId }] });
    }
  };

  return (
    <Card className={`w-80 bg-card border-border shadow-lg overflow-visible py-0 ${className}`}>
      <CardHeader className={`p-0 border-b ${colors.header} border-border`}>
        <CardTitle className="text-xs font-semibold text-white flex items-center justify-between h-6 px-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0 h-full">
            <Icon className={`h-3 w-3 ${colors.icon} flex-shrink-0`} style={{ lineHeight: 1 }} />
            <span className="truncate leading-none">{title}</span>
            {nodeId && status !== NodeExecutionStatus.IDLE && (
              <NodeStatusIndicator
                nodeId={nodeId}
                status={status}
                progress={progress}
                className="ml-1"
              />
            )}
          </div>
          {nodeId && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 m-0 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground flex-shrink-0 flex items-center justify-center nodrag nopan"
            >
              <X className="h-2.5 w-2.5" style={{ lineHeight: 1 }} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 relative pt-3 overflow-visible">
        {/* Input Handles */}
        {inputs.map((input, index) => {
          const handleColor = handleColors[input.type || 'text'] || accentColor;
          const leftInputs = inputs.filter(i => i.position === Position.Left);
          const leftIndex = leftInputs.indexOf(input);
          const totalLeft = leftInputs.length;
          
          return (
            <Handle
              key={input.id}
              type="target"
              position={input.position}
              id={input.id}
              className="!w-4 !h-4 !border-2 !border-background !rounded-full !z-50"
              style={{
                backgroundColor: handleColor,
                borderColor: 'hsl(var(--background))',
                top: input.position === Position.Top ? '-8px' : undefined,
                left: input.position === Position.Left 
                  ? '-8px' 
                  : undefined,
                right: input.position === Position.Right ? '-8px' : undefined,
                bottom: input.position === Position.Bottom 
                  ? '-8px' 
                  : undefined,
                cursor: 'crosshair',
                boxShadow: `0 0 0 2px ${handleColor}40, 0 2px 4px rgba(0,0,0,0.3)`,
                transform: input.position === Position.Left && totalLeft > 1
                  ? `translateY(${(leftIndex - (totalLeft - 1) / 2) * 24}px)`
                  : undefined,
                pointerEvents: 'all',
              }}
              title={input.label || `${input.type} input`}
            />
          );
        })}

        {children}

        {/* Output Handles */}
        {outputs.map((output, index) => {
          const handleColor = handleColors[output.type || nodeType] || accentColor;
          const rightOutputs = outputs.filter(o => o.position === Position.Right);
          const rightIndex = rightOutputs.indexOf(output);
          const totalRight = rightOutputs.length;
          
          return (
            <Handle
              key={output.id}
              type="source"
              position={output.position}
              id={output.id}
              className="!w-4 !h-4 !border-2 !border-background !rounded-full !z-50"
              style={{
                backgroundColor: handleColor,
                borderColor: 'hsl(var(--background))',
                top: output.position === Position.Top ? '-8px' : undefined,
                left: output.position === Position.Left ? '-8px' : undefined,
                right: output.position === Position.Right ? '-8px' : undefined,
                bottom: output.position === Position.Bottom ? '-8px' : undefined,
                cursor: 'crosshair',
                boxShadow: `0 0 0 2px ${handleColor}40, 0 2px 4px rgba(0,0,0,0.3)`,
                transform: output.position === Position.Right && totalRight > 1
                  ? `translateY(${(rightIndex - (totalRight - 1) / 2) * 24}px)`
                  : undefined,
                pointerEvents: 'all',
              }}
              title={output.label || `${output.type} output`}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

