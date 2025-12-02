'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextNode } from './nodes/text-node';
import { ImageNode } from './nodes/image-node';
import { VariantsNode } from './nodes/variants-node';
import { StyleNode } from './nodes/style-node';
import { MaterialNode } from './nodes/material-node';
import { CanvasToolbar } from './canvas-toolbar';
import { CustomEdge } from './custom-edge';
import { useCanvas } from '@/lib/hooks/use-canvas';
import { CanvasNode, NodeConnection } from '@/lib/types/canvas';
import { logger } from '@/lib/utils/logger';
import { NodeFactory, createNodesFromTemplate, NODE_TEMPLATES } from '@/lib/canvas/node-factory';
import { ConnectionValidator } from '@/lib/canvas/connection-validator';
import { CanvasHistory } from '@/lib/canvas/canvas-history';
import { ShortcutHandler } from '@/lib/canvas/canvas-shortcuts';
import { canvasErrorHandler } from '@/lib/canvas/error-handler';
import { WorkflowExporter } from '@/lib/canvas/workflow-export';
import { AutoLayout } from '@/lib/canvas/auto-layout';
import { WorkflowExecutor, ExecutionMode, NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { NodeStatusManager } from '@/lib/canvas/node-status';
import { NodeSearchManager } from '@/components/canvas/node-search';
import { MultiSelectManager } from '@/components/canvas/multi-select';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  variants: VariantsNode,
  style: StyleNode,
  material: MaterialNode,
};

const edgeTypes = {
  default: CustomEdge,
};

interface CanvasEditorProps {
  projectId: string;
  chainId: string;
  projectSlug: string;
  projectName: string;
  chainName: string;
}

// Component that uses ReactFlow hooks - must be inside ReactFlow
function CanvasControls({
  nodes,
  edges,
  setNodes,
  setEdges,
  history,
  shortcutHandler,
  canUndo,
  setCanUndo,
  canRedo,
  setCanRedo,
  saveGraph,
  reactFlowInstance,
}: {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  history: CanvasHistory;
  shortcutHandler: ShortcutHandler;
  canUndo: boolean;
  setCanUndo: (value: boolean) => void;
  canRedo: boolean;
  setCanRedo: (value: boolean) => void;
  saveGraph: (state: any) => void;
  reactFlowInstance: any;
}) {
  // Setup keyboard shortcuts that use ReactFlow instance
  useEffect(() => {
    if (!reactFlowInstance) return;

    shortcutHandler.on('delete-selected', () => {
      const selectedNodes = nodes.filter(n => n.selected);
      if (selectedNodes.length > 0) {
        reactFlowInstance.deleteElements({ nodes: selectedNodes });
      }
    });

    shortcutHandler.on('zoom-in', () => {
      reactFlowInstance.zoomIn();
    });

    shortcutHandler.on('zoom-out', () => {
      reactFlowInstance.zoomOut();
    });

    shortcutHandler.on('fit-view', () => {
      reactFlowInstance.fitView();
    });

    return () => {
      shortcutHandler.off('delete-selected');
      shortcutHandler.off('zoom-in');
      shortcutHandler.off('zoom-out');
      shortcutHandler.off('fit-view');
    };
  }, [nodes, shortcutHandler, reactFlowInstance]);

  return null; // This component doesn't render anything
}

