/**
 * Node Status System
 * Manages execution status for nodes
 */

import { NodeExecutionStatus } from './workflow-executor';

export interface NodeStatus {
  nodeId: string;
  status: NodeExecutionStatus;
  progress?: number; // 0-100
  message?: string;
  executionTime?: number;
  error?: string;
}

/**
 * Node Status Manager
 */
export class NodeStatusManager {
  private statuses: Map<string, NodeStatus> = new Map();

  /**
   * Set status for a node
   */
  setStatus(nodeId: string, status: NodeStatus): void {
    this.statuses.set(nodeId, { ...status });
  }

  /**
   * Get status for a node
   */
  getStatus(nodeId: string): NodeStatus | undefined {
    return this.statuses.get(nodeId);
  }

  /**
   * Update status
   */
  updateStatus(nodeId: string, updates: Partial<NodeStatus>): void {
    const current = this.statuses.get(nodeId);
    if (current) {
      this.statuses.set(nodeId, { ...current, ...updates });
    } else {
      this.statuses.set(nodeId, {
        nodeId,
        status: NodeExecutionStatus.IDLE,
        ...updates,
      });
    }
  }

  /**
   * Clear status
   */
  clearStatus(nodeId: string): void {
    this.statuses.delete(nodeId);
  }

  /**
   * Clear all statuses
   */
  clearAll(): void {
    this.statuses.clear();
  }

  /**
   * Get all statuses
   */
  getAllStatuses(): NodeStatus[] {
    return Array.from(this.statuses.values());
  }

  /**
   * Get status color
   */
  static getStatusColor(status: NodeExecutionStatus): string {
    const colors: Record<NodeExecutionStatus, string> = {
      [NodeExecutionStatus.IDLE]: 'hsl(var(--muted-foreground))',
      [NodeExecutionStatus.RUNNING]: 'hsl(var(--primary))',
      [NodeExecutionStatus.COMPLETED]: '#22c55e',
      [NodeExecutionStatus.ERROR]: '#ef4444',
      [NodeExecutionStatus.SKIPPED]: 'hsl(var(--muted-foreground))',
    };
    return colors[status] || colors[NodeExecutionStatus.IDLE];
  }

  /**
   * Get status icon
   */
  static getStatusIcon(status: NodeExecutionStatus): string {
    const icons: Record<NodeExecutionStatus, string> = {
      [NodeExecutionStatus.IDLE]: 'circle',
      [NodeExecutionStatus.RUNNING]: 'loader',
      [NodeExecutionStatus.COMPLETED]: 'check',
      [NodeExecutionStatus.ERROR]: 'x',
      [NodeExecutionStatus.SKIPPED]: 'skip',
    };
    return icons[status] || icons[NodeExecutionStatus.IDLE];
  }
}





