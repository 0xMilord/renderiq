'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Search,
  Sparkles,
  LayoutGrid,
  Layers,
  PaintBucket,
  Home,
  Box,
  FileImage,
  Presentation
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToolConfig, ToolCategory, CATEGORIES } from '@/lib/tools/registry';
import { cn } from '@/lib/utils';

const categoryIcons: Record<ToolCategory, typeof Sparkles> = {
  transformation: Sparkles,
  floorplan: LayoutGrid,
  diagram: Layers,
  material: PaintBucket,
  interior: Home,
  '3d': Box,
  presentation: Presentation,
};

interface AppsPageClientProps {
  tools: ToolConfig[];
  categories: typeof CATEGORIES;
}

export function AppsPageClient({ tools, categories }: AppsPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.seo.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-8 px-4 bg-gradient-to-b from-primary/5 to-background border-b w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-7xl mx-auto">
            {/* Left Column: Title & Description */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                AI Architecture Tools
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                21 specialized tools for every stage of your architectural workflow. 
                From concept sketches to presentation boards—everything you need in one place.
              </p>
            </div>
            
            {/* Right Column: Search & Tags */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-base"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="px-2 py-0.5">
                  {tools.length} Tools
                </Badge>
                <Badge variant="secondary" className="px-2 py-0.5">
                  {categories.length} Categories
                </Badge>
                <Badge variant="secondary" className="px-2 py-0.5">
                  No Prompts Needed
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
        <div className="w-full px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "whitespace-nowrap",
                selectedCategory === 'all' && "bg-primary text-primary-foreground"
              )}
            >
              All Tools
              <Badge variant="secondary" className="ml-2">
                {tools.length}
              </Badge>
            </Button>
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              const categoryTools = tools.filter(t => t.category === category.id);
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "whitespace-nowrap",
                    selectedCategory === category.id && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {categoryTools.length}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 px-4 w-full">
        <div className="w-full">
          {filteredTools.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tools found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
                  {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => {
                  const CategoryIcon = categoryIcons[tool.category];
                  const category = categories.find(c => c.id === tool.category);
                  
                  return (
                    <Link key={tool.id} href={`/apps/${tool.slug}`}>
                      <Card className="group hover:shadow-lg transition-all duration-300 h-full cursor-pointer hover:border-primary">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                            </div>
                            {tool.priority === 'high' && (
                              <Badge variant="default" className="bg-primary">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                            {tool.name}
                          </CardTitle>
                          <CardDescription className="text-base line-clamp-2">
                            {tool.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {category?.name}
                            </Badge>
                            <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                              <span className="text-sm font-medium mr-1">Try Tool</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30 w-full">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start using these tools today. No prompts needed—just upload and generate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

