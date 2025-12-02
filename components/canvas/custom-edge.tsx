'use client';

import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, useReactFlow } from '@xyflow/react';
import { ConnectionLabelsManager } from '@/lib/canvas/connection-labels';

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
  sourceHandle,
  targetHandle,
  source,
  target,
  data,
}: EdgeProps) {
  const { getNodes } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get nodes from React Flow context
  const nodes = getNodes();
  
  // Get edge label
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

  // Get color from data or edge label
  const edgeColor = data?.color || edgeLabel?.color || 'hsl(var(--border))';
  const edgeLabelText = data?.label || edgeLabel?.label;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: edgeColor,
        }}
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
                color: edgeColor,
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

