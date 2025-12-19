'use client';

import { ReactNode, useMemo, createContext, useContext } from 'react';
import { Handle, Position, useReactFlow, Node, Edge, Connection } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { NodeStatusIndicator } from '../node-status-indicator';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { cn } from '@/lib/utils';
import { HandleContextMenu } from '../handle-context-menu';

// Node color context to pass colors to child components
interface NodeColorContextType {
  color: string;
  accent: string;
  header: string;
  icon: string;
}

const NodeColorContext = createContext<NodeColorContextType | null>(null);

export const useNodeColors = () => {
  const context = useContext(NodeColorContext);
  if (!context) {
    // Fallback to default colors if context is not available
    return {
      color: '#6bcf33',
      accent: '#6bcf33',
      header: 'bg-[#6bcf33]/20 border-[#6bcf33]',
      icon: 'text-[#6bcf33]',
    };
  }
  return context;
};

interface BaseNodeProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  inputs?: Array<{
    id: string;
    position: Position;
    label?: string;
    type?: 'text' | 'image' | 'style' | 'material' | 'variants' | 'prompt-builder' | 'style-reference' | 'image-input';
  }>;
  outputs?: Array<{
    id: string;
    position: Position;
    label?: string;
    type?: 'text' | 'image' | 'style' | 'material' | 'variants';
  }>;
  className?: string;
  nodeType?: 'text' | 'image' | 'variants' | 'style' | 'material' | 'output' | 'prompt-builder' | 'style-reference' | 'image-input' | 'video';
  nodeId?: string;
  status?: NodeExecutionStatus;
  progress?: number;
}

// Consistent border radius (rounded-lg = 8px)
const NODE_BORDER_RADIUS = 'rounded-lg'; // 0.5rem = 8px

// Simplified color scheme - 20% fill with solid outline using node colors
const nodeColors = {
  text: {
    color: '#6bcf33',
    header: 'bg-[#6bcf33]/20 border-[#6bcf33]',
    icon: 'text-[#6bcf33]',
    accent: '#6bcf33',
  },
  image: {
    color: '#4a9eff',
    header: 'bg-[#4a9eff]/20 border-[#4a9eff]',
    icon: 'text-[#4a9eff]',
    accent: '#4a9eff',
  },
  variants: {
    color: '#ff4a9e',
    header: 'bg-[#ff4a9e]/20 border-[#ff4a9e]',
    icon: 'text-[#ff4a9e]',
    accent: '#ff4a9e',
  },
  style: {
    color: '#ff9e4a',
    header: 'bg-[#ff9e4a]/20 border-[#ff9e4a]',
    icon: 'text-[#ff9e4a]',
    accent: '#ff9e4a',
  },
  material: {
    color: '#9e4aff',
    header: 'bg-[#9e4aff]/20 border-[#9e4aff]',
    icon: 'text-[#9e4aff]',
    accent: '#9e4aff',
  },
  output: {
    color: '#4aff9e',
    header: 'bg-[#4aff9e]/20 border-[#4aff9e]',
    icon: 'text-[#4aff9e]',
    accent: '#4aff9e',
  },
  'prompt-builder': {
    color: '#6bcf33',
    header: 'bg-[#6bcf33]/20 border-[#6bcf33]',
    icon: 'text-[#6bcf33]',
    accent: '#6bcf33',
  },
  'style-reference': {
    color: '#ffb84a',
    header: 'bg-[#ffb84a]/20 border-[#ffb84a]',
    icon: 'text-[#ffb84a]',
    accent: '#ffb84a',
  },
  'image-input': {
    color: '#6bcf33',
    header: 'bg-[#6bcf33]/20 border-[#6bcf33]',
    icon: 'text-[#6bcf33]',
    accent: '#6bcf33',
  },
  video: {
    color: '#9e4aff',
    header: 'bg-[#9e4aff]/20 border-[#9e4aff]',
    icon: 'text-[#9e4aff]',
    accent: '#9e4aff',
  },
};

// Handle colors by type
const handleColors: Record<string, string> = {
  text: '#6bcf33',
  image: '#4a9eff',
  style: '#ff9e4a',
  material: '#9e4aff',
  variants: '#ff4a9e',
};

