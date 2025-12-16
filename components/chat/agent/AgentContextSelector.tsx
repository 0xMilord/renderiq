'use client';

import { useState } from 'react';
import { useValue } from 'tldraw';
import type { Editor } from '@tldraw/tldraw';
import type { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AtSign, X, Target, Square } from 'lucide-react';
import { ContextItemTag } from '@/agent-kit/client/components/ContextItemTag';
import { SelectionTag } from '@/agent-kit/client/components/SelectionTag';
import { cn } from '@/lib/utils';

interface AgentContextSelectorProps {
  agent: TldrawAgent | null;
  editor: Editor | null;
}

/**
 * Styled context selector for Renderiq
 * Allows users to add context items (shapes, areas) to agent prompts
 */
export function AgentContextSelector({ agent, editor }: AgentContextSelectorProps) {
  if (!agent || !editor) return null;

  const isContextToolActive = useValue(
    'isContextToolActive',
    () => {
      const tool = editor.getCurrentTool();
      return tool.id === 'target-shape' || tool.id === 'target-area';
    },
    [editor]
  );

  const selectedShapes = useValue('selectedShapes', () => editor.getSelectedShapes(), [editor]);
  const contextItems = useValue(agent.$contextItems);

  const handleAddContext = (action: 'shape' | 'area') => {
    if (action === 'shape') {
      editor.setCurrentTool('target-shape');
      editor.focus();
    } else if (action === 'area') {
      editor.setCurrentTool('target-area');
      editor.focus();
    }
  };

  const handleClearContext = () => {
    agent.$contextItems.set([]);
    const currentTool = editor.getCurrentTool();
    if (currentTool.id === 'target-area' || currentTool.id === 'target-shape') {
      editor.setCurrentTool('select');
    }
  };

  const hasContext = selectedShapes.length > 0 || contextItems.length > 0;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5">
      {/* Add Context Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs gap-1.5',
              isContextToolActive && 'bg-primary/20 border-primary text-primary'
            )}
          >
            <AtSign className="h-3 w-3" />
            <span>Add Context</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => handleAddContext('shape')}>
            <Target className="h-4 w-4 mr-2" />
            Pick Shapes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAddContext('area')}>
            <Square className="h-4 w-4 mr-2" />
            Pick Area
          </DropdownMenuItem>
          {isContextToolActive && (
            <DropdownMenuItem onClick={handleClearContext}>
              <X className="h-4 w-4 mr-2" />
              Cancel Selection
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected Shapes Tag */}
      {selectedShapes.length > 0 && (
        <StyledSelectionTag onClick={() => editor.selectNone()} />
      )}

      {/* Context Items */}
      {contextItems.map((item, i) => (
        <StyledContextItemTag
          key={`context-item-${i}`}
          editor={editor}
          item={item}
          onClick={() => agent.removeFromContext(item)}
        />
      ))}

      {/* Clear All Button */}
      {hasContext && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleClearContext}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Styled version of SelectionTag matching Renderiq design
 */
function StyledSelectionTag({ onClick }: { onClick?: () => void }) {
  return (
    <Badge
      variant="outline"
      className="h-7 px-2 text-xs font-normal gap-1.5 flex items-center bg-muted/50 hover:bg-muted cursor-pointer"
      onClick={onClick}
    >
      <Target className="h-3 w-3" />
      <span>Selection</span>
    </Badge>
  );
}

/**
 * Styled version of ContextItemTag matching Renderiq design
 */
function StyledContextItemTag({
  item,
  editor,
  onClick,
}: {
  item: any;
  editor: Editor;
  onClick?: () => void;
}) {
  // Use the original component but wrap it in our styling
  return (
    <div className="inline-block">
      <ContextItemTag editor={editor} item={item} onClick={onClick} />
    </div>
  );
}

