'use client';

import { useCallback, useMemo } from 'react';
import { Node, Connection } from '@xyflow/react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ConnectionValidator } from '@/lib/canvas/connection-validator';
import { NODE_REGISTRY } from '@/lib/canvas/node-factory';
import { NodeType } from '@/lib/types/canvas';

interface HandleContextMenuProps {
  nodeId: string;
  handleId: string;
  handleType: 'source' | 'target';
  handleDataType: 'text' | 'image' | 'style' | 'material' | 'variants' | 'prompt-builder' | 'style-reference' | 'image-input';
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>;
  onConnect: (connection: Connection) => void;
  children: React.ReactNode;
}

export function HandleContextMenu({
  nodeId,
  handleId,
  handleType,
  handleDataType,
  nodes,
  edges,
  onConnect,
  children,
}: HandleContextMenuProps) {
  // Normalize handle data type to match ConnectionValidator types
  const normalizedHandleDataType = useMemo(() => {
    // Map node-specific types to their output types
    if (handleDataType === 'prompt-builder') return 'text';
    if (handleDataType === 'style-reference') return 'style';
    if (handleDataType === 'image-input') return 'image';
    return handleDataType as 'text' | 'image' | 'style' | 'material' | 'variants';
  }, [handleDataType]);

  // Find compatible nodes for this handle
  const compatibleNodes = useMemo(() => {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return [];

    const compatible: Array<{ node: Node; handleId: string; label: string }> = [];

    nodes.forEach(node => {
      // Skip self
      if (node.id === nodeId) return;

      const nodeDef = NODE_REGISTRY[node.type as NodeType];
      if (!nodeDef) return;

      if (handleType === 'target') {
        // This is an input handle - find nodes with compatible outputs
        const outputs = nodeDef.outputs || [];
        outputs.forEach(output => {
          if (ConnectionValidator.isTypeCompatible(output.type, normalizedHandleDataType)) {
            // Check if connection would create a cycle
            const testConnection: Connection = {
              source: node.id,
              sourceHandle: output.id,
              target: nodeId,
              targetHandle: handleId,
            };
            
            const wouldCycle = ConnectionValidator.wouldCreateCycle(
              testConnection,
              nodes,
              edges.map(e => ({ source: e.source, target: e.target }))
            );

            if (!wouldCycle) {
              compatible.push({
                node,
                handleId: output.id,
                label: `${nodeDef.label} → ${output.label || output.id}`,
              });
            }
          }
        });
      } else {
        // This is an output handle - find nodes with compatible inputs
        const inputs = nodeDef.inputs || [];
        inputs.forEach(input => {
          if (ConnectionValidator.isTypeCompatible(normalizedHandleDataType, input.type)) {
            // Check if connection would create a cycle
            const testConnection: Connection = {
              source: nodeId,
              sourceHandle: handleId,
              target: node.id,
              targetHandle: input.id,
            };
            
            const wouldCycle = ConnectionValidator.wouldCreateCycle(
              testConnection,
              nodes,
              edges.map(e => ({ source: e.source, target: e.target }))
            );

            if (!wouldCycle) {
              compatible.push({
                node,
                handleId: input.id,
                label: `${nodeDef.label} → ${input.label || input.id}`,
              });
            }
          }
        });
      }
    });

    return compatible;
  }, [nodeId, handleId, handleType, normalizedHandleDataType, nodes, edges]);

  const handleConnect = useCallback((targetNodeId: string, targetHandleId: string) => {
    if (handleType === 'source') {
      // Output handle - connect to target node's input
      onConnect({
        source: nodeId,
        sourceHandle: handleId,
        target: targetNodeId,
        targetHandle: targetHandleId,
      });
    } else {
      // Input handle - connect from source node's output
      onConnect({
        source: targetNodeId,
        sourceHandle: targetHandleId,
        target: nodeId,
        targetHandle: handleId,
      });
    }
  }, [nodeId, handleId, handleType, onConnect]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel>
          {handleType === 'source' ? 'Connect To' : 'Connect From'}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {compatibleNodes.length === 0 ? (
          <ContextMenuItem disabled>
            No compatible nodes found
          </ContextMenuItem>
        ) : (
          compatibleNodes.map(({ node, handleId: targetHandleId, label }) => {
            const nodeDef = NODE_REGISTRY[node.type as NodeType];
            return (
              <ContextMenuItem
                key={`${node.id}-${targetHandleId}`}
                onClick={() => handleConnect(node.id, targetHandleId)}
                className="cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {nodeDef.description}
                  </span>
                </div>
              </ContextMenuItem>
            );
          })
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

