'use client';

import React, { useMemo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, useReactFlow } from '@xyflow/react';
import { ConnectionLabelsManager } from '@/lib/canvas/connection-labels';

// Node colors matching base-node.tsx
const nodeColors: Record<string, string> = {
  text: '#6bcf33',
  image: '#4a9eff',
  variants: '#ff4a9e',
  style: '#ff9e4a',
  material: '#9e4aff',
  output: '#4aff9e',
  'prompt-builder': '#00d4ff',
  'style-reference': '#ffb84a',
  'image-input': '#4a9eff',
  video: '#9e4aff',
};

/**
 * Darken a hex color by a percentage (0-1)
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken by multiplying by (1 - percent)
  const darkenedR = Math.round(r * (1 - percent));
  const darkenedG = Math.round(g * (1 - percent));
  const darkenedB = Math.round(b * (1 - percent));
  
  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`;
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
  data,
  ...props
}: EdgeProps) {
  const sourceHandle = (props as any).sourceHandle;
  const targetHandle = (props as any).targetHandle;
  const { getNodes } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Memoize nodes lookup - only call getNodes() once
  const nodes = useMemo(() => getNodes(), [getNodes]);
  
  // Memoize source node lookup
  const sourceNode = useMemo(() => {
    return nodes.find(n => n.id === source);
  }, [source, nodes]);
  
  // Memoize edge color calculation
  const edgeColor = useMemo(() => {
    const sourceNodeColor = sourceNode?.type ? nodeColors[sourceNode.type] : null;
    const edgeColorFromNode = sourceNodeColor ? darkenColor(sourceNodeColor, 0.4) : null;
    
    // Get edge label (only if needed)
    const edgeLabel = ConnectionLabelsManager.getEdgeLabel(
      {
        id,
        source,
        target,
        sourceHandle: sourceHandle || '',
        targetHandle: targetHandle || '',
      } as any,
      nodes
    );

    return (edgeColorFromNode || data?.color || edgeLabel?.color || 'hsl(var(--border))') as string;
  }, [sourceNode, data?.color, id, source, target, sourceHandle, targetHandle, nodes]);

  // Memoize edge label text
  const edgeLabelText = useMemo(() => {
    if (data?.label) return data.label as string;
    const edgeLabel = ConnectionLabelsManager.getEdgeLabel(
      {
        id,
        source,
        target,
        sourceHandle: sourceHandle || '',
        targetHandle: targetHandle || '',
      } as any,
      nodes
    );
    return edgeLabel?.label as string | undefined;
  }, [data?.label, id, source, target, sourceHandle, targetHandle, nodes]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: edgeColor as string,
          strokeDasharray: '5,5', // Dashed line pattern: 5px dash, 5px gap
        } as React.CSSProperties}
      />
      {edgeLabelText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: 'hsl(var(--card))',
                border: `1px solid ${edgeColor}`,
                borderRadius: '4px',
                padding: '2px 6px',
                color: edgeColor as string,
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {edgeLabelText}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

