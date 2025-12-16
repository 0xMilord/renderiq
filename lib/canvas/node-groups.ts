/**
 * Node Groups System
 * Organize nodes into collapsible groups/subgraphs
 */

import { Node, Edge } from '@xyflow/react';

export interface NodeGroup {
  id: string;
  name: string;
  nodes: string[];
  collapsed: boolean;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex?: number;
}

/**
 * Node Groups Manager
 */
export class NodeGroupsManager {
  private groups: Map<string, NodeGroup> = new Map();

  /**
   * Create a new group
   */
  createGroup(
    name: string,
    nodeIds: string[],
    position: { x: number; y: number } = { x: 0, y: 0 }
  ): NodeGroup {
    const id = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const group: NodeGroup = {
      id,
      name,
      nodes: [...nodeIds],
      collapsed: false,
      color: this.getRandomColor(),
      position,
      size: { width: 400, height: 300 },
      zIndex: 0,
    };

    this.groups.set(id, group);
    return group;
  }

  /**
   * Get group by ID
   */
  getGroup(groupId: string): NodeGroup | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Get all groups
   */
  getAllGroups(): NodeGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Add nodes to group
   */
  addNodesToGroup(groupId: string, nodeIds: string[]): void {
    const group = this.groups.get(groupId);
    if (group) {
      nodeIds.forEach((nodeId) => {
        if (!group.nodes.includes(nodeId)) {
          group.nodes.push(nodeId);
        }
      });
    }
  }

  /**
   * Remove nodes from group
   */
  removeNodesFromGroup(groupId: string, nodeIds: string[]): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.nodes = group.nodes.filter((id) => !nodeIds.includes(id));
      if (group.nodes.length === 0) {
        this.groups.delete(groupId);
      }
    }
  }

  /**
   * Toggle group collapse
   */
  toggleGroup(groupId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.collapsed = !group.collapsed;
    }
  }

  /**
   * Update group position
   */
  updateGroupPosition(groupId: string, position: { x: number; y: number }): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.position = position;
    }
  }

  /**
   * Update group size
   */
  updateGroupSize(groupId: string, size: { width: number; height: number }): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.size = size;
    }
  }

  /**
   * Delete group
   */
  deleteGroup(groupId: string): void {
    this.groups.delete(groupId);
  }

  /**
   * Get group containing a node
   */
  getGroupForNode(nodeId: string): NodeGroup | undefined {
    for (const group of this.groups.values()) {
      if (group.nodes.includes(nodeId)) {
        return group;
      }
    }
    return undefined;
  }

  /**
   * Calculate group bounds from nodes
   */
  calculateGroupBounds(nodes: Node[], nodeIds: string[]): {
    position: { x: number; y: number };
    size: { width: number; height: number };
  } {
    const groupNodes = nodes.filter((n) => nodeIds.includes(n.id));
    if (groupNodes.length === 0) {
      return { position: { x: 0, y: 0 }, size: { width: 400, height: 300 } };
    }

    const minX = Math.min(...groupNodes.map((n) => n.position.x));
    const maxX = Math.max(...groupNodes.map((n) => n.position.x + 320));
    const minY = Math.min(...groupNodes.map((n) => n.position.y));
    const maxY = Math.max(...groupNodes.map((n) => n.position.y + 200));

    return {
      position: { x: minX - 20, y: minY - 40 },
      size: {
        width: maxX - minX + 40,
        height: maxY - minY + 60,
      },
    };
  }

  /**
   * Get random color for group
   */
  private getRandomColor(): string {
    const colors = [
      'rgba(59, 130, 246, 0.1)', // blue
      'rgba(16, 185, 129, 0.1)', // green
      'rgba(245, 158, 11, 0.1)', // yellow
      'rgba(239, 68, 68, 0.1)', // red
      'rgba(139, 92, 246, 0.1)', // purple
      'rgba(236, 72, 153, 0.1)', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}











