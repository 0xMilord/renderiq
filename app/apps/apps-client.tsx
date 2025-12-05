'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Presentation,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToolConfig, ToolCategory, CATEGORIES } from '@/lib/tools/registry';
import { cn } from '@/lib/utils';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

const categoryIcons: Record<ToolCategory, typeof Sparkles> = {
  transformation: Sparkles,
  floorplan: LayoutGrid,
  diagram: Layers,
  material: PaintBucket,
  interior: Home,
  '3d': Box,
  presentation: Presentation,
};

// Component to handle tool card media (before/after slider, video, or single image)
function ToolCardMedia({ tool }: { tool: ToolConfig }) {
  // All hooks must be declared first, before any conditional returns
  const [hasBefore, setHasBefore] = useState(false);
  const [hasAfter, setHasAfter] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const beforeImage = `/apps/${tool.slug}-before.jpg`;
  const afterImage = `/apps/${tool.slug}-after.jpg`;
  const videoSrc = `/apps/${tool.slug}.mp4`;
  const fallbackImage = `/apps/${tool.slug}.png`;

  useEffect(() => {
    // Reset states when tool changes
    setHasBefore(false);
    setHasAfter(false);
    setHasVideo(false);
    setImageError(false);
    setIsChecking(true);
    
    // Check if images/video exist
    const checkAssets = async () => {
      if (tool.outputType === 'video') {
        // Check if video exists
        try {
          const response = await fetch(videoSrc, { method: 'HEAD' });
          if (response.ok) {
            setHasVideo(true);
          }
        } catch {
          // Video doesn't exist, will fallback to image
        }
        setIsChecking(false);
      } else {
        // Check if before/after images exist using fetch
        const checkBefore = fetch(beforeImage, { method: 'HEAD' })
          .then(res => {
            if (res.ok) setHasBefore(true);
          })
          .catch(() => {});
        
        const checkAfter = fetch(afterImage, { method: 'HEAD' })
          .then(res => {
            if (res.ok) setHasAfter(true);
          })
          .catch(() => {});
        
        Promise.all([checkBefore, checkAfter]).then(() => {
          setIsChecking(false);
        });
        
        // Timeout fallback
        setTimeout(() => setIsChecking(false), 2000);
      }
    };
    checkAssets();
  }, [tool.slug, tool.outputType, beforeImage, afterImage, videoSrc]);

  // Now we can do conditional returns after all hooks
  // Video tool with video available
  if (tool.outputType === 'video' && hasVideo) {
    return (
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        <video
          src={videoSrc}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm rounded-full p-3">
            <Play className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Before/After slider if both images exist
  if (hasBefore && hasAfter) {
    return (
      <div 
        className="relative w-full aspect-square bg-muted overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ReactBeforeSliderComponent
          firstImage={{ imageUrl: beforeImage }}
          secondImage={{ imageUrl: afterImage }}
          currentPercentPosition={50}
        />
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
          Before
        </div>
        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
          After
        </div>
      </div>
    );
  }

  // Show loading state while checking
  if (isChecking && !hasBefore && !hasAfter && !hasVideo) {
    return (
      <div className="relative w-full aspect-square bg-muted overflow-hidden flex items-center justify-center">
        <div className="animate-pulse">
          <FileImage className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Fallback to single image
  return (
    <div className="relative w-full aspect-square bg-muted overflow-hidden">
      <Image
        src={fallbackImage}
        alt={tool.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        onError={() => setImageError(true)}
      />
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <FileImage className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

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
      <section className="relative pt-[calc(1rem+2.75rem+1.5rem)] pb-8 bg-primary w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full">
            {/* Left Column: Title & Description */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-primary-foreground">
                AI Architecture Tools
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/80">
                21 specialized tools for every stage of your architectural workflow. 
                From concept sketches to presentation boards—everything you need in one place.
              </p>
            </div>
            
            {/* Right Column: Search & Tags */}
            <div className="space-y-4 w-full bg-background/50 rounded-lg px-4 sm:px-6 lg:px-8 py-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-background"
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
      <section className="sticky top-[calc(1rem+2.75rem)] z-10 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-b w-full">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTools.map((tool) => {
                  const CategoryIcon = categoryIcons[tool.category];
                  const category = categories.find(c => c.id === tool.category);
                  
                  return (
                    <Link key={tool.id} href={`/apps/${tool.slug}`}>
                      <Card className="group hover:shadow-lg transition-all duration-300 h-full cursor-pointer hover:border-primary overflow-hidden">
                        <ToolCardMedia tool={tool} />
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

