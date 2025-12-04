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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const initializedRef = useRef(false);

  // Initialize nodes only once when data is available
  useEffect(() => {
    if (initializedRef.current) return;
    
    const { demoChain, demoImages } = demoData;
    
    if (demoChain?.renders && demoChain.renders.length > 0) {
      const initialNodes: Node[] = [
        {
          id: 'prompt',
          type: 'demo',
          position: { x: 100, y: 200 },
          data: {
            label: 'Prompt Input',
            icon: <Sparkles className="h-5 w-5 text-primary" />,
            prompt: demoChain.renders[0]?.prompt || 'Create a modern architectural visualization',
          },
        },
      ];

      // Add render nodes
      demoChain.renders.slice(0, 4).forEach((render, index) => {
        if (render.outputUrl) {
          initialNodes.push({
            id: `render-${index}`,
            type: 'demo',
            position: { x: 400 + (index % 2) * 300, y: 100 + Math.floor(index / 2) * 250 },
            data: {
              label: `Render ${index + 1}`,
              icon: <ImageIcon className="h-5 w-5 text-blue-500" />,
              image: render.outputUrl,
              prompt: render.prompt?.substring(0, 50) + '...',
            },
          });
        }
      });

      if (initialNodes.length > 1) {
        setNodes(initialNodes);
        initializedRef.current = true;
      }
    } else if (demoImages.length > 0) {
      // Fallback: use gallery images
      const initialNodes: Node[] = [
        {
          id: 'prompt',
          type: 'demo',
          position: { x: 100, y: 200 },
          data: {
            label: 'Prompt Input',
            icon: <Sparkles className="h-5 w-5 text-primary" />,
            prompt: demoImages[0]?.render?.prompt || 'Create a modern architectural visualization',
          },
        },
      ];

      demoImages.slice(0, 4).forEach((item, index) => {
        if (item.render?.outputUrl) {
          initialNodes.push({
            id: `render-${index}`,
            type: 'demo',
            position: { x: 400 + (index % 2) * 300, y: 100 + Math.floor(index / 2) * 250 },
            data: {
              label: `Render ${index + 1}`,
              icon: <ImageIcon className="h-5 w-5 text-blue-500" />,
              image: item.render.outputUrl,
              prompt: item.render.prompt?.substring(0, 50) + '...',
            },
          });
        }
      });

      if (initialNodes.length > 1) {
        setNodes(initialNodes);
        initializedRef.current = true;
      }
    }
  }, [demoData, setNodes]);

  // Animate connections step by step - use ref to track nodes length
  const nodesLengthRef = useRef(nodes.length);
  useEffect(() => {
    nodesLengthRef.current = nodes.length;
  }, [nodes.length]);

  useEffect(() => {
    if (nodesLengthRef.current === 0) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const maxSteps = nodesLengthRef.current - 1;
        const nextStep = prev + 1;
        
        if (nextStep > maxSteps) {
          // Reset after showing all connections
          setTimeout(() => setEdges([]), 1000);
          return 0;
        }

        // Add edge from prompt to current render node
        const newEdges: Edge[] = [];
        for (let i = 0; i < nextStep && i < maxSteps; i++) {
          newEdges.push({
            id: `edge-${i}`,
            source: 'prompt',
            target: `render-${i}`,
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          });
        }
        setEdges(newEdges);
        
        return nextStep;
      });
    }, 1500); // Add a new connection every 1.5 seconds

    return () => clearInterval(interval);
  }, [setEdges]);

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
            className="bg-background"
            minZoom={0.3}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