export function BaseNode({
  title,
  icon: Icon,
  children,
  inputs = [],
  outputs = [],
  className = '',
  nodeType = 'text',
  nodeId,
  status = NodeExecutionStatus.IDLE,
  progress,
}: BaseNodeProps) {
  const colors = nodeColors[nodeType] || nodeColors.text;
  const { deleteElements, getEdges, getNodes, addEdges } = useReactFlow();

  // Get connected handles - memoized to avoid calling getEdges() on every render
  const connectedHandles = useMemo(() => {
    if (!nodeId) return new Set<string>();
    const edges = getEdges();
    const connected = new Set<string>();
    
    // Use for loop for better performance than forEach
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (edge.source === nodeId && edge.sourceHandle) {
        connected.add(`source-${edge.sourceHandle}`);
      }
      if (edge.target === nodeId && edge.targetHandle) {
        connected.add(`target-${edge.targetHandle}`);
      }
    }
    
    return connected;
  }, [nodeId, getEdges]);

  // Check if handle is connected
  const isHandleConnected = (handleType: 'source' | 'target', handleId: string) => {
    return connectedHandles.has(`${handleType}-${handleId}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeId) {
      deleteElements({ nodes: [{ id: nodeId }] });
    }
  };

  // Group handles by position for better spacing
  const groupedInputs = {
    left: inputs.filter(i => i.position === Position.Left),
    right: inputs.filter(i => i.position === Position.Right),
    top: inputs.filter(i => i.position === Position.Top),
    bottom: inputs.filter(i => i.position === Position.Bottom),
  };

  const groupedOutputs = {
    left: outputs.filter(o => o.position === Position.Left),
    right: outputs.filter(o => o.position === Position.Right),
    top: outputs.filter(o => o.position === Position.Top),
    bottom: outputs.filter(o => o.position === Position.Bottom),
  };

  // Calculate handle style - Position handles on card edges (half in, half out)
  // ✅ UPDATED: Rectangular handles instead of circular dots
  const getHandleStyle = (
    position: Position,
    index: number,
    total: number,
    handleType: 'source' | 'target',
    handleId: string,
    handleColorType?: string
  ): React.CSSProperties => {
    const handleColor = handleColorType ? handleColors[handleColorType] : colors.accent;
    const isConnected = isHandleConnected(handleType, handleId);
    // ✅ UPDATED: Reduced height by 30%, keep reduced width
    const horizontalWidth = 8; // Width for left/right handles
    const horizontalHeight = 45; // Height for left/right handles (64 * 0.7 = 44.8, rounded to 45)
    const verticalWidth = 4; // Width for top/bottom handles
    const verticalHeight = 90; // Height for top/bottom handles (128 * 0.7 = 89.6, rounded to 90)
    
    // Determine dimensions based on position
    const isHorizontal = position === Position.Left || position === Position.Right;
    const width = isHorizontal ? horizontalWidth : verticalWidth;
    const height = isHorizontal ? horizontalHeight : verticalHeight;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // ✅ FIXED: Position handles perfectly centered on the container edge and central axis
    const style: React.CSSProperties = {
      backgroundColor: handleColor,
      borderColor: handleColor,
      width: `${width}px`,
      height: `${height}px`,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: '2px', // Slight rounding for rectangular handles
      zIndex: 10, // Above the card border
      position: 'absolute',
      // ✅ FIXED: Explicitly set all position properties to avoid inset conflicts
      left: 'auto',
      right: 'auto',
      top: 'auto',
      bottom: 'auto',
      margin: 0, // Reset any margins
      padding: 0, // Reset any padding
      transition: 'none', // Prevent size transitions that cause shifting
    } as React.CSSProperties;
    
    // ✅ FIXED: Position handle center exactly at the border center (1px from container edge)
    // Node has 2px border, so border center is at 1px from edge
    // This ensures perfect centering on both X and Y axes of the node's central axis
    const nodeBorderWidth = 2; // Node border width
    const borderCenter = nodeBorderWidth / 2; // Border center (1px from edge)
    
    let baseTransform = '';
    switch (position) {
      case Position.Left:
        // ✅ Perfect X-axis centering: handle center at border center (1px from left edge)
        // ✅ Perfect Y-axis centering: top 50% + translateY(-50%)
        style.left = `${borderCenter - halfWidth}px`;
        style.right = 'auto';
        style.top = '50%';
        style.bottom = 'auto';
        baseTransform = 'translateY(-50%)'; // Perfect vertical centering on Y-axis
        break;
      case Position.Right:
        // ✅ Perfect X-axis centering: handle center at border center (1px from right edge)
        // ✅ Perfect Y-axis centering: top 50% + translateY(-50%)
        style.right = `${borderCenter - halfWidth}px`;
        style.left = 'auto';
        style.top = '50%';
        style.bottom = 'auto';
        baseTransform = 'translateY(-50%)'; // Perfect vertical centering on Y-axis
        break;
      case Position.Top:
        // ✅ Perfect X-axis centering: left 50% + translateX(-50%)
        // ✅ Perfect Y-axis centering: handle center at border center (1px from top edge)
        style.top = `${borderCenter - halfHeight}px`;
        style.bottom = 'auto';
        style.left = '50%';
        style.right = 'auto';
        baseTransform = 'translateX(-50%)'; // Perfect horizontal centering on X-axis
        break;
      case Position.Bottom:
        // ✅ Perfect X-axis centering: left 50% + translateX(-50%)
        // ✅ Perfect Y-axis centering: handle center at border center (1px from bottom edge)
        style.bottom = `${borderCenter - halfHeight}px`;
        style.top = 'auto';
        style.left = '50%';
        style.right = 'auto';
        baseTransform = 'translateX(-50%)'; // Perfect horizontal centering on X-axis
        break;
    }
    
    // Add data attribute for CSS targeting
    if (isConnected) {
      (style as any)['--handle-color'] = handleColor;
      (style as any)['--handle-direction'] = handleType === 'source' ? 'outward' : 'inward';
    }

    // ✅ FIXED: Proper spacing between handles - constrained within node bounds
    if (total > 1) {
      // Calculate spacing: handle size + 1px gap to prevent overlap
      const handleSize = isHorizontal ? height : width;
      const gap = 1; // 1px gap between handles
      const spacing = handleSize + gap; // Total spacing = handle size + gap
      
      if (position === Position.Left || position === Position.Right) {
        // ✅ FIXED: Constrain handles within available space (between header and bottom)
        // Header: py-2 (8px top + 8px bottom) + text (~20px) = ~36px
        // Top padding: p-3 = 12px
        // Bottom padding: p-3 = 12px
        // Start position: 36px (header) + 12px (top padding) = 48px from top
        // End position: 12px (bottom padding) from bottom
        const headerHeight = 36; // Header height
        const topPadding = 12; // Content top padding
        const bottomPadding = 12; // Content bottom padding
        const startOffset = headerHeight + topPadding; // Start below header (48px)
        const endOffset = bottomPadding; // End above bottom (12px)
        
        // Calculate position: distribute evenly from startOffset to (100% - endOffset)
        // First handle at startOffset, last handle at (100% - endOffset - handleSize)
        // Use percentage-based distribution within available space
        const positionPercent = total === 1 
          ? 0.5 // Single handle: center
          : index / (total - 1); // 0 to 1 for distribution
        
        // Calculate top position using calc()
        // Formula: startOffset + positionPercent * (100% - startOffset - endOffset - halfHeight)
        // This ensures handles stay within bounds
        const totalOffset = startOffset + endOffset + halfHeight;
        const topPosition = `calc(${startOffset}px + ${positionPercent} * (100% - ${totalOffset}px))`;
        
        style.top = topPosition;
        style.bottom = 'auto';
        baseTransform = 'translateY(-50%)'; // Center handle vertically on its position
      } else {
        // For horizontal sides (top/bottom), adjust X position from center
        // Maintains Y-axis centering, adjusts X position with proper spacing
        const offset = (index - (total - 1) / 2) * spacing;
        baseTransform = `translateX(calc(-50% + ${offset}px))`;
      }
    } else {
      // Single handle: center it vertically within available space
      if (position === Position.Left || position === Position.Right) {
        const headerHeight = 36;
        const topPadding = 12;
        const bottomPadding = 12;
        const startOffset = headerHeight + topPadding;
        const endOffset = bottomPadding;
        
        // Center in available space: startOffset + (available space / 2)
        const totalOffset = startOffset + endOffset + halfHeight;
        style.top = `calc(${startOffset}px + (100% - ${totalOffset}px) / 2)`;
        style.bottom = 'auto';
        baseTransform = 'translateY(-50%)';
      }
    }

    // ✅ FIXED: Set transform origin to center for proper scaling/centering
    style.transformOrigin = 'center center';
    
    // Mirror input handles horizontally (only the visual shape, not position)
    if (handleType === 'target') {
      // For input handles, add horizontal mirror transform
      style.transform = `${baseTransform} scaleX(-1)`;
    } else {
      // Output handles keep normal orientation
      style.transform = baseTransform;
    }
    
    // ✅ FIXED: Ensure box-sizing is border-box for accurate positioning
    (style as any).boxSizing = 'border-box';

    return style;
  };
  
  // Check if header has handles (top position)
  const hasHeaderHandles = groupedInputs.top.length > 0 || groupedOutputs.top.length > 0;

  return (
    <div 
      className={cn('w-80 bg-card border-2 shadow-lg relative', NODE_BORDER_RADIUS, className)}
      style={{ borderColor: colors.color, zIndex: 10, overflow: 'visible' }}
    >
      {/* Header */}
      <div 
        className={cn('px-3 py-2 border-b-2 flex items-center justify-between rounded-t-lg relative', colors.header)}
        style={{ 
          backgroundColor: hasHeaderHandles ? `${colors.color}20` : undefined,
        }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', colors.icon)} />
          <span className={cn('text-xs font-semibold truncate', colors.icon)}>{title}</span>
          {nodeId && status !== NodeExecutionStatus.IDLE && (
            <NodeStatusIndicator
              nodeId={nodeId}
              status={status}
              progress={progress}
              className="ml-1"
            />
          )}
        </div>
        {nodeId && (
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground flex-shrink-0 nodrag nopan"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Content Container - Handles can overflow, content is contained */}
      <NodeColorContext.Provider value={colors}>
        <div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
          {/* Input Handles - Left Side */}
        {groupedInputs.left.map((input, index) => {
          const isConnected = isHandleConnected('target', input.id);
          const handleStyle = getHandleStyle(Position.Left, index, groupedInputs.left.length, 'target', input.id, input.type);
          const handleElement = (
            <Handle
              key={input.id}
              type="target"
              position={Position.Left}
              id={input.id}
              style={handleStyle}
              className={cn(isConnected && 'handle-connected handle-inward')}
              data-position="left"
              data-handle-type="target"
              title={input.label || `${input.type || 'input'}`}
            />
          );
          
          return nodeId ? (
            <HandleContextMenu
              key={input.id}
              nodeId={nodeId}
              handleId={input.id}
              handleType="target"
              handleDataType={input.type || 'text'}
              nodes={getNodes()}
              edges={getEdges()}
              onConnect={(connection) => {
                // addEdges expects an array of Edges, but connection is a Connection
                // We need to convert it to an Edge format
                const edge = {
                  id: `${connection.source}-${connection.target}-${connection.sourceHandle || 'default'}-${connection.targetHandle || 'default'}`,
                  source: connection.source!,
                  target: connection.target!,
                  sourceHandle: connection.sourceHandle,
                  targetHandle: connection.targetHandle,
                };
                addEdges([edge]);
              }}
            >
              <div style={{ 
                position: 'absolute', 
                left: handleStyle.left,
                right: handleStyle.right,
                top: handleStyle.top,
                bottom: handleStyle.bottom,
                transform: handleStyle.transform,
                width: handleStyle.width, 
                height: handleStyle.height, 
                pointerEvents: 'auto', 
                zIndex: 100,
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                transition: 'none' // Prevent position shifts when connecting
              }}>
                {handleElement}
              </div>
            </HandleContextMenu>
          ) : (
            handleElement
          );
        })}

        {/* Input Handles - Top */}
        {groupedInputs.top.map((input, index) => {
          const isConnected = isHandleConnected('target', input.id);
          return (
            <Handle
              key={input.id}
              type="target"
              position={Position.Top}
              id={input.id}
              style={getHandleStyle(Position.Top, index, groupedInputs.top.length, 'target', input.id, input.type)}
              className={cn(isConnected && 'handle-connected handle-inward')}
              data-position="top"
              data-handle-type="target"
              title={input.label || `${input.type || 'input'}`}
            />
          );
        })}

        {/* Input Handles - Right Side */}
        {groupedInputs.right.map((input, index) => {
          const isConnected = isHandleConnected('target', input.id);
          return (
            <Handle
              key={input.id}
              type="target"
              position={Position.Right}
              id={input.id}
              style={getHandleStyle(Position.Right, index, groupedInputs.right.length, 'target', input.id, input.type)}
              className={cn(isConnected && 'handle-connected handle-inward')}
              data-position="right"
              data-handle-type="target"
              title={input.label || `${input.type || 'input'}`}
            />
          );
        })}

        {/* Input Handles - Bottom */}
        {groupedInputs.bottom.map((input, index) => {
          const isConnected = isHandleConnected('target', input.id);
          return (
            <Handle
              key={input.id}
              type="target"
              position={Position.Bottom}
              id={input.id}
              style={getHandleStyle(Position.Bottom, index, groupedInputs.bottom.length, 'target', input.id, input.type)}
              className={cn(isConnected && 'handle-connected handle-inward')}
              data-position="bottom"
              data-handle-type="target"
              title={input.label || `${input.type || 'input'}`}
            />
          );
        })}

        {/* Node Content - Properly contained */}
        <div className="nodrag nopan w-full">
          {children}
        </div>

        {/* Output Handles - Right Side */}
        {groupedOutputs.right.map((output, index) => {
          const isConnected = isHandleConnected('source', output.id);
          const handleStyle = getHandleStyle(Position.Right, index, groupedOutputs.right.length, 'source', output.id, output.type || nodeType);
          const handleElement = (
            <Handle
              key={output.id}
              type="source"
              position={Position.Right}
              id={output.id}
              style={handleStyle}
              className={cn(isConnected && 'handle-connected handle-outward')}
              data-position="right"
              data-handle-type="source"
              title={output.label || `${output.type || 'output'}`}
            />
          );
          
          return nodeId ? (
            <HandleContextMenu
              key={output.id}
              nodeId={nodeId}
              handleId={output.id}
              handleType="source"
              handleDataType={output.type || 'text'}
              nodes={getNodes()}
              edges={getEdges()}
              onConnect={(connection) => {
                // addEdges expects an array of Edges, but connection is a Connection
                // We need to convert it to an Edge format
                const edge = {
                  id: `${connection.source}-${connection.target}-${connection.sourceHandle || 'default'}-${connection.targetHandle || 'default'}`,
                  source: connection.source!,
                  target: connection.target!,
                  sourceHandle: connection.sourceHandle,
                  targetHandle: connection.targetHandle,
                };
                addEdges([edge]);
              }}
            >
              <div style={{ 
                position: 'absolute', 
                left: handleStyle.left,
                right: handleStyle.right,
                top: handleStyle.top,
                bottom: handleStyle.bottom,
                transform: handleStyle.transform,
                width: handleStyle.width, 
                height: handleStyle.height, 
                pointerEvents: 'auto', 
                zIndex: 100,
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                transition: 'none' // Prevent position shifts when connecting
              }}>
                {handleElement}
              </div>
            </HandleContextMenu>
          ) : (
            handleElement
          );
        })}

        {/* Output Handles - Bottom */}
        {groupedOutputs.bottom.map((output, index) => {
          const isConnected = isHandleConnected('source', output.id);
          return (
            <Handle
              key={output.id}
              type="source"
              position={Position.Bottom}
              id={output.id}
              style={getHandleStyle(Position.Bottom, index, groupedOutputs.bottom.length, 'source', output.id, output.type || nodeType)}
              className={cn(isConnected && 'handle-connected handle-outward')}
              data-position="bottom"
              data-handle-type="source"
              title={output.label || `${output.type || 'output'}`}
            />
          );
        })}

        {/* Output Handles - Left Side */}
        {groupedOutputs.left.map((output, index) => {
          const isConnected = isHandleConnected('source', output.id);
          return (
            <Handle
              key={output.id}
              type="source"
              position={Position.Left}
              id={output.id}
              style={getHandleStyle(Position.Left, index, groupedOutputs.left.length, 'source', output.id, output.type || nodeType)}
              className={cn(isConnected && 'handle-connected handle-outward')}
              data-position="left"
              data-handle-type="source"
              title={output.label || `${output.type || 'output'}`}
            />
          );
        })}

        {/* Output Handles - Top */}
        {groupedOutputs.top.map((output, index) => {
          const isConnected = isHandleConnected('source', output.id);
          return (
            <Handle
              key={output.id}
              type="source"
              position={Position.Top}
              id={output.id}
              style={getHandleStyle(Position.Top, index, groupedOutputs.top.length, 'source', output.id, output.type || nodeType)}
              className={cn(isConnected && 'handle-connected handle-outward')}
              data-position="top"
              data-handle-type="source"
              title={output.label || `${output.type || 'output'}`}
            />
          );
        })}
        </div>
      </NodeColorContext.Provider>
    </div>
  );
}
