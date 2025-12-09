'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Copy, 
  Check,
  Lightbulb,
  Tag,
  ExternalLink
} from 'lucide-react';
import { 
  PROMPT_TEMPLATES, 
  PROMPT_CATEGORIES, 
  type PromptTemplate, 
  type PromptCategory,
  type PromptType,
  searchPrompts,
  getPromptsByType,
  renderPrompt
} from '@/lib/data/prompt-gallery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function PromptGalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<PromptType>('both');
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

  const handleCopyPrompt = async (template: PromptTemplate) => {
    const renderedPrompt = renderPrompt(template);
    await navigator.clipboard.writeText(renderedPrompt);
    setCopiedId(template.id);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Prompt Gallery</h1>
            <p className="text-muted-foreground mt-1">
              Ready-made prompts optimized for architectural visualization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Browse prompts designed for</span>
          <Link href="/" className="text-primary hover:underline flex items-center gap-1">
            Renderiq <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find the perfect prompt for your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <TabsList className="grid w-full max-w-md grid-cols-3">
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
            >
              All Categories
            </Button>
            {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key as PromptCategory)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No prompts found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((template) => (
            <PromptCard
              key={template.id}
              template={template}
              onCopy={() => handleCopyPrompt(template)}
              isCopied={copiedId === template.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PromptCardProps {
  template: PromptTemplate;
  onCopy: () => void;
  isCopied: boolean;
}

function PromptCard({ template, onCopy, isCopied }: PromptCardProps) {
  const categoryInfo = PROMPT_CATEGORIES[template.category];

  return (
    <Card className="flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-lg">{template.title}</CardTitle>
          <div className="flex gap-1 shrink-0">
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
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {categoryInfo.icon} {categoryInfo.label}
          </Badge>
        </div>
        <CardDescription className="text-sm">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Prompt Preview */}
        <div className="bg-muted/50 rounded-md p-3 mb-4 flex-1">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Prompt:</p>
          <p className="text-sm line-clamp-4">{template.prompt}</p>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {template.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Tips */}
        {template.tips && template.tips.length > 0 && (
          <div className="mb-4 space-y-1">
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

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="w-full"
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Prompt
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

