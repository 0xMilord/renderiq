'use client';

import { useCallback, useState } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

interface PromptBuilderNodeData {
  sceneType: string;
  style: string;
  mood: string;
  subject: string;
  additionalDetails: string;
  generatedPrompt: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

export function PromptBuilderNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<PromptBuilderNodeData>(data || {
    sceneType: 'interior',
    style: 'modern',
    mood: 'bright',
    subject: 'architecture',
    additionalDetails: '',
    generatedPrompt: '',
    status: 'idle',
  });

  const handleChange = useCallback((updates: Partial<PromptBuilderNodeData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    
    // Dispatch update event
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { nodeId: id, data: newData },
    });
    window.dispatchEvent(event);
  }, [localData, id]);

  const generatePrompt = useCallback(async () => {
    handleChange({ status: 'generating', errorMessage: undefined });

    try {
      // Build the prompt context from selections
      const context = `
Scene Type: ${localData.sceneType}
Style: ${localData.style}
Mood/Atmosphere: ${localData.mood}
Subject: ${localData.subject}
${localData.additionalDetails ? `Additional Details: ${localData.additionalDetails}` : ''}

Generate a detailed, professional prompt for image generation based on the above selections. 
The prompt should be descriptive, include relevant technical terms, and be optimized for architectural/design image generation.
Keep it concise but comprehensive (2-3 sentences max).
`;

      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: context }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const result = await response.json();
      
      if (result.success && result.data?.text) {
        const generatedPrompt = result.data.text.trim();
        handleChange({
          generatedPrompt,
          status: 'completed',
        });

        // Dispatch event to update connected text nodes
        const event = new CustomEvent('nodeDataUpdate', {
          detail: { 
            nodeId: id, 
            data: { 
              ...localData, 
              generatedPrompt, 
              status: 'completed' 
            } 
          },
        });
        window.dispatchEvent(event);
      } else {
        throw new Error(result.error || 'Failed to generate prompt');
      }
    } catch (error) {
      handleChange({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [localData, id, handleChange]);

  const status = localData.status === 'generating' 
    ? NodeExecutionStatus.RUNNING 
    : localData.status === 'completed' 
    ? NodeExecutionStatus.COMPLETED 
    : localData.status === 'error'
    ? NodeExecutionStatus.ERROR
    : NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Prompt Builder"
      icon={Sparkles}
      nodeType="prompt-builder"
      nodeId={String(id)}
      status={status}
      outputs={[{ id: 'prompt', position: Position.Right, type: 'text', label: 'Generated Prompt' }]}
    >
      <div className="space-y-3">
        {/* Scene Type */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Scene Type</Label>
          <Select
            value={localData.sceneType}
            onValueChange={(value) => handleChange({ sceneType: value })}
          >
            <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interior">Interior</SelectItem>
              <SelectItem value="exterior">Exterior</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="urban">Urban</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Style</Label>
          <Select
            value={localData.style}
            onValueChange={(value) => handleChange({ style: value })}
          >
            <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimalist">Minimalist</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="scandinavian">Scandinavian</SelectItem>
              <SelectItem value="brutalist">Brutalist</SelectItem>
              <SelectItem value="futuristic">Futuristic</SelectItem>
              <SelectItem value="rustic">Rustic</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mood */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Mood/Atmosphere</Label>
          <Select
            value={localData.mood}
            onValueChange={(value) => handleChange({ mood: value })}
          >
            <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bright">Bright & Airy</SelectItem>
              <SelectItem value="moody">Moody & Dramatic</SelectItem>
              <SelectItem value="warm">Warm & Cozy</SelectItem>
              <SelectItem value="cool">Cool & Calm</SelectItem>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="serene">Serene & Peaceful</SelectItem>
              <SelectItem value="mysterious">Mysterious</SelectItem>
              <SelectItem value="vibrant">Vibrant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Subject</Label>
          <Select
            value={localData.subject}
            onValueChange={(value) => handleChange({ subject: value })}
          >
            <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs nodrag nopan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="architecture">Architecture</SelectItem>
              <SelectItem value="interior-design">Interior Design</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Details */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Additional Details (Optional)</Label>
          <Textarea
            value={localData.additionalDetails}
            onChange={(e) => handleChange({ additionalDetails: e.target.value })}
            placeholder="Add any specific details, materials, colors, or requirements..."
            className="min-h-[60px] bg-background border-border text-foreground text-xs resize-none nodrag nopan"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generatePrompt}
          disabled={localData.status === 'generating'}
          variant="default"
          size="sm"
          className="w-full h-8 text-xs nodrag nopan"
        >
          {localData.status === 'generating' ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              Generate Prompt
            </>
          )}
        </Button>

        {/* Generated Prompt Display */}
        {localData.generatedPrompt && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Generated Prompt</Label>
            <div className="p-2 bg-muted rounded border border-border text-xs text-foreground">
              {localData.generatedPrompt}
            </div>
          </div>
        )}

        {/* Error Message */}
        {localData.status === 'error' && localData.errorMessage && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
            {localData.errorMessage}
          </div>
        )}
      </div>
    </BaseNode>
  );
}



