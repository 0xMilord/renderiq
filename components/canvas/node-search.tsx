/**
 * Node Search and Filter System
 * Provides search and filter functionality for nodes
 */

import { Node, Edge } from '@xyflow/react';
import { NODE_REGISTRY } from '@/lib/canvas/node-factory';

export interface SearchFilters {
  query?: string;
  category?: 'input' | 'processing' | 'output' | 'utility' | 'all';
  nodeType?: string;
  hasConnections?: boolean;
}

export class NodeSearchManager {
  /**
   * Search nodes by query
   */
  static searchNodes(nodes: Node[], query: string): Node[] {
    if (!query.trim()) return nodes;

    const lowerQuery = query.toLowerCase();
    return nodes.filter((node) => {
      const def = NODE_REGISTRY[node.type as keyof typeof NODE_REGISTRY];
      const title = def?.label || node.type;
      const description = def?.description || '';
      const nodeData = JSON.stringify(node.data || {}).toLowerCase();

      return (
        title.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery) ||
        nodeData.includes(lowerQuery) ||
        node.id.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Filter nodes by category
   */
  static filterByCategory(nodes: Node[], category: SearchFilters['category']): Node[] {
    if (!category || category === 'all') return nodes;

    return nodes.filter((node) => {
      const def = NODE_REGISTRY[node.type as keyof typeof NODE_REGISTRY];
      return def?.category === category;
    });
  }

  /**
   * Filter nodes by type
   */
  static filterByType(nodes: Node[], nodeType: string): Node[] {
    if (!nodeType) return nodes;
    return nodes.filter((node) => node.type === nodeType);
  }

  /**
   * Filter nodes by connection status
   */
  static filterByConnections(nodes: Node[], edges: Edge[], hasConnections: boolean): Node[] {
    if (hasConnections === undefined) return nodes;

    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    return nodes.filter((node) => {
      const isConnected = connectedNodeIds.has(node.id);
      return hasConnections ? isConnected : !isConnected;
    });
  }

  /**
   * Apply all filters
   */
  static applyFilters(
    nodes: Node[],
    edges: Edge[],
    filters: SearchFilters
  ): { filteredNodes: Node[]; highlightedIds: string[] } {
    let filtered = [...nodes];

    // Apply search query
    if (filters.query) {
      filtered = this.searchNodes(filtered, filters.query);
    }

    // Apply category filter
    if (filters.category) {
      filtered = this.filterByCategory(filtered, filters.category);
    }

    // Apply type filter
    if (filters.nodeType) {
      filtered = this.filterByType(filtered, filters.nodeType);
    }

    // Apply connection filter
    if (filters.hasConnections !== undefined) {
      filtered = this.filterByConnections(filtered, edges, filters.hasConnections);
    }

    // Get highlighted IDs (nodes matching search query)
    const highlightedIds = filters.query
      ? this.searchNodes(nodes, filters.query).map((n) => n.id)
      : [];

    return { filteredNodes: filtered, highlightedIds };
  }

  /**
   * Find nodes by name/type
   */
  static findNodes(nodes: Node[], searchTerm: string): Node[] {
    return this.searchNodes(nodes, searchTerm);
  }

  /**
   * Find connections for a node
   */
  static findConnections(nodeId: string, edges: Edge[]): Edge[] {
    return edges.filter((e) => e.source === nodeId || e.target === nodeId);
  }
}







