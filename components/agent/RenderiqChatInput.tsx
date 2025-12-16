'use client';

import { FormEventHandler, useState } from 'react';
import { Editor, useValue } from 'tldraw';
import { AGENT_MODEL_DEFINITIONS, AgentModelName } from '@/agent-kit/worker/models';
import { TldrawAgent } from '@/agent-kit/client/agent/TldrawAgent';
import { convertTldrawShapeToSimpleShape } from '@/agent-kit/shared/format/convertTldrawShapeToSimpleShape';
import { RenderiqContextItemTag } from './RenderiqContextItemTag';
import { RenderiqSelectionTag } from './RenderiqSelectionTag';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Send, Loader2, Brain, AtSign } from 'lucide-react';

interface RenderiqChatInputProps {
  agent: TldrawAgent;
  onSubmit: (message: string, contextItems: any[], selectedShapes: any[]) => Promise<void>;
  className?: string;
}

/**
 * Styled ChatInput component matching Renderiq design
 * Integrates with agent for canvas manipulation
 */
export function RenderiqChatInput({
  agent,
  onSubmit,
  className,
}: RenderiqChatInputProps) {
  const { editor } = agent;
  const [inputValue, setInputValue] = useState('');
  const isGenerating = useValue('isGenerating', () => agent.isGenerating(), [agent]);

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
  const modelName = useValue(agent.$modelName);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !isGenerating) return;

    // If empty and generating, cancel
    if (!inputValue.trim() && isGenerating) {
      agent.cancel();
      return;
    }

    const message = inputValue.trim();
    if (!message) return;

    const currentContextItems = agent.$contextItems.get();
    agent.$contextItems.set([]);
    setInputValue('');

    const selectedShapesData = editor
      .getSelectedShapes()
      .map((shape) => convertTldrawShapeToSimpleShape(editor, shape));

    await onSubmit(message, currentContextItems, selectedShapesData);
  };

  return (
    <div className={cn('flex flex-col gap-2 p-3 border-t border-border bg-background', className)}>
      {/* Context Tags */}
      {(selectedShapes.length > 0 || contextItems.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedShapes.length > 0 && (
            <RenderiqSelectionTag onClick={() => editor.selectNone()} />
          )}
          {contextItems.map((item, i) => (
            <RenderiqContextItemTag
              editor={editor}
              onClick={() => agent.removeFromContext(item)}
              key={`context-item-${i}`}
              item={item}
            />
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* Context Selection */}
        <div className="flex items-center gap-2">
          <Select
            value={isContextToolActive ? 'active' : ' '}
            onValueChange={(value) => {
              const action = ADD_CONTEXT_ACTIONS.find((action) => action.name === value);
              if (action) action.onSelect(editor);
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <AtSign className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Add Context" />
            </SelectTrigger>
            <SelectContent>
              {ADD_CONTEXT_ACTIONS.map((action) => (
                <SelectItem key={action.name} value={action.name}>
                  {action.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model Selector */}
          <Select
            value={modelName}
            onValueChange={(value) => agent.$modelName.set(value as AgentModelName)}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <Brain className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(AGENT_MODEL_DEFINITIONS).map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Input */}
        <div className="flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="Ask the agent to draw, arrange, or organize on the canvas..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isGenerating}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() && !isGenerating}
            className="h-[60px] w-[60px] shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

const ADD_CONTEXT_ACTIONS = [
  {
    name: 'Pick Shapes',
    onSelect: (editor: Editor) => {
      editor.setCurrentTool('target-shape');
      editor.focus();
    },
  },
  {
    name: 'Pick Area',
    onSelect: (editor: Editor) => {
      editor.setCurrentTool('target-area');
      editor.focus();
    },
  },
  {
    name: ' ',
    onSelect: (editor: Editor) => {
      const currentTool = editor.getCurrentTool();
      if (currentTool.id === 'target-area' || currentTool.id === 'target-shape') {
        editor.setCurrentTool('select');
      }
    },
  },
];

