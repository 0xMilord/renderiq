'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Copy, 
  Check,
  Lightbulb,
  Tag
} from 'lucide-react';
import { 
  PROMPT_TEMPLATES, 
  PROMPT_CATEGORIES, 
  type PromptTemplate, 
  type PromptCategory,
  type PromptType,
  searchPrompts,
  getPromptsByCategory,
  getPromptsByType,
  renderPrompt
} from '@/lib/data/prompt-gallery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromptGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
  type?: PromptType; // Filter by generation type
}

export function PromptGalleryModal({ 
  isOpen, 
  onClose, 
  onSelectPrompt,
  type = 'both'
}: PromptGalleryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<PromptType>(type);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter prompts based on search, category, and type
  const filteredPrompts = useMemo(() => {
    let prompts = PROMPT_TEMPLATES;

    // Filter by type
    if (selectedType !== 'both') {
      prompts = getPromptsByType(selectedType);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      prompts = prompts.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      prompts = searchPrompts(searchQuery).filter(p => 
        prompts.includes(p)
      );
    }

    return prompts;
  }, [searchQuery, selectedCategory, selectedType]);

  const handleSelectPrompt = (template: PromptTemplate) => {
    const renderedPrompt = renderPrompt(template);
    onSelectPrompt(renderedPrompt);
    toast.success('Prompt added to input');
    onClose();
  };

  const handleCopyPrompt = async (template: PromptTemplate) => {
    const renderedPrompt = renderPrompt(template);
    await navigator.clipboard.writeText(renderedPrompt);
    setCopiedId(template.id);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Prompt Gallery
          </DialogTitle>
          <DialogDescription>
            Browse ready-made prompts optimized for architectural visualization. Click to use or copy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as PromptType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Video className="h-4 w-4 mr-2" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="both">
                  <Sparkles className="h-4 w-4 mr-2" />
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs"
              >
                All Categories
              </Button>
              {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as PromptCategory)}
                  className="text-xs"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Prompts List */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 space-y-4">
              {filteredPrompts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No prompts found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredPrompts.map((template) => (
                  <PromptCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template)}
                    onCopy={() => handleCopyPrompt(template)}
                    isCopied={copiedId === template.id}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PromptCardProps {
  template: PromptTemplate;
  onSelect: () => void;
  onCopy: () => void;
  isCopied: boolean;
}

function PromptCard({ template, onSelect, onCopy, isCopied }: PromptCardProps) {
  const categoryInfo = PROMPT_CATEGORIES[template.category];

  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{template.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryInfo.icon} {categoryInfo.label}
                </Badge>
                {template.type === 'image' && (
                  <Badge variant="outline" className="text-xs">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Image
                  </Badge>
                )}
                {template.type === 'video' && (
                  <Badge variant="outline" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )}
                {template.type === 'both' && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Both
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>

          {/* Prompt Preview */}
          <div className="bg-muted/50 rounded-md p-3 mt-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Prompt:</p>
            <p className="text-sm line-clamp-3">{template.prompt}</p>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Tips */}
          {template.tips && template.tips.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                <span className="font-medium">Tips:</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                {template.tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx} className="list-disc">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onSelect}
            className="w-full"
          >
            Use Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="w-full"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}





