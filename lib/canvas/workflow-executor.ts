/**
 * Workflow Execution Engine
 * Executes nodes in topological order based on dependencies
 */

import { Node, Edge } from '@xyflow/react';
import { NodeFactory, NODE_REGISTRY } from './node-factory';

export enum ExecutionMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SCHEDULED = 'scheduled',
  EVENT_DRIVEN = 'event',
}

export enum NodeExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export interface ExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentNodeId: string | null;
  completedNodes: string[];
  failedNodes: string[];
  skippedNodes: string[];
  results: Record<string, any>;
  startTime: number;
  endTime: number | null;
  mode: ExecutionMode;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
}

/**
 * Workflow Executor - Executes nodes in dependency order
 */
export class WorkflowExecutor {
  private executionState: ExecutionState;
  private executionOrder: string[] = [];
  private nodeDependencies: Map<string, string[]> = new Map();
  private nodeResults: Map<string, any> = new Map();

  constructor(mode: ExecutionMode = ExecutionMode.MANUAL) {
    this.executionState = {
      status: 'idle',
      currentNodeId: null,
      completedNodes: [],
      failedNodes: [],
      skippedNodes: [],
      results: {},
      startTime: 0,
      endTime: null,
      mode,
    };
  }

  /**
   * Build dependency graph from nodes and edges
   */
  buildDependencyGraph(nodes: Node[], edges: Edge[]): void {
    this.nodeDependencies.clear();
    this.nodeResults.clear();

    // Initialize dependencies for all nodes
    nodes.forEach((node) => {
      this.nodeDependencies.set(node.id, []);
    });

    // Build dependency map
    edges.forEach((edge) => {
      const targetDeps = this.nodeDependencies.get(edge.target) || [];
      if (!targetDeps.includes(edge.source)) {
        targetDeps.push(edge.source);
        this.nodeDependencies.set(edge.target, targetDeps);
      }
    });

    // Topological sort
    this.executionOrder = this.topologicalSort(nodes, edges);
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(nodes: Node[], edges: Edge[]): string[] {
    const inDegree: Map<string, number> = new Map();
    const graph: Map<string, string[]> = new Map();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      graph.set(node.id, []);
    });

    // Build graph and calculate in-degrees
    edges.forEach((edge) => {
      const source = edge.source;
      const target = edge.target;
      const targets = graph.get(source) || [];
      targets.push(target);
      graph.set(source, targets);
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    });

    // Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = graph.get(current) || [];
      neighbors.forEach((neighbor) => {
        const degree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, degree);
        if (degree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles or disconnected nodes');
    }

    return result;
  }

  /**
   * Get execution order
   */
  getExecutionOrder(): string[] {
    return [...this.executionOrder];
  }

  /**
   * Get dependencies for a node
   */
  getDependencies(nodeId: string): string[] {
    return [...(this.nodeDependencies.get(nodeId) || [])];
  }

  /**
   * Check if node is ready to execute (all dependencies completed)
   */
  isNodeReady(nodeId: string): boolean {
    const deps = this.getDependencies(nodeId);
    return deps.every((depId) => this.executionState.completedNodes.includes(depId));
  }

  /**
   * Get next nodes ready for execution
   */
  getReadyNodes(): string[] {
    return this.executionOrder.filter(
      (nodeId) =>
        !this.executionState.completedNodes.includes(nodeId) &&
        !this.executionState.failedNodes.includes(nodeId) &&
        !this.executionState.skippedNodes.includes(nodeId) &&
        this.isNodeReady(nodeId)
    );
  }

