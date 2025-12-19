'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
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
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextNode } from './nodes/text-node';
import { ImageNode } from './nodes/image-node';
import { VariantsNode } from './nodes/variants-node';
import { StyleNode } from './nodes/style-node';
import { MaterialNode } from './nodes/material-node';
import { OutputNode } from './nodes/output-node';
import { PromptBuilderNode } from './nodes/prompt-builder-node';
import { StyleReferenceNode } from './nodes/style-reference-node';
import { ImageInputNode } from './nodes/image-input-node';
import { VideoNode } from './nodes/video-node';
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
import { useWakeLock } from '@/lib/hooks/use-wake-lock';
import { captureCanvasScreenshot, uploadCanvasScreenshot } from '@/lib/utils/canvas-screenshot';
import { updateCanvasFileAction } from '@/lib/actions/canvas-files.actions';
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import { useModalStore } from '@/lib/stores/modal-store';

const nodeTypes: NodeTypes = {
  text: TextNode as any,
  image: ImageNode as any,
  variants: VariantsNode as any,
  style: StyleNode as any,
  material: MaterialNode as any,
  output: OutputNode as any,
  'prompt-builder': PromptBuilderNode as any,
  'style-reference': StyleReferenceNode as any,
  'image-input': ImageInputNode as any,
  video: VideoNode as any,
};

const edgeTypes = {
  default: CustomEdge,
};

interface CanvasEditorProps {
  projectId: string;
  fileId: string;
  projectSlug: string;
  projectName: string;
  fileName: string;
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
  fileId,
  projectSlug,
  projectName,
  fileName,
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
  
  // ✅ NEW: Modal store for limit dialogs
  const { limitDialogOpen, limitDialogData, closeLimitDialog } = useModalStore();
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const multiSelectManager = useState(() => new MultiSelectManager())[0];
  const workflowExecutor = useState(() => new WorkflowExecutor(ExecutionMode.MANUAL))[0];
  const nodeStatusManager = useState(() => new NodeStatusManager())[0];
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  
  // Screen Wake Lock - Keep screen on during node execution/generation
  const isAnyNodeGenerating = Array.from(nodeStatuses.values()).some(
    status => status === NodeExecutionStatus.RUNNING
  ) || nodes.some(node => {
    const nodeData = node.data as any;
    return nodeData?.status === 'generating' || nodeData?.status === 'executing' || nodeData?.status === 'running';
  });
  useWakeLock(isAnyNodeGenerating);

