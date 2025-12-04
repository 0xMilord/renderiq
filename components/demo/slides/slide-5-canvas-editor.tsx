'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Image from 'next/image';
import { useDemoData } from '@/components/demo/demo-data-context';
import type { GalleryItemWithDetails } from '@/lib/types';
import { Sparkles, ImageIcon, Wand2, Layers } from 'lucide-react';

interface Slide5CanvasEditorProps {
  galleryRenders?: GalleryItemWithDetails[];
}

// Custom node component for demo
function DemoNode({ data }: { data: any }) {
  return (
    <div className="bg-card border-2 border-primary rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        {data.icon}
        <h3 className="font-bold text-foreground">{data.label}</h3>
      </div>
      {data.image && (
        <div className="mt-2 rounded overflow-hidden border border-border">
          <Image
            src={data.image}
            alt={data.label}
            width={200}
            height={150}
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      {data.prompt && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{data.prompt}</p>
      )}
    </div>
  );
}

const nodeTypes = {
  demo: DemoNode,
};

export function Slide5CanvasEditor({ galleryRenders = [] }: Slide5CanvasEditorProps) {
  const { chains } = useDemoData();
  
  // Memoize demo data to prevent recreating on every render
  const demoData = useMemo(() => {
    // Get images from gallery renders for demo
    const demoImages = galleryRenders
      .filter(r => r.render?.outputUrl && r.render?.status === 'completed' && r.render?.type === 'image')
      .slice(0, 5);
    
    // Get a chain with multiple renders for demo
    const chainKeys = Object.keys(chains);
    const demoChain = chainKeys.length > 0 ? chains[chainKeys[0]] : null;
    
    return { demoImages, demoChain };
  }, [galleryRenders, chains]);

  // Create initial nodes once - memoized to prevent recreation
  // Layout: Prompt (left) -> Image Node (center) -> Renders (right, vertical)
  const initialNodes = useMemo<Node[]>(() => {
    const { demoChain, demoImages } = demoData;
    
    if (demoChain?.renders && demoChain.renders.length > 0) {
      const renders = demoChain.renders.slice(0, 3).filter(r => r.outputUrl);
      if (renders.length === 0) return [];
      
      const nodes: Node[] = [
        // Prompt Input Node (left)
        {
          id: 'prompt',
          type: 'demo',
          position: { x: 50, y: 250 },
          data: {
            label: 'Prompt Input',
            icon: <Sparkles className="h-6 w-6 text-primary" />,
            prompt: demoChain.renders[0]?.prompt || 'Create a modern architectural visualization',
          },
        },
        // Image Generation Node (center)
        {
          id: 'image-node',
          type: 'demo',
          position: { x: 400, y: 250 },
          data: {
            label: 'Image Generator',
            icon: <Wand2 className="h-6 w-6 text-purple-500" />,
            prompt: 'Processing...',
          },
        },
      ];

      // Add render nodes (right side, vertical stack)
      renders.forEach((render, index) => {
        nodes.push({
          id: `render-${index}`,
          type: 'demo',
          position: { x: 750, y: 150 + index * 200 },
          data: {
            label: `Render v${index + 1}`,
            icon: <ImageIcon className="h-6 w-6 text-blue-500" />,
            image: render.outputUrl,
            prompt: render.prompt?.substring(0, 60) + '...',
          },
        });
      });

      return nodes;
    } else if (demoImages.length > 0) {
      const images = demoImages.slice(0, 3).filter(item => item.render?.outputUrl);
      if (images.length === 0) return [];
      
      // Fallback: use gallery images
      const nodes: Node[] = [
        {
          id: 'prompt',
          type: 'demo',
          position: { x: 50, y: 250 },
          data: {
            label: 'Prompt Input',
            icon: <Sparkles className="h-6 w-6 text-primary" />,
            prompt: images[0]?.render?.prompt || 'Create a modern architectural visualization',
          },
        },
        {
          id: 'image-node',
          type: 'demo',
          position: { x: 400, y: 250 },
          data: {
            label: 'Image Generator',
            icon: <Wand2 className="h-6 w-6 text-purple-500" />,
            prompt: 'Processing...',
          },
        },
      ];

      images.forEach((item, index) => {
        if (item.render?.outputUrl) {
          nodes.push({
            id: `render-${index}`,
            type: 'demo',
            position: { x: 750, y: 150 + index * 200 },
            data: {
              label: `Render v${index + 1}`,
              icon: <ImageIcon className="h-6 w-6 text-blue-500" />,
              image: item.render.outputUrl,
              prompt: item.render.prompt?.substring(0, 60) + '...',
            },
          });
        }
      });

      return nodes;
    }
    
    return [];
  }, [demoData]);

  // Initialize nodes directly in useNodesState - this prevents infinite loops
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Animate connections step by step: prompt -> image-node -> renders
  const renderNodesCount = initialNodes.filter(n => n.id.startsWith('render-')).length;
  
  useEffect(() => {
    if (renderNodesCount === 0) return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      
      if (step === 1) {
        // Step 1: Connect prompt to image-node
        setEdges([{
          id: 'edge-prompt-image',
          source: 'prompt',
          target: 'image-node',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        }]);
      } else if (step <= renderNodesCount + 1) {
        // Step 2+: Connect image-node to each render sequentially
        const renderIndex = step - 2;
        const newEdges: Edge[] = [{
          id: 'edge-prompt-image',
          source: 'prompt',
          target: 'image-node',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 3 },
        }];
        
        for (let i = 0; i <= renderIndex; i++) {
          newEdges.push({
            id: `edge-image-render-${i}`,
            source: 'image-node',
            target: `render-${i}`,
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          });
        }
        setEdges(newEdges);
      } else {
        // Reset after showing all connections
        setTimeout(() => {
          setEdges([]);
          step = 0;
        }, 2000);
      }
    }, 2000); // Show next connection every 2 seconds

    return () => clearInterval(interval);
  }, [renderNodesCount, setEdges]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Layers className="h-8 w-8 text-primary" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground">
            Visual Workflow Canvas
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Connect nodes to create complex rendering workflows
        </p>
      </div>

      {/* React Flow Canvas */}
      <div className="w-full h-full mt-24">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-background"
            minZoom={0.5}
            maxZoom={1.2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="[&_svg]:!stroke-border" />
            <Controls className="!bg-card !border-border [&_button]:!bg-secondary [&_button]:!border-border [&_button]:!text-foreground hover:[&_button]:!bg-accent hover:[&_button]:!text-accent-foreground" />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Feature Pills */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { icon: Wand2, text: 'AI-Powered', color: 'text-primary' },
            { icon: Layers, text: 'Node-Based', color: 'text-blue-500' },
            { icon: ImageIcon, text: 'Visual Workflow', color: 'text-green-500' },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full border border-border"
            >
              <feature.icon className={`h-5 w-5 ${feature.color}`} />
              <span className="text-sm font-medium text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
