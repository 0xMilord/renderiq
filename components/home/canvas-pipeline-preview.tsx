'use client';

import { useMemo, useEffect, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, Node, Edge, Background, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextNode } from '@/components/canvas/nodes/text-node';
import { ImageNode } from '@/components/canvas/nodes/image-node';
import { VariantsNode } from '@/components/canvas/nodes/variants-node';
import { StyleNode } from '@/components/canvas/nodes/style-node';
import { MaterialNode } from '@/components/canvas/nodes/material-node';
import { OutputNode } from '@/components/canvas/nodes/output-node';
import { CustomEdge } from '@/components/canvas/custom-edge';
import { AutoLayout } from '@/lib/canvas/auto-layout';

const nodeTypes = {
  text: TextNode as any,
  image: ImageNode as any,
  variants: VariantsNode as any,
  style: StyleNode as any,
  material: MaterialNode as any,
  output: OutputNode as any,
};

const edgeTypes = {
  default: CustomEdge,
};

// Inner component that uses React Flow hooks
function CanvasPipelineInner() {
  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!hasFitted.current) {
      setTimeout(() => {
        fitView({ padding: 0.1, maxZoom: 0.5 });
        hasFitted.current = true;
      }, 100);
    }
  }, [fitView]);

  return null;
}

export function CanvasPipelinePreview() {
  // Create a complete pipeline: Text + Style + Material → Image → Variants → Output
  const rawNodes: Node[] = useMemo(() => [
    {
      id: 'text-1',
      type: 'text',
      position: { x: 0, y: 0 },
      data: {
        prompt: 'Modern minimalist architecture with floor-to-ceiling windows',
        placeholder: 'Enter your prompt...',
      },
      draggable: false,
      selectable: false,
    },
    {
      id: 'style-1',
      type: 'style',
      position: { x: 0, y: 0 },
      data: {
        camera: {
          focalLength: 24,
          fStop: 2.8,
          position: 'eye-level',
          angle: 'straight-on',
        },
        lighting: {
          intensity: 80,
          direction: 'natural',
          color: 'warm',
          shadows: 'soft',
        },
        environment: {
          scene: 'interior',
          weather: 'clear',
          timeOfDay: 'golden-hour',
          season: 'spring',
        },
        atmosphere: {
          mood: 'serene',
          contrast: 70,
          saturation: 85,
        },
      },
      draggable: false,
      selectable: false,
    },
    {
      id: 'material-1',
      type: 'material',
      position: { x: 0, y: 0 },
      data: {
        materials: [
          {
            id: 'mat-1',
            name: 'Walls',
            type: 'wall',
            material: 'concrete',
            color: 'white',
            finish: 'matte',
          },
        ],
      },
      draggable: false,
      selectable: false,
    },
    {
      id: 'image-1',
      type: 'image',
      position: { x: 0, y: 0 },
      data: {
        prompt: '',
        settings: {
          style: 'architectural',
          quality: 'standard',
          aspectRatio: '16:9',
        },
        status: 'idle',
      },
      draggable: false,
      selectable: false,
    },
    {
      id: 'variants-1',
      type: 'variants',
      position: { x: 0, y: 0 },
      data: {
        count: 4,
        sourceImageUrl: null,
      },
      draggable: false,
      selectable: false,
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 0, y: 0 },
      data: {
        imageUrl: null,
        variantUrls: null,
      },
      draggable: false,
      selectable: false,
    },
  ], []);

  const initialEdges: Edge[] = useMemo(() => [
    {
      id: 'e-text-image',
      source: 'text-1',
      target: 'image-1',
      sourceHandle: 'text',
      targetHandle: 'prompt',
      type: 'default',
    },
    {
      id: 'e-style-image',
      source: 'style-1',
      target: 'image-1',
      sourceHandle: 'style',
      targetHandle: 'style',
      type: 'default',
    },
    {
      id: 'e-material-image',
      source: 'material-1',
      target: 'image-1',
      sourceHandle: 'materials',
      targetHandle: 'material',
      type: 'default',
    },
    {
      id: 'e-image-variants',
      source: 'image-1',
      target: 'variants-1',
      sourceHandle: 'image',
      targetHandle: 'sourceImage',
      type: 'default',
    },
    {
      id: 'e-variants-output',
      source: 'variants-1',
      target: 'output-1',
      sourceHandle: 'variants',
      targetHandle: 'variants',
      type: 'default',
    },
  ], []);

  // Apply auto-layout using dagre (same as main canvas)
  const initialNodes = useMemo(() => {
    // Use dagre algorithm to auto-layout nodes based on their connections
    const layoutedNodes = AutoLayout.applyDagreLayout(rawNodes, initialEdges, {
      direction: 'LR', // Left to Right layout
      nodeWidth: 320,   // Standard node width
      nodeHeight: 200,  // Standard node height
      rankSep: 150,     // Vertical spacing between ranks
      nodeSep: 80,      // Horizontal spacing between nodes in same rank
    });
    return layoutedNodes;
  }, [rawNodes, initialEdges]);

  return (
    <div className="w-full h-full min-h-[250px] md:min-h-[300px] relative overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          proOptions={{ hideAttribution: true }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          className="bg-background [&_.react-flow__node]:!outline-none [&_.react-flow__node-selected]:!outline-none"
          minZoom={0.3}
          maxZoom={1.2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        >
          <CanvasPipelineInner />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1} 
            className="[&_svg]:!stroke-border opacity-20" 
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