  // Handle node data updates from custom events
  // ✅ FIXED: Update node data and trigger save - connection flow will handle propagation automatically
  useEffect(() => {
    let saveTimeoutId: NodeJS.Timeout | null = null;

    const handleNodeDataUpdate = (event: CustomEvent) => {
      const { nodeId, data } = event.detail;
      
      // ✅ FIXED: Log what data is being updated for debugging
      const nodeType = data?.type || 'unknown';
      const hasImageData = !!(data?.imageData || data?.imageUrl);
      const hasMaterials = !!(data?.materials && Array.isArray(data.materials) && data.materials.length > 0);
      const hasExtractedStyle = !!data?.extractedStyle;
      
      logger.log('📝 Node data update received:', {
        nodeId,
        nodeType,
        hasImageData,
        hasMaterials,
        hasExtractedStyle,
        dataKeys: Object.keys(data || {}),
      });
      
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data } : node))
      );
      
      // ✅ FIXED: Trigger immediate save when node data updates (especially for generating/completed states)
      // This ensures state is persisted to database immediately
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
      
      saveTimeoutId = setTimeout(() => {
        // Get current nodes state (will include the update)
        setNodes((currentNodes) => {
          const canvasNodes: CanvasNode[] = currentNodes.map((node) => {
            // ✅ FIXED: Ensure all data fields are included, but exclude base64 image data to prevent 10MB limit
            const nodeData = node.data as any;
            
            // ✅ FIXED: More comprehensive base64 exclusion - remove ALL base64 fields
            const {
              imageData,           // Base64 image data
              baseImageData,        // Base64 base image data
              // Keep these fields (they're not base64):
              imageUrl,
              imageType,
              imageName,
              baseImageUrl,
              baseImageType,
              materials,
              extractedStyle,
              styleExtraction,
              ...otherData
            } = nodeData;
            
            return {
              id: node.id,
              type: node.type as any,
              position: node.position,
              data: {
                ...otherData, // Include all other data fields
                // Explicitly preserve important fields (but NOT base64 data)
                imageUrl: imageUrl, // Keep URL, not base64
                imageType: imageType,
                imageName: imageName,
                baseImageUrl: baseImageUrl, // Keep URL if exists
                baseImageType: baseImageType,
                materials: materials,
                extractedStyle: extractedStyle,
                styleExtraction: styleExtraction,
                // DO NOT include imageData or baseImageData (base64) - they're too large and cause 10MB limit
              } as any,
              inputs: [],
              outputs: [],
            };
          });

          const canvasConnections: NodeConnection[] = edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle || '',
            target: edge.target,
            targetHandle: edge.targetHandle || '',
          }));

          logger.log('💾 Auto-saving canvas state after node update:', {
            nodeId,
            nodeCount: canvasNodes.length,
            nodeWithImageData: canvasNodes.find(n => (n.data as any)?.imageData)?.id,
            nodeWithMaterials: canvasNodes.find(n => (n.data as any)?.materials?.length > 0)?.id,
          });
          
          saveGraph({
            nodes: canvasNodes,
            connections: canvasConnections,
            viewport: { x: 0, y: 0, zoom: 1 },
          });
          
          return currentNodes; // Return unchanged to avoid re-render
        });
      }, 500); // Shorter debounce for important state changes
    };

    window.addEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
    return () => {
      window.removeEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [setNodes, edges, saveGraph]);

  // Create edge lookup maps for O(1) access instead of O(n) filtering
  const edgeLookup = useMemo(() => {
    const targetMap = new Map<string, Edge[]>();
    const sourceMap = new Map<string, Edge[]>();
    
    edges.forEach(edge => {
      if (!targetMap.has(edge.target)) {
        targetMap.set(edge.target, []);
      }
      targetMap.get(edge.target)!.push(edge);
      
      if (!sourceMap.has(edge.source)) {
        sourceMap.set(edge.source, []);
      }
      sourceMap.get(edge.source)!.push(edge);
    });
    
    return { targetMap, sourceMap };
  }, [edges]);

  // Create node lookup map for O(1) access
  const nodeLookup = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Handle node connections to pass data between nodes - optimized with lookup maps
  useEffect(() => {
    const handleConnectionData = () => {
      setNodes((nds) => {
        // Create lookup for current nodes
        const currentNodeMap = new Map(nds.map(n => [n.id, n]));
        let hasChanges = false;
        const updatedNodes = nds.map((node) => {
          const incomingEdges = edgeLookup.targetMap.get(node.id) || [];
          
          if (incomingEdges.length === 0) return node;

          if (node.type === 'image') {
            const currentData = node.data as any;
            const updatedData = { ...currentData };
            let changed = false;

            const textEdge = incomingEdges.find((e) => e.targetHandle === 'prompt' && e.sourceHandle === 'text');
            if (textEdge) {
              const sourceNode = currentNodeMap.get(textEdge.source);
              if (sourceNode?.type === 'text') {
                const textData = sourceNode.data as any;
                if (updatedData.prompt !== textData.prompt) {
                  updatedData.prompt = textData.prompt || updatedData.prompt || '';
                  changed = true;
                }
              }
            }

            const styleEdge = incomingEdges.find((e) => e.targetHandle === 'style' && e.sourceHandle === 'style');
            if (styleEdge) {
              const sourceNode = currentNodeMap.get(styleEdge.source);
              if (sourceNode?.type === 'style') {
                updatedData.styleSettings = sourceNode.data;
                changed = true;
              } else if (sourceNode?.type === 'style-reference') {
                // If style-reference node, use extracted style
                const styleRefData = sourceNode.data as any;
                if (styleRefData.extractedStyle) {
                  updatedData.styleSettings = styleRefData.extractedStyle;
                  changed = true;
                } else if (styleRefData.styles && styleRefData.styles.length > 0) {
                  // Fallback to manual styles if no extracted style
                  const selectedStyle = styleRefData.styles.find((s: any) => s.id === styleRefData.selectedStyleId) || styleRefData.styles[0];
                  if (selectedStyle?.style) {
                    updatedData.styleSettings = selectedStyle.style;
                    changed = true;
                  }
                }
              }
            }

            const materialEdge = incomingEdges.find((e) => e.targetHandle === 'material' && e.sourceHandle === 'materials');
            if (materialEdge) {
              const sourceNode = currentNodeMap.get(materialEdge.source);
              if (sourceNode?.type === 'material') {
                updatedData.materialSettings = sourceNode.data;
                changed = true;
              }
            }

            // Handle base image input (for image-to-image generation)
            const imageEdge = incomingEdges.find((e) => e.targetHandle === 'baseImage' && e.sourceHandle === 'image');
            if (imageEdge) {
              const sourceNode = currentNodeMap.get(imageEdge.source);
              if (sourceNode?.type === 'image-input') {
                const imageInputData = sourceNode.data as any;
                // ✅ FIXED: Use imageUrl instead of imageData (base64) to prevent 10MB limit
                // The image-to-image API can accept URLs, so we don't need base64
                if (imageInputData.imageUrl && imageInputData.imageUrl !== updatedData.baseImageData) {
                  updatedData.baseImageData = imageInputData.imageUrl; // Use URL, not base64
                  updatedData.baseImageType = imageInputData.imageType;
                  changed = true;
                }
              } else if (sourceNode?.type === 'image') {
                // Can also use output from another image node
                const imageData = sourceNode.data as any;
                if (imageData.outputUrl) {
                  // ✅ FIXED: Use URL directly, not base64
                  updatedData.baseImageData = imageData.outputUrl;
                  updatedData.baseImageType = 'image/png';
                  changed = true;
                }
              } else if (sourceNode?.type === 'output') {
                // Support Output Node → Image Node for iterative workflows
                const outputData = sourceNode.data as any;
                const imageUrl = outputData.imageUrl || outputData.variantUrl;
                if (imageUrl && imageUrl !== updatedData.baseImageData) {
                  updatedData.baseImageData = imageUrl;
                  updatedData.baseImageType = 'image/png';
                  changed = true;
                }
              }
            }

            if (changed) {
              hasChanges = true;
              return { ...node, data: updatedData };
            }
            return node;
          }

          // Handle video node connections
          if (node.type === 'video') {
            const currentData = node.data as any;
            const updatedData = { ...currentData };
            let changed = false;

            const textEdge = incomingEdges.find((e) => e.targetHandle === 'prompt' && e.sourceHandle === 'text');
            if (textEdge) {
              const sourceNode = currentNodeMap.get(textEdge.source);
              if (sourceNode?.type === 'text') {
                const textData = sourceNode.data as any;
                if (updatedData.prompt !== textData.prompt) {
                  updatedData.prompt = textData.prompt || updatedData.prompt || '';
                  changed = true;
                }
              } else if (sourceNode?.type === 'prompt-builder') {
                const promptBuilderData = sourceNode.data as any;
                if (updatedData.prompt !== promptBuilderData.generatedPrompt) {
                  updatedData.prompt = promptBuilderData.generatedPrompt || updatedData.prompt || '';
                  changed = true;
                }
              }
            }

            // Handle base image input (for image-to-video generation)
            const imageEdge = incomingEdges.find((e) => e.targetHandle === 'baseImage' && e.sourceHandle === 'image');
            if (imageEdge) {
              const sourceNode = currentNodeMap.get(imageEdge.source);
              if (sourceNode?.type === 'image-input') {
                const imageInputData = sourceNode.data as any;
                // ✅ FIXED: Use imageUrl instead of imageData (base64) to prevent 10MB limit
                // The video generation API can accept URLs, so we don't need base64
                if (imageInputData.imageUrl && imageInputData.imageUrl !== updatedData.baseImageData) {
                  updatedData.baseImageData = imageInputData.imageUrl; // Use URL, not base64
                  updatedData.baseImageType = imageInputData.imageType;
                  changed = true;
                }
              } else if (sourceNode?.type === 'image') {
                // Support Image Node output → Video Node (image-to-video from generated images)
                const imageData = sourceNode.data as any;
                if (imageData.outputUrl) {
                  // ✅ FIXED: Use URL directly, not base64
                  updatedData.baseImageData = imageData.outputUrl;
                  updatedData.baseImageType = 'image/png';
                  changed = true;
                }
              } else if (sourceNode?.type === 'output') {
                // Support Output Node → Video Node for iterative workflows
                const outputData = sourceNode.data as any;
                const imageUrl = outputData.imageUrl || outputData.variantUrl;
                if (imageUrl && imageUrl !== updatedData.baseImageData) {
                  updatedData.baseImageData = imageUrl;
                  updatedData.baseImageType = 'image/png';
                  changed = true;
                }
              }
            }

            if (changed) {
              hasChanges = true;
              return { ...node, data: updatedData };
            }
            return node;
          }

          if (node.type === 'variants') {
            const currentData = node.data as any;
            const updatedData = { ...currentData };
            let changed = false;

            // ✅ FIXED: Get source image from connected image node
            const imageEdge = incomingEdges.find((e) => e.targetHandle === 'sourceImage' && e.sourceHandle === 'image');
            if (imageEdge) {
              const sourceNode = currentNodeMap.get(imageEdge.source);
              if (sourceNode?.type === 'image') {
                const imageData = sourceNode.data as any;
                const newUrl = imageData.outputUrl || currentData.sourceImageUrl || '';
                if (currentData.sourceImageUrl !== newUrl) {
                  updatedData.sourceImageUrl = newUrl;
                  updatedData.prompt = imageData.prompt || currentData.prompt; // Get prompt from source image
                  changed = true;
                }
              } else if (sourceNode?.type === 'image-input') {
                const imageInputData = sourceNode.data as any;
                const newUrl = imageInputData.imageUrl || currentData.sourceImageUrl || '';
                if (currentData.sourceImageUrl !== newUrl) {
                  updatedData.sourceImageUrl = newUrl;
                  changed = true;
                }
              }
            }

            // ✅ NEW: Get style settings from connected style/style-reference node
            const styleEdge = incomingEdges.find((e) => e.targetHandle === 'style' && e.sourceHandle === 'style');
            if (styleEdge) {
              const sourceNode = currentNodeMap.get(styleEdge.source);
              if (sourceNode?.type === 'style') {
                updatedData.styleSettings = sourceNode.data;
                changed = true;
              } else if (sourceNode?.type === 'style-reference') {
                const styleRefData = sourceNode.data as any;
                if (styleRefData.extractedStyle) {
                  updatedData.styleSettings = styleRefData.extractedStyle;
                  updatedData.styleReference = styleRefData; // Also store reference for context
                  changed = true;
                }
              }
            }

            // ✅ NEW: Get material settings from connected material node
            const materialEdge = incomingEdges.find((e) => e.targetHandle === 'materials' && e.sourceHandle === 'materials');
            if (materialEdge) {
              const sourceNode = currentNodeMap.get(materialEdge.source);
              if (sourceNode?.type === 'material') {
                updatedData.materialSettings = sourceNode.data;
                changed = true;
              }
            }

            if (changed) {
              hasChanges = true;
              return {
                ...node,
                data: updatedData,
              };
            }
            return node;
          }

          if (node.type === 'output') {
            const currentData = node.data as any;
            const updatedData = { ...currentData };
            let changed = false;

            const imageEdge = incomingEdges.find((e) => e.targetHandle === 'image' && e.sourceHandle === 'image');
            if (imageEdge) {
              const sourceNode = currentNodeMap.get(imageEdge.source);
              if (sourceNode?.type === 'image') {
                const imageData = sourceNode.data as any;
                const newUrl = imageData.outputUrl || '';
                if (updatedData.imageUrl !== newUrl) {
                  updatedData.imageUrl = newUrl;
                  updatedData.status = newUrl ? 'ready' : 'idle';
                  changed = true;
                }
              }
            }

            // ✅ FIXED: Handle dynamic variant outputs (variant-0, variant-1, etc.)
            // Support both old format (variants) and new format (variant-0, variant-1, ...)
            // Find the edge that connects to THIS output node's 'image' input
            const variantsEdge = incomingEdges.find((e) => 
              (e.targetHandle === 'image' && e.sourceHandle?.startsWith('variant-')) ||
              (e.targetHandle === 'variants' && e.sourceHandle === 'variants')
            );
            if (variantsEdge) {
              const sourceNode = currentNodeMap.get(variantsEdge.source);
              if (sourceNode?.type === 'variants') {
                const variantsData = sourceNode.data as any;
                
                // Extract variant index from handle ID (e.g., "variant-0" -> 0)
                let variantIndex = -1;
                if (variantsEdge.sourceHandle?.startsWith('variant-')) {
                  const indexStr = variantsEdge.sourceHandle.replace('variant-', '');
                  variantIndex = parseInt(indexStr, 10);
                }
                
                // If we have a specific variant index, use that variant
                // Otherwise, fall back to selected variant (for backward compatibility)
                let targetVariant = null;
                if (variantIndex >= 0 && variantsData.variants && variantsData.variants[variantIndex]) {
                  targetVariant = variantsData.variants[variantIndex];
                } else {
                  targetVariant = variantsData.variants?.find((v: any) => v.id === variantsData.selectedVariantId);
                }
                
                if (targetVariant) {
                  // Use variantUrl for variant connections, imageUrl for image connections
                  const newUrl = targetVariant.url || '';
                  if (updatedData.variantUrl !== newUrl) {
                    updatedData.variantUrl = newUrl;
                    updatedData.variantId = targetVariant.id;
                    updatedData.status = 'ready';
                    changed = true;
                  }
                }
              }
            }

            if (changed) {
              hasChanges = true;
              return { ...node, data: updatedData };
            }
            return node;
          }

          if (node.type === 'text') {
            const promptEdge = incomingEdges.find((e) => 
              e.sourceHandle === 'prompt' && e.targetHandle === 'text'
            );
            if (promptEdge) {
              const sourceNode = currentNodeMap.get(promptEdge.source);
              if (sourceNode?.type === 'prompt-builder') {
                const promptBuilderData = sourceNode.data as any;
                const currentData = node.data as any;
                const newPrompt = promptBuilderData.generatedPrompt || currentData.prompt || '';
                if (currentData.prompt !== newPrompt) {
                  hasChanges = true;
                  return {
                    ...node,
                    data: { ...currentData, prompt: newPrompt },
                  };
                }
              }
            }
            return node;
          }

          return node;
        });

        return hasChanges ? updatedNodes : nds;
      });
    };

    // Debounce connection data updates to avoid excessive re-renders
    const timeoutId = setTimeout(handleConnectionData, 50);
    return () => clearTimeout(timeoutId);
  }, [edges, setNodes, edgeLookup, nodes]); // ✅ Added nodes dependency to trigger when node data updates

  // Memoize nodes with status and highlighting to avoid re-rendering on every change
  const memoizedNodes = useMemo(() => 
    nodes.map((node) => {
      const status = nodeStatuses.get(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          status: status || NodeExecutionStatus.IDLE,
        },
        className: highlightedNodeIds.includes(node.id) ? 'ring-2 ring-primary ring-offset-2' : undefined,
      };
    }), 
    [nodes, nodeStatuses, highlightedNodeIds]
  );

  // Convert canvas nodes to React Flow nodes - only on initial load
  const [initialLoad, setInitialLoad] = useState(true);
  const [edgesLoaded, setEdgesLoaded] = useState(false);
  
  useEffect(() => {
    if (initialLoad && !loading) {
      if (graph && graph.nodes && graph.nodes.length > 0) {
        const rfNodes: Node[] = graph.nodes.map((node: CanvasNode) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node.data,
            // ✅ CRITICAL: Inject projectId and fileId into node data for render creation
            projectId: projectId,
            fileId: fileId,
          },
        }));
        setNodes(rfNodes);
        // ✅ FIXED: Don't initialize history here - wait for edges to load
        // History will be initialized in the edges loading effect
        logger.log('✅ Nodes loaded from graph:', { count: rfNodes.length });
      } else if (!graph || !graph.nodes || graph.nodes.length === 0) {
        // Only create default node if no graph exists at all - use factory
        const defaultNode = NodeFactory.createNode('text', { x: 100, y: 100 });
        // ✅ CRITICAL: Inject projectId and fileId into default node
        defaultNode.data = {
          ...defaultNode.data,
          projectId: projectId,
          fileId: fileId,
        };
        setNodes([defaultNode]);
        // Initialize history with default state (no edges yet)
        history.initialize([defaultNode], []);
        setEdgesLoaded(true); // Mark edges as loaded (empty set)
      }
      setInitialLoad(false);
    }
  }, [graph, loading, setNodes, initialLoad, history, projectId, fileId]);

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

  // Convert canvas connections to React Flow edges - ONLY on initial load
  // ✅ FIXED: Only load edges from graph on initial load to prevent overwriting newly created edges
  useEffect(() => {
    // Only load edges on initial load when graph is first available and nodes are loaded
    if (!initialLoad && !edgesLoaded && !loading && nodes.length > 0) {
      if (graph && graph.connections && graph.connections.length > 0) {
        // Ensure nodes exist before loading edges that reference them
        const nodeIds = new Set(nodes.map(n => n.id));
        
        // Use a Set to track unique edge IDs and prevent duplicates
        const seenIds = new Set<string>();
        const rfEdges: Edge[] = graph.connections
          .map((conn: NodeConnection) => {
            // Skip edges that reference non-existent nodes
            if (!nodeIds.has(conn.source) || !nodeIds.has(conn.target)) {
              logger.log('⚠️ Skipping edge - node not found:', { source: conn.source, target: conn.target });
              return null;
            }
            
            // Generate a unique ID if not present or if duplicate
            let edgeId = conn.id || `${conn.source}-${conn.target}-${conn.sourceHandle || 'default'}-${conn.targetHandle || 'default'}`;
            
            // If ID already seen, make it unique
            if (seenIds.has(edgeId)) {
              edgeId = `${edgeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            seenIds.add(edgeId);
            
            return {
              id: edgeId,
              source: conn.source,
              sourceHandle: conn.sourceHandle,
              target: conn.target,
              targetHandle: conn.targetHandle,
            };
          })
          .filter((edge): edge is Edge => edge !== null)
          .filter((edge, index, self) => 
            // Also filter by connection uniqueness (same source/target/handles)
            index === self.findIndex(e => 
              e.source === edge.source &&
              e.target === edge.target &&
              e.sourceHandle === edge.sourceHandle &&
              e.targetHandle === edge.targetHandle
            )
          );
        
        logger.log('✅ Loading edges from graph:', { count: rfEdges.length, nodesCount: nodes.length });
        setEdges(rfEdges);
        // Initialize history with loaded nodes and edges
        history.initialize(nodes, rfEdges);
        setEdgesLoaded(true);
      } else {
        // No edges in graph, but nodes are loaded - initialize history with empty edges
        history.initialize(nodes, []);
        setEdgesLoaded(true);
      }
    }
  }, [graph, setEdges, nodes, loading, initialLoad, edgesLoaded, history]);

  // Memoize isValidConnection callback - must be at top level (Rules of Hooks)
  const isValidConnection = useCallback((connection: Connection) => {
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
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      logger.log('🔌 Connection attempt:', params);
      
      // ✅ FIXED: Use current nodes and edges from state, not stale closures
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          // Validate connection using ConnectionValidator with current state
          const validation = ConnectionValidator.validateConnection(params, currentNodes);
          
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
            return currentEdges; // Return unchanged edges
          }

          // Check for cycles with current edges
          const wouldCycle = ConnectionValidator.wouldCreateCycle(
            params,
            currentNodes,
            currentEdges.map(e => ({ source: e.source, target: e.target }))
          );

          if (wouldCycle) {
            logger.log('❌ Connection rejected: would create cycle');
            toast.error('Cannot create connection', {
              description: 'This connection would create a circular dependency',
            });
            return currentEdges; // Return unchanged edges
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
          
          // Check if this connection already exists
          const existingEdge = currentEdges.find(
            e => e.source === params.source &&
                 e.target === params.target &&
                 e.sourceHandle === params.sourceHandle &&
                 e.targetHandle === params.targetHandle
          );
          
          if (existingEdge) {
            logger.log('⚠️ Connection already exists, skipping');
            return currentEdges;
          }
          
          const newEdges = addEdge(params, currentEdges);
          
          // Ensure all edges have unique IDs
          const seenIds = new Set<string>();
          const edgesWithUniqueIds = newEdges.map((edge) => {
            if (seenIds.has(edge.id)) {
              // Generate a unique ID
              const uniqueId = `${edge.source}-${edge.target}-${edge.sourceHandle || 'default'}-${edge.targetHandle || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              seenIds.add(uniqueId);
              return { ...edge, id: uniqueId };
            }
            seenIds.add(edge.id);
            return edge;
          });
          
          // Push to history after connection with current state
          history.pushState(currentNodes, edgesWithUniqueIds);
          setCanUndo(history.canUndo());
          setCanRedo(history.canRedo());
          
          logger.log('✅ Edge added successfully:', { edgeId: edgesWithUniqueIds[edgesWithUniqueIds.length - 1]?.id, totalEdges: edgesWithUniqueIds.length });
          return edgesWithUniqueIds;
        });
        return currentNodes; // Return unchanged nodes
      });
    },
    [setEdges, setNodes, history, setCanUndo, setCanRedo]
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
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-image-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('image', defaultPosition);
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-variants-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('variants', defaultPosition);
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-style-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('style', defaultPosition);
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-material-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('material', defaultPosition);
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
      setNodes((nds) => {
        const newNodes = [...nds, newNode];
        history.pushState(newNodes, edges);
        return newNodes;
      });
    });

    shortcutHandler.on('add-output-node', () => {
      const defaultPosition = NodeFactory.getDefaultPosition(nodes);
      const newNode = NodeFactory.createNode('output', defaultPosition);
      // ✅ CRITICAL: Inject projectId and fileId into new node
      newNode.data = { ...newNode.data, projectId, fileId };
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
  // ✅ FIXED: Only auto-save after edges are loaded to prevent overwriting with incomplete state
  useEffect(() => {
    if (loading || initialLoad || !edgesLoaded || nodes.length === 0) return;

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

      logger.log('💾 Auto-saving canvas state:', { nodes: canvasNodes.length, edges: canvasConnections.length });
      saveGraph({
        nodes: canvasNodes,
        connections: canvasConnections,
        viewport: { x: 0, y: 0, zoom: 1 },
      });
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, loading, initialLoad, edgesLoaded, saveGraph]);

  // Capture screenshot on component unmount or navigation
  useEffect(() => {
    let isMounted = true;
    let hasCaptured = false;

    const captureScreenshotOnExit = async () => {
      if (!reactFlowInstance || !fileId || hasCaptured || isCapturingScreenshot) {
        return;
      }

      try {
        hasCaptured = true;
        setIsCapturingScreenshot(true);
        const screenshotDataUrl = await captureCanvasScreenshot(reactFlowInstance, fileId);
        
        if (screenshotDataUrl && isMounted) {
          // Upload screenshot and update file
          const uploadResult = await uploadCanvasScreenshot(fileId, screenshotDataUrl);
          
          if (uploadResult && isMounted) {
            // Update canvas file with thumbnail URL
            const formData = new FormData();
            formData.append('thumbnailUrl', uploadResult.thumbnailUrl);
            formData.append('thumbnailKey', uploadResult.thumbnailKey);
            
            await updateCanvasFileAction(fileId, formData);
            logger.log('✅ Canvas screenshot captured and saved');
          }
        }
      } catch (error) {
        logger.error('Error capturing canvas screenshot:', error);
      } finally {
        if (isMounted) {
          setIsCapturingScreenshot(false);
        }
      }
    };

    // Capture on unmount
    return () => {
      isMounted = false;
      captureScreenshotOnExit();
    };
  }, [reactFlowInstance, fileId]);

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
        fileId={fileId}
        fileName={fileName}
        onAddNode={(type) => {
          // Use factory to create node with smart positioning
          const defaultPosition = NodeFactory.getDefaultPosition(nodes);
          const newNode = NodeFactory.createNode(type, defaultPosition);
          // ✅ CRITICAL: Inject projectId and fileId into new node
          newNode.data = {
            ...newNode.data,
            projectId: projectId,
            fileId: fileId,
          };
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
          
          // ✅ CRITICAL: Inject projectId and fileId into template nodes
          const nodesWithContext = templateNodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              projectId: projectId,
              fileId: fileId,
            },
          }));
          
          // Update nodes first
          setNodes((nds) => {
            const newNodes = [...nds, ...nodesWithContext];
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
          nodes={memoizedNodes}
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
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'default',
            style: { 
              strokeWidth: 2,
              // ✅ UPDATED: Solid edges instead of dashed
            },
            animated: false,
          }}
          connectionLineStyle={{ 
            strokeWidth: 2,
            // ✅ UPDATED: Solid connection preview instead of dashed
          }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          connectionMode={ConnectionMode.Strict}
          isValidConnection={isValidConnection}
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
            className="!bg-card !border !border-border !rounded-tl-md !shadow-lg"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                text: 'hsl(var(--primary))',
                image: '#4a9eff',
                variants: '#ff4a9e',
                style: '#ff9e4a',
                material: '#9e4aff',
                output: '#4aff9e',
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
            offsetScale={10}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '200px',
              height: '150px',
              zIndex: 10,
              borderBottomRightRadius: 0,
              borderTopRightRadius: 0,
            }}
          />
        </ReactFlow>
      </div>
      
      {/* ✅ NEW: Limit Reached Dialog */}
      <LimitReachedDialog
        isOpen={limitDialogOpen}
        onClose={() => closeLimitDialog()}
        limitType={limitDialogData?.limitType || 'credits'}
        current={limitDialogData?.current || 0}
        limit={limitDialogData?.limit ?? null}
        planName={limitDialogData?.planName || 'Free'}
        message={limitDialogData?.message}
      />
    </div>
  );
}

// Outer wrapper component that provides ReactFlowProvider
export function CanvasEditor({
  projectId,
  fileId,
  projectSlug,
  projectName,
  fileName,
}: CanvasEditorProps) {
  const { graph, loading, saveGraph } = useCanvas(fileId);

  return (
    <ReactFlowProvider>
      <CanvasEditorInner
        projectId={projectId}
        fileId={fileId}
        projectSlug={projectSlug}
        projectName={projectName}
        fileName={fileName}
        graph={graph}
        loading={loading}
        saveGraph={saveGraph}
      />
    </ReactFlowProvider>
  );
}