  /**
   * Start execution
   */
  async startExecution(
    nodes: Node[],
    edges: Edge[],
    executeNode: (nodeId: string, inputData: any) => Promise<any>
  ): Promise<ExecutionState> {
    this.buildDependencyGraph(nodes, edges);
    this.executionState.status = 'running';
    this.executionState.startTime = Date.now();
    this.executionState.completedNodes = [];
    this.executionState.failedNodes = [];
    this.executionState.skippedNodes = [];
    this.executionState.results = {};

    try {
      while (this.executionState.status === 'running') {
        const readyNodes = this.getReadyNodes();

        if (readyNodes.length === 0) {
          // No more nodes to execute
          if (
            this.executionState.completedNodes.length +
              this.executionState.failedNodes.length +
              this.executionState.skippedNodes.length ===
            nodes.length
          ) {
            this.executionState.status = 'completed';
            this.executionState.endTime = Date.now();
            break;
          } else {
            // Deadlock or error
            this.executionState.status = 'error';
            this.executionState.endTime = Date.now();
            throw new Error('Execution deadlock: no ready nodes but execution not complete');
          }
        }

        // Execute ready nodes (can be parallelized)
        const executionPromises = readyNodes.map(async (nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) {
            this.executionState.failedNodes.push(nodeId);
            return;
          }

          try {
            this.executionState.currentNodeId = nodeId;

            // Collect input data from dependencies
            const inputData = this.collectInputData(nodeId, nodes, edges);

            // Execute node
            const startTime = Date.now();
            const output = await executeNode(nodeId, inputData);
            const executionTime = Date.now() - startTime;

            // Store result
            this.nodeResults.set(nodeId, output);
            this.executionState.results[nodeId] = {
              output,
              executionTime,
              timestamp: Date.now(),
            };
            this.executionState.completedNodes.push(nodeId);
            this.executionState.currentNodeId = null;
          } catch (error: any) {
            this.executionState.failedNodes.push(nodeId);
            this.executionState.results[nodeId] = {
              error: error.message || 'Execution failed',
              timestamp: Date.now(),
            };
            this.executionState.currentNodeId = null;

            // Stop on error if configured
            if (this.executionState.mode === ExecutionMode.MANUAL) {
              throw error;
            }
          }
        });

        await Promise.all(executionPromises);
      }
    } catch (error) {
      this.executionState.status = 'error';
      this.executionState.endTime = Date.now();
      throw error;
    }

    return this.getState();
  }

  /**
   * Collect input data from connected nodes
   */
  private collectInputData(nodeId: string, nodes: Node[], edges: Edge[]): Record<string, any> {
    const inputData: Record<string, any> = {};
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return inputData;

    // Get all incoming edges
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    incomingEdges.forEach((edge) => {
      const sourceResult = this.nodeResults.get(edge.source);
      if (sourceResult) {
        // Map source output to target input
        const targetHandle = edge.targetHandle || '';
        if (targetHandle) {
          // Get output data from source node
          const sourceNode = nodes.find((n) => n.id === edge.source);
          if (sourceNode) {
            const sourceDef = NODE_REGISTRY[sourceNode.type as keyof typeof NODE_REGISTRY];
            const sourceOutput = sourceDef?.outputs?.find((o) => o.id === edge.sourceHandle);
            if (sourceOutput) {
              // Extract the relevant output from source result
              inputData[targetHandle] = sourceResult[sourceOutput.id] || sourceResult;
            } else {
              inputData[targetHandle] = sourceResult;
            }
          }
        }
      }
    });

    return inputData;
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (this.executionState.status === 'running') {
      this.executionState.status = 'paused';
    }
  }

  /**
   * Resume execution
   */
  resume(): void {
    if (this.executionState.status === 'paused') {
      this.executionState.status = 'running';
    }
  }

  /**
   * Stop execution
   */
  stop(): void {
    this.executionState.status = 'idle';
    this.executionState.currentNodeId = null;
    this.executionState.endTime = Date.now();
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionState {
    return { ...this.executionState };
  }

  /**
   * Get result for a specific node
   */
  getNodeResult(nodeId: string): any {
    return this.nodeResults.get(nodeId);
  }

  /**
   * Reset executor
   */
  reset(): void {
    this.executionState = {
      status: 'idle',
      currentNodeId: null,
      completedNodes: [],
      failedNodes: [],
      skippedNodes: [],
      results: {},
      startTime: 0,
      endTime: null,
      mode: this.executionState.mode,
    };
    this.nodeResults.clear();
  }
}











