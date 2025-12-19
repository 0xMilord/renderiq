'use client';

import { createContext, useContext, ReactNode } from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasHistory } from '@/lib/canvas/canvas-history';
import { WorkflowExecutor } from '@/lib/canvas/workflow-executor';
import { NodeStatusManager } from '@/lib/canvas/node-status';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

/**
 * Shared Canvas Context
 * Provides canvas-level state and utilities to all nodes and canvas components
 * This ensures consistent state management across the entire canvas
 */
interface CanvasContextValue {
  // Core state
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  
  // History management
  history: CanvasHistory;
  canUndo: boolean;
  canRedo: boolean;
  setCanUndo: (value: boolean) => void;
  setCanRedo: (value: boolean) => void;
  
  // Node execution
  workflowExecutor: WorkflowExecutor;
  nodeStatusManager: NodeStatusManager;
  nodeStatuses: Map<string, NodeExecutionStatus>;
  setNodeStatuses: (statuses: Map<string, NodeExecutionStatus>) => void;
  
  // Canvas metadata
  projectId: string;
  fileId: string;
  
  // Utility functions
  getNodeById: (nodeId: string) => Node | undefined;
  getEdgesForNode: (nodeId: string) => Edge[];
  getIncomingEdges: (nodeId: string) => Edge[];
  getOutgoingEdges: (nodeId: string) => Edge[];
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within CanvasContextProvider');
  }
  return context;
}

interface CanvasContextProviderProps {
  children: ReactNode;
  value: CanvasContextValue;
}

export function CanvasContextProvider({ children, value }: CanvasContextProviderProps) {
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

