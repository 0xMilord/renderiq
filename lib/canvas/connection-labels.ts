/**
 * Connection Labels System
 * Adds labels to edges showing data types and flow information
 */

import { Edge } from '@xyflow/react';
import { NODE_REGISTRY } from './node-factory';
import { Node } from '@xyflow/react';

export interface EdgeLabel {
  edgeId: string;
  label: string;
  type: string;
  color: string;
}

/**
 * Connection Labels Manager
 */
export class ConnectionLabelsManager {
  /**
   * Get label for an edge
   */
  static getEdgeLabel(edge: Edge, nodes: Node[]): EdgeLabel | null {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return null;

    const sourceDef = NODE_REGISTRY[sourceNode.type as keyof typeof NODE_REGISTRY];
    const targetDef = NODE_REGISTRY[targetNode.type as keyof typeof NODE_REGISTRY];

    if (!sourceDef || !targetDef) return null;

    const sourceOutput = sourceDef.outputs?.find((o) => o.id === edge.sourceHandle);
    const targetInput = targetDef.inputs?.find((i) => i.id === edge.targetHandle);

    if (!sourceOutput || !targetInput) return null;

    const typeColors: Record<string, string> = {
      text: '#6bcf33',
      image: '#4a9eff',
      style: '#ff9e4a',
      material: '#9e4aff',
      variants: '#ff4a9e',
    };

    return {
      edgeId: edge.id,
      label: sourceOutput.label || sourceOutput.type,
      type: sourceOutput.type,
      color: typeColors[sourceOutput.type] || '#666',
    };
  }

  /**
   * Get all edge labels
   */
  static getAllEdgeLabels(edges: Edge[], nodes: Node[]): EdgeLabel[] {
    return edges
      .map((edge) => this.getEdgeLabel(edge, nodes))
      .filter((label): label is EdgeLabel => label !== null);
  }
}



