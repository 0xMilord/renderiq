/**
 * Multi-Select System
 * Handles selection of multiple nodes for bulk operations
 */

import { Node, Edge } from '@xyflow/react';

export interface SelectionState {
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
}

export class MultiSelectManager {
  private selection: SelectionState = {
    selectedNodeIds: new Set(),
    selectedEdgeIds: new Set(),
  };

  /**
   * Select a node
   */
  selectNode(nodeId: string): void {
    this.selection.selectedNodeIds.add(nodeId);
  }

  /**
   * Deselect a node
   */
  deselectNode(nodeId: string): void {
    this.selection.selectedNodeIds.delete(nodeId);
  }

  /**
   * Toggle node selection
   */
  toggleNode(nodeId: string): void {
    if (this.selection.selectedNodeIds.has(nodeId)) {
      this.deselectNode(nodeId);
    } else {
      this.selectNode(nodeId);
    }
  }

  /**
   * Select multiple nodes
   */
  selectNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => this.selection.selectedNodeIds.add(id));
  }

  /**
   * Select all nodes
   */
  selectAll(nodes: Node[]): void {
    this.selection.selectedNodeIds = new Set(nodes.map((n) => n.id));
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selection.selectedNodeIds.clear();
    this.selection.selectedEdgeIds.clear();
  }

  /**
   * Check if node is selected
   */
  isSelected(nodeId: string): boolean {
    return this.selection.selectedNodeIds.has(nodeId);
  }

  /**
   * Get selected nodes
   */
  getSelectedNodes(nodes: Node[]): Node[] {
    return nodes.filter((n) => this.selection.selectedNodeIds.has(n.id));
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selection.selectedNodeIds.size;
  }

  /**
   * Apply selection to nodes (for React Flow)
   */
  applySelectionToNodes(nodes: Node[]): Node[] {
    return nodes.map((node) => ({
      ...node,
      selected: this.selection.selectedNodeIds.has(node.id),
    }));
  }
}









