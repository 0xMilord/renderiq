/**
 * Workflow Export/Import System
 * Handles exporting and importing workflows in various formats
 */

import { Node, Edge } from '@xyflow/react';
import { CanvasNode, NodeConnection } from '@/lib/types/canvas';

export interface WorkflowExport {
  version: string;
  name?: string;
  description?: string;
  nodes: CanvasNode[];
  connections: NodeConnection[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

/**
 * Workflow Exporter
 */
export class WorkflowExporter {
  /**
   * Export workflow to JSON
   */
  static exportToJSON(
    nodes: Node[],
    edges: Edge[],
    metadata?: { name?: string; description?: string }
  ): string {
    const canvasNodes: CanvasNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type as any,
      position: node.position,
      data: node.data as any,
      inputs: [],
      outputs: [],
    }));

    const connections: NodeConnection[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle || '',
      target: edge.target,
      targetHandle: edge.targetHandle || '',
    }));

    const exportData: WorkflowExport = {
      version: '1.0',
      name: metadata?.name,
      description: metadata?.description,
      nodes: canvasNodes,
      connections,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export workflow to file
   */
  static exportToFile(
    nodes: Node[],
    edges: Edge[],
    filename: string = 'workflow.json',
    metadata?: { name?: string; description?: string }
  ): void {
    const json = this.exportToJSON(nodes, edges, metadata);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import workflow from JSON
   */
  static importFromJSON(json: string): {
    nodes: Node[];
    edges: Edge[];
    metadata?: { name?: string; description?: string };
  } {
    try {
      const data: WorkflowExport = JSON.parse(json);

      const nodes: Node[] = data.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data as unknown as Record<string, unknown>,
      }));

      const edges: Edge[] = data.connections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
      }));

      return {
        nodes,
        edges,
        metadata: {
          name: data.name,
          description: data.description,
        },
      };
    } catch (error) {
      throw new Error(`Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import workflow from file
   */
  static async importFromFile(file: File): Promise<{
    nodes: Node[];
    edges: Edge[];
    metadata?: { name?: string; description?: string };
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const result = this.importFromJSON(json);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Export to PNG (visual diagram)
   */
  static async exportToPNG(
    canvasElement: HTMLElement,
    filename: string = 'workflow.png'
  ): Promise<void> {
    // This would require html2canvas or similar library
    // For now, return a placeholder
    throw new Error('PNG export not yet implemented. Use html2canvas library.');
  }

  /**
   * Export to SVG
   */
  static exportToSVG(
    nodes: Node[],
    edges: Edge[],
    filename: string = 'workflow.svg'
  ): void {
    // Generate SVG representation
    const svg = this.generateSVG(nodes, edges);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate SVG representation
   */
  private static generateSVG(nodes: Node[], edges: Edge[]): string {
    // Calculate bounds
    const minX = Math.min(...nodes.map((n) => n.position.x), 0);
    const maxX = Math.max(...nodes.map((n) => n.position.x + 320), 1000);
    const minY = Math.min(...nodes.map((n) => n.position.y), 0);
    const maxY = Math.max(...nodes.map((n) => n.position.y + 200), 1000);

    const width = maxX - minX + 200;
    const height = maxY - minY + 200;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;

    // Draw edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        const x1 = sourceNode.position.x - minX + 160;
        const y1 = sourceNode.position.y - minY + 100;
        const x2 = targetNode.position.x - minX + 160;
        const y2 = targetNode.position.y - minY + 100;
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="2"/>`;
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const x = node.position.x - minX + 100;
      const y = node.position.y - minY + 100;
      svg += `<rect x="${x}" y="${y}" width="320" height="200" fill="#f0f0f0" stroke="#333" stroke-width="2" rx="4"/>`;
      svg += `<text x="${x + 10}" y="${y + 20}" font-family="Arial" font-size="12" fill="#333">${node.type}</text>`;
    });

    svg += '</svg>';
    return svg;
  }
}

