/**
 * Connection Validation System
 * Validates node connections based on type compatibility and node definitions
 */

import { Connection } from '@xyflow/react';
import { Node } from '@xyflow/react';
import { NodeFactory, NODE_REGISTRY } from './node-factory';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  hint?: string;
}

export interface ConnectionType {
  type: 'text' | 'image' | 'style' | 'material' | 'variants';
  label: string;
}

/**
 * Connection Validator - Validates node connections
 */
export class ConnectionValidator {
  /**
   * Validate a connection between two nodes
   */
  static validateConnection(
    connection: Connection,
    nodes: Node[]
  ): ValidationResult {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return {
        valid: false,
        error: 'Connection is missing required parameters',
      };
    }

    // Prevent self-connections
    if (connection.source === connection.target) {
      return {
        valid: false,
        error: 'Cannot connect a node to itself',
      };
    }

    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return {
        valid: false,
        error: 'Source or target node not found',
      };
    }

    // Get node definitions
    const sourceDef = NODE_REGISTRY[sourceNode.type as keyof typeof NODE_REGISTRY];
    const targetDef = NODE_REGISTRY[targetNode.type as keyof typeof NODE_REGISTRY];

    if (!sourceDef || !targetDef) {
      return {
        valid: false,
        error: 'Invalid node type',
      };
    }

    // Find source output
    const sourceOutput = sourceDef.outputs?.find(o => o.id === connection.sourceHandle);
    if (!sourceOutput) {
      return {
        valid: false,
        error: `Source node does not have output '${connection.sourceHandle}'`,
      };
    }

    // Find target input
    const targetInput = targetDef.inputs?.find(i => i.id === connection.targetHandle);
    if (!targetInput) {
      return {
        valid: false,
        error: `Target node does not have input '${connection.targetHandle}'`,
      };
    }

    // Check type compatibility
    const typeCompatible = this.isTypeCompatible(sourceOutput.type, targetInput.type);
    if (!typeCompatible) {
      return {
        valid: false,
        error: `Type mismatch: Cannot connect ${sourceOutput.type} to ${targetInput.type}`,
        hint: `Expected ${targetInput.type}, got ${sourceOutput.type}`,
      };
    }

    // Check if target input already has a connection (for required inputs)
    // This is handled by React Flow, but we can provide a warning
    if (targetInput.required) {
      return {
        valid: true,
        hint: `Connecting to required input: ${targetInput.label}`,
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Check if two types are compatible
   */
  static isTypeCompatible(
    sourceType: 'text' | 'image' | 'style' | 'material' | 'variants',
    targetType: 'text' | 'image' | 'style' | 'material' | 'variants'
  ): boolean {
    // Exact match
    if (sourceType === targetType) {
      return true;
    }

    // Type compatibility rules
    const compatibilityMap: Record<string, string[]> = {
      text: ['text'], // Text can only connect to text
      image: ['image', 'variants'], // Image can connect to image or variants
      style: ['style'], // Style can only connect to style
      material: ['material'], // Material can only connect to material
      variants: ['variants'], // Variants can only connect to variants
    };

    const compatibleTypes = compatibilityMap[sourceType] || [];
    return compatibleTypes.includes(targetType);
  }

  /**
   * Get connection type hint
   */
  static getConnectionHint(
    sourceNodeId: string,
    sourceHandle: string,
    nodes: Node[]
  ): string | null {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return null;

    const sourceDef = NODE_REGISTRY[sourceNode.type as keyof typeof NODE_REGISTRY];
    if (!sourceDef) return null;

    const output = sourceDef.outputs?.find(o => o.id === sourceHandle);
    if (!output) return null;

    return `Output: ${output.label} (${output.type})`;
  }

  /**
   * Get valid target inputs for a source output
   */
  static getValidTargets(
    sourceType: string,
    sourceHandle: string,
    nodes: Node[]
  ): Array<{ nodeId: string; inputId: string; label: string }> {
    const sourceDef = NODE_REGISTRY[sourceType as keyof typeof NODE_REGISTRY];
    if (!sourceDef) return [];

    const sourceOutput = sourceDef.outputs?.find(o => o.id === sourceHandle);
    if (!sourceOutput) return [];

    const validTargets: Array<{ nodeId: string; inputId: string; label: string }> = [];

    nodes.forEach(node => {
      const targetDef = NODE_REGISTRY[node.type as keyof typeof NODE_REGISTRY];
      if (!targetDef || !targetDef.inputs) return;

      targetDef.inputs.forEach(input => {
        if (this.isTypeCompatible(sourceOutput.type, input.type)) {
          validTargets.push({
            nodeId: node.id,
            inputId: input.id,
            label: input.label,
          });
        }
      });
    });

    return validTargets;
  }

  /**
   * Check if connection would create a cycle
   */
  static wouldCreateCycle(
    connection: Connection,
    nodes: Node[],
    edges: Array<{ source: string; target: string }>
  ): boolean {
    // Simple cycle detection: if target can reach source, it's a cycle
    const visited = new Set<string>();
    const queue = [connection.target];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === connection.source) {
        return true; // Cycle detected
      }

      if (visited.has(current)) continue;
      visited.add(current);

      // Find all nodes that this node connects to
      edges
        .filter(e => e.source === current)
        .forEach(e => {
          if (!visited.has(e.target)) {
            queue.push(e.target);
          }
        });
    }

    return false;
  }

  /**
   * Validate all connections in the graph
   */
  static validateGraph(
    nodes: Node[],
    edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>
  ): Array<{ edgeId: string; result: ValidationResult }> {
    return edges.map(edge => ({
      edgeId: edge.id,
      result: this.validateConnection(
        {
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || '',
          targetHandle: edge.targetHandle || '',
        },
        nodes
      ),
    }));
  }
}









