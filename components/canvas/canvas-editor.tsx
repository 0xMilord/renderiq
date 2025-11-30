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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextNode } from './nodes/text-node';
import { ImageNode } from './nodes/image-node';
import { VariantsNode } from './nodes/variants-node';
import { StyleNode } from './nodes/style-node';
import { MaterialNode } from './nodes/material-node';
import { CanvasToolbar } from './canvas-toolbar';
import { useCanvas } from '@/lib/hooks/use-canvas';
import { CanvasNode, NodeConnection } from '@/lib/types/canvas';

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  variants: VariantsNode,
  style: StyleNode,
  material: MaterialNode,
};

interface CanvasEditorProps {
  projectId: string;
  chainId: string;
  projectSlug: string;
  projectName: string;
  chainName: string;
}

export function CanvasEditor({
  projectId,
  chainId,
  projectSlug,
  projectName,
  chainName,
}: CanvasEditorProps) {
  const { graph, loading, saveGraph } = useCanvas(chainId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
      } else if (!graph || !graph.nodes || graph.nodes.length === 0) {
        // Only create default node if no graph exists at all
        const defaultNodes: Node[] = [
          {
            id: `text-${Date.now()}`,
            type: 'text',
            position: { x: 100, y: 100 },
            data: { prompt: '', placeholder: 'Enter your prompt...' },
          },
        ];
        setNodes(defaultNodes);
      }
      setInitialLoad(false);
    }
  }, [graph, loading, setNodes, initialLoad]);

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
      console.log('🔌 Connection attempt:', params);
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
        console.log('❌ Connection rejected: missing params');
        return;
      }
      
      // Prevent self-connections
      if (params.source === params.target) {
        console.log('❌ Connection rejected: self-connection');
        return;
      }
      
      // Validate connection types match
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode) {
        console.log('✅ Connection accepted:', { source: sourceNode.type, target: targetNode.type });
        // Allow connection - React Flow will handle validation
        setEdges((eds) => addEdge(params, eds));
      } else {
        console.log('❌ Connection rejected: nodes not found');
      }
    },
    [setEdges, nodes]
  );

  // Auto-save on changes - but not on initial load
  useEffect(() => {
    if (loading || initialLoad || nodes.length === 0) return;

    const timeoutId = setTimeout(() => {
      const canvasNodes: CanvasNode[] = nodes.map((node) => ({
        id: node.id,
        type: node.type as any,
        position: node.position,
        data: node.data as any,
        inputs: [], // Will be populated by node components
        outputs: [], // Will be populated by node components
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
          const newNode: Node = {
            id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            position: { 
              x: Math.random() * 400 + 100, 
              y: Math.random() * 400 + 100 
            },
            data: getDefaultNodeData(type),
          };
          setNodes((nds) => {
            // Ensure unique IDs
            const existingIds = new Set(nds.map(n => n.id));
            if (existingIds.has(newNode.id)) {
              newNode.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            return [...nds, newNode];
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
      />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          defaultEdgeOptions={{
            style: { strokeWidth: 2 },
            animated: false,
          }}
          connectionLineStyle={{ strokeWidth: 2 }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          connectionMode="loose"
          isValidConnection={(connection) => {
            // Allow all connections for now
            return connection.source !== connection.target;
          }}
        >
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
            maskColor="rgba(0, 0, 0, 0.6)"
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

function getDefaultNodeData(type: string): any {
  switch (type) {
    case 'text':
      return { prompt: '', placeholder: 'Enter your prompt...' };
    case 'image':
      return {
        prompt: '',
        settings: {
          style: 'architectural',
          quality: 'standard',
          aspectRatio: '16:9',
        },
        status: 'idle',
      };
    case 'variants':
      return {
        count: 4,
        settings: {
          variationStrength: 0.5,
          quality: 'standard',
        },
        status: 'idle',
        variants: [],
      };
    case 'style':
      return {
        camera: {
          focalLength: 35,
          fStop: 5.6,
          position: 'eye-level',
          angle: 'three-quarter',
        },
        environment: {
          scene: 'exterior',
          weather: 'sunny',
          timeOfDay: 'afternoon',
          season: 'summer',
        },
        lighting: {
          intensity: 70,
          direction: 'side',
          color: 'warm',
          shadows: 'soft',
        },
        atmosphere: {
          mood: 'professional',
          contrast: 50,
          saturation: 50,
        },
      };
    case 'material':
      return {
        materials: [],
      };
    default:
      return {};
  }
}

