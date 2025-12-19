/**
 * Auto Layout System
 * Provides automatic node positioning using layout algorithms
 */

import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type LayoutAlgorithm = 'dagre' | 'hierarchical' | 'force';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSpacing?: { x: number; y: number };
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Auto Layout - Automatically positions nodes
 */
export class AutoLayout {
  /**
   * Apply Dagre layout algorithm
   */
  static applyDagreLayout(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
  ): Node[] {
    const {
      direction = 'LR',
      nodeWidth = 320,
      nodeHeight = 200,
      nodeSpacing = { x: 100, y: 100 },
      rankSep = 100,
      nodeSep = 50,
    } = options;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: nodeSep,
      ranksep: rankSep,
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply positions to nodes
    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });
  }

  /**
   * Apply hierarchical layout (simple top-to-bottom)
   */
  static applyHierarchicalLayout(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
  ): Node[] {
    const {
      nodeWidth = 320,
      nodeHeight = 200,
      nodeSpacing = { x: 400, y: 250 },
    } = options;

    // Build dependency levels
    const levels: string[][] = [];
    const nodeLevels: Map<string, number> = new Map();
    const visited = new Set<string>();

    // Find root nodes (no incoming edges)
    const rootNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    // Assign levels using BFS
    const queue: Array<{ nodeId: string; level: number }> = [];
    rootNodes.forEach((node) => {
      queue.push({ nodeId: node.id, level: 0 });
      nodeLevels.set(node.id, 0);
    });

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      // Ensure level array exists
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(nodeId);

      // Process children
      edges
        .filter((edge) => edge.source === nodeId)
        .forEach((edge) => {
          if (!nodeLevels.has(edge.target)) {
            const childLevel = level + 1;
            nodeLevels.set(edge.target, childLevel);
            queue.push({ nodeId: edge.target, level: childLevel });
          }
        });
    }

    // Position nodes based on levels
    const positionedNodes = nodes.map((node) => {
      const level = nodeLevels.get(node.id) || 0;
      const nodesInLevel = levels[level] || [];
      const indexInLevel = nodesInLevel.indexOf(node.id);

      return {
        ...node,
        position: {
          x: indexInLevel * nodeSpacing.x + 100,
          y: level * nodeSpacing.y + 100,
        },
      };
    });

    return positionedNodes;
  }

  /**
   * Apply layout based on algorithm type
   */
  static applyLayout(
    nodes: Node[],
    edges: Edge[],
    algorithm: LayoutAlgorithm = 'dagre',
    options: LayoutOptions = {}
  ): Node[] {
    switch (algorithm) {
      case 'dagre':
        return this.applyDagreLayout(nodes, edges, options);
      case 'hierarchical':
        return this.applyHierarchicalLayout(nodes, edges, options);
      default:
        return nodes;
    }
  }

  /**
   * Center all nodes in viewport
   */
  static centerNodes(nodes: Node[], viewportWidth: number, viewportHeight: number): Node[] {
    if (nodes.length === 0) return nodes;

    // Calculate bounding box
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x + 320)); // Assuming node width
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + 200)); // Assuming node height

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    // Calculate offset to center
    const offsetX = (viewportWidth - graphWidth) / 2 - minX;
    const offsetY = (viewportHeight - graphHeight) / 2 - minY;

    // Apply offset
    return nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
    }));
  }
}













