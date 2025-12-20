'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Wand2,
  Plus,
  X,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromptBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
  type?: 'image' | 'video';
}

interface PromptSection {
  id: string;
  type: 'subject' | 'style' | 'environment' | 'materials' | 'lighting' | 'composition' | 'custom';
  content: string;
}

const SECTION_TEMPLATES = {
  subject: {
    label: 'Subject',
    placeholder: 'e.g., Modern house exterior, Living room interior, Commercial building facade',
    icon: '🏛️'
  },
  style: {
    label: 'Style',
    placeholder: 'e.g., Photorealistic, Minimalist, Contemporary, Industrial',
    icon: '🎨'
  },
  environment: {
    label: 'Environment',
    placeholder: 'e.g., Sunny day, Golden hour, Night time, Overcast sky',
    icon: '🌆'
  },
  materials: {
    label: 'Materials',
    placeholder: 'e.g., Wood and concrete, Glass curtain walls, Natural stone',
    icon: '🧱'
  },
  lighting: {
    label: 'Lighting',
    placeholder: 'e.g., Natural daylight, Warm ambient lighting, Dramatic shadows',
    icon: '💡'
  },
  composition: {
    label: 'Composition',
    placeholder: 'e.g., Wide angle view, Close-up detail, Aerial perspective',
    icon: '📐'
  },
  custom: {
    label: 'Custom',
    placeholder: 'Add any additional details or requirements',
    icon: '✨'
  }
};

export function PromptBuilderModal({ 
  isOpen, 
  onClose, 
  onSelectPrompt,
  type = 'image'
}: PromptBuilderModalProps) {
  const [sections, setSections] = useState<PromptSection[]>([
    { id: '1', type: 'subject', content: '' },
    { id: '2', type: 'style', content: '' }
  ]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const addSection = (sectionType: PromptSection['type']) => {
    const newSection: PromptSection = {
      id: Date.now().toString(),
      type: sectionType,
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, content: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, content } : s
    ));
  };

  const changeSectionType = (id: string, newType: PromptSection['type']) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, type: newType } : s
    ));
  };

  const generatePrompt = () => {
    const filledSections = sections.filter(s => s.content.trim());
    if (filledSections.length === 0) {
      toast.error('Please fill in at least one section');
      return;
    }

    // Build prompt following best practices
    // Combine sections with commas for natural flow
    const promptParts = filledSections.map(s => s.content.trim());
    const prompt = promptParts.join(', ') + (type === 'image' 
      ? ', photorealistic architectural rendering'
      : ', professional architectural video');

    setGeneratedPrompt(prompt);
    toast.success('Prompt generated!');
  };

  const handleUsePrompt = () => {
    if (!generatedPrompt.trim()) {
      generatePrompt();
    }
    if (generatedPrompt.trim()) {
      onSelectPrompt(generatedPrompt);
      onClose();
    }
  };

  const availableSectionTypes = Object.entries(SECTION_TEMPLATES)
    .filter(([key]) => !sections.some(s => s.type === key))
    .map(([key, value]) => ({ key: key as PromptSection['type'], ...value }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Prompt Builder
          </DialogTitle>
          <DialogDescription>
            Build structured prompts for {type} generation using organized sections
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Sections */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {sections.map((section, index) => {
              const template = SECTION_TEMPLATES[section.type];
              return (
                <div key={section.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Select
                        value={section.type}
                        onValueChange={(value) => changeSectionType(section.id, value as PromptSection['type'])}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SECTION_TEMPLATES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <span className="mr-2">{value.icon}</span>
                              {value.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="outline">{template.label}</Badge>
                    </div>
                    {sections.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder={template.placeholder}
                    value={section.content}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              );
            })}

            {/* Add Section Button */}
            {availableSectionTypes.length > 0 && (
              <div className="border-2 border-dashed rounded-lg p-4">
                <Select
                  onValueChange={(value) => addSection(value as PromptSection['type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSectionTypes.map(({ key, label, icon }) => (
                      <SelectItem key={key} value={key}>
                        <span className="mr-2">{icon}</span>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Generated Prompt Preview */}
          {generatedPrompt && (
            <div className="border-t pt-4 space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generated Prompt
              </Label>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm whitespace-pre-wrap">{generatedPrompt}</p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Tips for better prompts:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Be specific about architectural elements and materials</li>
                  <li>Include lighting and environmental conditions</li>
                  <li>Specify style preferences (modern, traditional, etc.)</li>
                  <li>Add composition details for better framing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={generatePrompt}>
            Generate Prompt
          </Button>
          <Button onClick={handleUsePrompt} disabled={!generatedPrompt.trim()}>
            Use Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