// Inner component that uses ReactFlow hooks
function CanvasEditorInner({
  projectId,
  chainId,
  projectSlug,
  projectName,
  chainName,
  graph,
  loading,
  saveGraph,
}: CanvasEditorProps & {
  graph: any;
  loading: boolean;
  saveGraph: (state: any) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history] = useState(() => new CanvasHistory());
  const [shortcutHandler] = useState(() => new ShortcutHandler());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeExecutionStatus>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const multiSelectManager = useState(() => new MultiSelectManager())[0];
  const workflowExecutor = useState(() => new WorkflowExecutor(ExecutionMode.MANUAL))[0];
  const nodeStatusManager = useState(() => new NodeStatusManager())[0];

  // Handle node data updates from custom events
  useEffect(() => {
    const handleNodeDataUpdate = (event: CustomEvent) => {
      const { nodeId, data } = event.detail;
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data } : node))
      );
    };

    window.addEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
    return () => {
      window.removeEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
    };
  }, [setNodes]);

  // Handle node connections to pass data between nodes
  useEffect(() => {
    const handleConnectionData = () => {
      setNodes((nds) => {
        return nds.map((node) => {
          // Find incoming connections
          const incomingEdges = edges.filter((edge) => edge.target === node.id);
          
          if (node.type === 'image' && incomingEdges.length > 0) {
            const currentData = node.data as any;
            const updatedData = { ...currentData };

            // Find text node connected to image node (prompt input)
            const textEdge = incomingEdges.find((e) => e.targetHandle === 'prompt' && e.sourceHandle === 'text');
            if (textEdge) {
              const sourceNode = nds.find((n) => n.id === textEdge.source);
              if (sourceNode && sourceNode.type === 'text') {
                const textData = sourceNode.data as any;
                updatedData.prompt = textData.prompt || updatedData.prompt || '';
              }
            }

            // Find style node connected to image node (style input)
            const styleEdge = incomingEdges.find((e) => e.targetHandle === 'style' && e.sourceHandle === 'style');
            if (styleEdge) {
              const sourceNode = nds.find((n) => n.id === styleEdge.source);
              if (sourceNode && sourceNode.type === 'style') {
                const styleData = sourceNode.data as any;
                updatedData.styleSettings = styleData;
              }
            }

            // Find material node connected to image node (material input)
            const materialEdge = incomingEdges.find((e) => e.targetHandle === 'material' && e.sourceHandle === 'materials');
            if (materialEdge) {
              const sourceNode = nds.find((n) => n.id === materialEdge.source);
              if (sourceNode && sourceNode.type === 'material') {
                const materialData = sourceNode.data as any;
                updatedData.materialSettings = materialData;
              }
            }

            return {
              ...node,
              data: updatedData,
            };
          }

          if (node.type === 'variants' && incomingEdges.length > 0) {
            // Find image node connected to variants node
            const imageEdge = incomingEdges.find((e) => e.targetHandle === 'sourceImage' && e.sourceHandle === 'image');
            if (imageEdge) {
              const sourceNode = nds.find((n) => n.id === imageEdge.source);
              if (sourceNode?.type === 'image') {
                const imageData = sourceNode.data as any;
                const currentData = node.data as any;
                return {
                  ...node,
                  data: {
                    ...currentData,
                    sourceImageUrl: imageData.outputUrl || currentData.sourceImageUrl || '',
                  },
                };
              }
            }
          }

          return node;
        });
      });
    };

    handleConnectionData();
  }, [edges, setNodes]);

  // Convert canvas nodes to React Flow nodes - only on initial load
  const [initialLoad, setInitialLoad] = useState(true);
  
  useEffect(() => {
    if (initialLoad && !loading) {
      if (graph && graph.nodes && graph.nodes.length > 0) {
        const rfNodes: Node[] = graph.nodes.map((node: CanvasNode) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        }));
        setNodes(rfNodes);
        // Initialize history with loaded state
        history.initialize(rfNodes, []);
      } else if (!graph || !graph.nodes || graph.nodes.length === 0) {
        // Only create default node if no graph exists at all - use factory
        const defaultNode = NodeFactory.createNode('text', { x: 100, y: 100 });
        setNodes([defaultNode]);
        // Initialize history with default state
        history.initialize([defaultNode], []);
      }
      setInitialLoad(false);
    }
  }, [graph, loading, setNodes, initialLoad, history]);

  // Fit view after nodes are loaded and ReactFlow instance is ready
  useEffect(() => {
    if (!initialLoad && reactFlowInstance && nodes.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialLoad, reactFlowInstance, nodes.length]);

  // Convert canvas connections to React Flow edges
  useEffect(() => {
    if (graph && graph.connections) {
      const rfEdges: Edge[] = graph.connections.map((conn: NodeConnection) => ({
        id: conn.id,
        source: conn.source,
        sourceHandle: conn.sourceHandle,
        target: conn.target,
        targetHandle: conn.targetHandle,
      }));
      setEdges(rfEdges);
    }
  }, [graph, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      logger.log('🔌 Connection attempt:', params);
      
      // Validate connection using ConnectionValidator
      const validation = ConnectionValidator.validateConnection(params, nodes);
      
      if (!validation.valid) {
        logger.log('❌ Connection rejected:', validation.error);
        toast.error(validation.error || 'Invalid connection', {
          description: validation.hint,
        });
        canvasErrorHandler.handleError(
          canvasErrorHandler.createConnectionError(
            validation.error || 'Invalid connection',
            undefined,
            { hint: validation.hint }
          )
        );
        return;
      }

      // Check for cycles
      const wouldCycle = ConnectionValidator.wouldCreateCycle(
        params,
        nodes,
        edges.map(e => ({ source: e.source, target: e.target }))
      );

      if (wouldCycle) {
        logger.log('❌ Connection rejected: would create cycle');
        toast.error('Cannot create connection', {
          description: 'This connection would create a circular dependency',
        });
        return;
      }

      // Show warning if present
      if (validation.warning) {
        toast.warning(validation.warning);
      }

      // Show hint if present
      if (validation.hint) {
        logger.log('💡 Connection hint:', validation.hint);
      }

      logger.log('✅ Connection accepted:', { source: params.source, target: params.target });
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        // Push to history after connection
        history.pushState(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, edges, history]
  );

  // Define undo/redo handlers
  const handleUndo = useCallback(() => {
    const state = history.undo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
      toast.success('Undone');
    }
  }, [history, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const state = history.redo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
      toast.success('Redone');
    }
  }, [history, setNodes, setEdges]);

  // Setup keyboard shortcuts
  useEffect(() => {
    // Register shortcut handlers
    shortcutHandler.on('add-text-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('text', defaultPosition);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-image-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('image', defaultPosition);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-variants-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('variants', defaultPosition);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-style-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('style', defaultPosition);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-material-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('material', defaultPosition);
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('undo', handleUndo);
    shortcutHandler.on('redo', handleRedo);

    shortcutHandler.on('save', () => {
      const canvasNodes: CanvasNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: node.data as any,
        inputs: [],
        outputs: [],
      }));

      const canvasConnections: NodeConnection[] = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || '',
        target: edge.target,
        targetHandle: edge.targetHandle || '',
      }));

      saveGraph({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: { x: 0, y: 0, zoom: 1 },
      });
      toast.success('Canvas saved');
    });

    shortcutHandler.on('select-all', () => {
      setNodes((nds) => nds.map(n => ({ ...n, selected: true })));
    });

    shortcutHandler.on('deselect-all', () => {
      setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
    });

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcutHandler.handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    // Setup error handler
    const unsubscribe = canvasErrorHandler.onError((error) => {
      toast.error(error.message, {
        description: error.context ? JSON.stringify(error.context) : undefined,
      });
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, [nodes, edges, setNodes, setEdges, history, shortcutHandler, saveGraph, handleUndo, handleRedo]);

  // Update undo/redo state
  useEffect(() => {
    setCanUndo(history.canUndo());
    setCanRedo(history.canRedo());
  }, [nodes, edges, history]);

  // Push to history on node/edge changes (debounced)
  useEffect(() => {
    if (loading || initialLoad) return;

    const timeoutId = setTimeout(() => {
      history.pushState(nodes, edges);
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, loading, initialLoad, history]);

  // Auto-save on changes - but not on initial load
  useEffect(() => {
    if (loading || initialLoad || nodes.length === 0) return;

    const timeoutId = setTimeout(() => {
      const canvasNodes: CanvasNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: node.data as any,
        inputs: [],
        outputs: [],
      }));

      const canvasConnections: NodeConnection[] = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || '',
        target: edge.target,
        targetHandle: edge.targetHandle || '',
      }));

      saveGraph({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: { x: 0, y: 0, zoom: 1 },
      });
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, loading, initialLoad, saveGraph]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-foreground">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <CanvasToolbar
        projectId={projectId}
        projectSlug={projectSlug}
        projectName={projectName}
        chainId={chainId}
        chainName={chainName}
        onAddNode={(type) => {
          // Use factory to create node with smart positioning
          const defaultPosition = NodeFactory.getDefaultPosition(nodes);
          const newNode = NodeFactory.createNode(type, defaultPosition);
          setNodes((nds) => {
            const newNodes = [...nds, newNode];
            history.pushState(newNodes, edges);
            setCanUndo(history.canUndo());
            setCanRedo(history.canRedo());
            return newNodes;
          });
        }}
        onAddTemplate={(templateName) => {
          // Create nodes and edges from template
          const defaultPosition = NodeFactory.getDefaultPosition(nodes);
          const { nodes: templateNodes, edges: templateEdges } = createNodesFromTemplate(templateName, defaultPosition);
          
          // Convert template edges to React Flow Edge format
          const reactFlowEdges: Edge[] = templateEdges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: 'default',
          }));
          
          // Update nodes first
          setNodes((nds) => {
            const newNodes = [...nds, ...templateNodes];
            // Then update edges with the new nodes available
            setEdges((eds) => {
              const newEdges = [...eds, ...reactFlowEdges];
              // Update history after both are set
              history.pushState(newNodes, newEdges);
              setCanUndo(history.canUndo());
              setCanRedo(history.canRedo());
              return newEdges;
            });
            return newNodes;
          });
        }}
        onSave={() => {
          const canvasNodes: CanvasNode[] = nodes.map((node) => ({
            id: node.id,
            type: node.type as any,
            position: node.position,
            data: node.data as any,
            inputs: [],
            outputs: [],
          }));

          const canvasConnections: NodeConnection[] = edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle || '',
            target: edge.target,
            targetHandle: edge.targetHandle || '',
          }));

          saveGraph({
            nodes: canvasNodes,
            connections: canvasConnections,
            viewport: { x: 0, y: 0, zoom: 1 },
          });
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes.map((node) => {
            const status = nodeStatuses.get(node.id);
            return {
              ...node,
              data: {
                ...node.data,
                status: status || NodeExecutionStatus.IDLE,
              },
              className: highlightedNodeIds.includes(node.id) ? 'ring-2 ring-primary ring-offset-2' : undefined,
            };
          })}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={false}
          className="bg-background"
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          defaultEdgeOptions={{
            type: 'default',
            style: { strokeWidth: 2 },
            animated: false,
          }}
          connectionLineStyle={{ strokeWidth: 2 }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          connectionMode="loose"
          isValidConnection={(connection) => {
            // Use ConnectionValidator for validation
            const validation = ConnectionValidator.validateConnection(connection, nodes);
            if (!validation.valid) {
              return false;
            }
            // Check for cycles
            return !ConnectionValidator.wouldCreateCycle(
              connection,
              nodes,
              edges.map(e => ({ source: e.source, target: e.target }))
            );
          }}
          onInit={(instance) => {
            setReactFlowInstance(instance);
          }}
        >
          {reactFlowInstance && (
            <CanvasControls
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              history={history}
              shortcutHandler={shortcutHandler}
              canUndo={canUndo}
              setCanUndo={setCanUndo}
              canRedo={canRedo}
              setCanRedo={setCanRedo}
              saveGraph={saveGraph}
              reactFlowInstance={reactFlowInstance}
            />
          )}
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} className="[&_svg]:!stroke-border" />
          <Controls className="!bg-card !border-border [&_button]:!bg-secondary [&_button]:!border-border [&_button]:!text-foreground hover:[&_button]:!bg-accent hover:[&_button]:!text-accent-foreground" />
          <MiniMap
            className="!bg-card !border !border-border !rounded-md !shadow-lg"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                text: 'hsl(var(--primary))',
                image: '#4a9eff',
                variants: '#ff4a9e',
                style: '#ff9e4a',
                material: '#9e4aff',
              };
              return colors[node.type || 'text'] || 'hsl(var(--primary))';
            }}
            nodeStrokeWidth={3}
            nodeBorderRadius={4}
            maskColor="rgba(0, 0, 0, 0.4)"
            maskStrokeColor="rgba(255, 255, 255, 0.6)"
            maskStrokeWidth={2}
            pannable={false}
            zoomable={false}
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              width: '200px',
              height: '150px',
              zIndex: 10,
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// Outer wrapper component that provides ReactFlowProvider
export function CanvasEditor({
  projectId,
  chainId,
  projectSlug,
  projectName,
  chainName,
}: CanvasEditorProps) {
  const { graph, loading, saveGraph } = useCanvas(chainId);

  return (
    <ReactFlowProvider>
      <CanvasEditorInner
        projectId={projectId}
        chainId={chainId}
        projectSlug={projectSlug}
        projectName={projectName}
        chainName={chainName}
        graph={graph}
        loading={loading}
        saveGraph={saveGraph}
      />
    </ReactFlowProvider>
  );
}

