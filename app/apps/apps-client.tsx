'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { ToolConfig, ToolCategory, CATEGORIES, getToolBySlug } from '@/lib/tools/registry';
import { isToolAccessible } from '@/lib/tools/feature-flags';
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
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
    setImagesLoaded(false);
    
    // Optimized: Use Image objects to preload and check existence simultaneously
    // This is more efficient than HEAD requests as it actually loads the images
    const checkAssets = () => {
      if (tool.outputType === 'video') {
        // For video, check with video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = videoSrc;
        video.onloadeddata = () => {
          setHasVideo(true);
          setImagesLoaded(true);
        };
        video.onerror = () => {
          setImagesLoaded(true);
        };
      } else {
        // Preload images and check if they load successfully
        // Using Image objects is more efficient - browser caches them and we can reuse
        let beforeLoaded = false;
        let afterLoaded = false;
        let checkComplete = false;
        let resolvedCount = 0;

        const checkCompleteStatus = () => {
          resolvedCount++;
          if (checkComplete || resolvedCount < 2) return;
          checkComplete = true;
          setHasBefore(beforeLoaded);
          setHasAfter(afterLoaded);
          setImagesLoaded(true);
        };

        // Use native Image constructor (window.Image) to avoid conflict with Next.js Image component
        // These images will be cached by the browser for the slider component
        const beforeImg = new window.Image();
        beforeImg.loading = 'eager'; // Eager loading for faster display
        beforeImg.onload = () => {
          beforeLoaded = true;
          checkCompleteStatus();
        };
        beforeImg.onerror = () => {
          checkCompleteStatus();
        };
        beforeImg.src = beforeImage;

        const afterImg = new window.Image();
        afterImg.loading = 'eager'; // Eager loading for faster display
        afterImg.onload = () => {
          afterLoaded = true;
          checkCompleteStatus();
        };
        afterImg.onerror = () => {
          checkCompleteStatus();
        };
        afterImg.src = afterImage;

        // Timeout fallback (reduced from 2000ms to 800ms for faster fallback while allowing images to load)
        setTimeout(() => {
          if (!checkComplete) {
            checkCompleteStatus();
          }
        }, 800);
      }
    };
    
    checkAssets();
  }, [tool.slug, tool.outputType, beforeImage, afterImage, videoSrc]);

  // Now we can do conditional returns after all hooks
  // Video tool with video available
  if (tool.outputType === 'video' && hasVideo) {
    return (
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
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
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          .tool-card-slider-wrapper-${tool.slug} {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          .tool-card-slider-wrapper-${tool.slug} > div {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
          }
          .tool-card-slider-wrapper-${tool.slug} .react-before-after-slider-container {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            overflow: hidden !important;
            display: block !important;
          }
          .tool-card-slider-wrapper-${tool.slug} .react-before-after-slider-container > div {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
          }
          .tool-card-slider-wrapper-${tool.slug} .react-before-after-slider-container img,
          .tool-card-slider-wrapper-${tool.slug} .react-before-after-slider-container picture,
          .tool-card-slider-wrapper-${tool.slug} .react-before-after-slider-container picture img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            display: block !important;
            max-width: none !important;
            max-height: none !important;
          }
        `}} />
        <div 
          className={`relative w-full aspect-[4/3] bg-muted tool-card-slider-wrapper-${tool.slug}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 overflow-hidden">
            <ReactBeforeSliderComponent
              firstImage={{ imageUrl: beforeImage }}
              secondImage={{ imageUrl: afterImage }}
              currentPercentPosition={50}
            />
          </div>
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-20 pointer-events-none">
            Before
          </div>
          <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-20 pointer-events-none">
            After
          </div>
        </div>
      </>
    );
  }

  // Show loading state while checking
  if (!imagesLoaded && !hasBefore && !hasAfter && !hasVideo) {
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
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the main featured tool (render-section-drawing)
  const featuredTool = getToolBySlug('render-section-drawing');
  const isFeaturedToolAccessible = featuredTool ? isToolAccessible(featuredTool.id) : false;

  // Search results for dropdown - show all matching tools regardless of category
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return tools.filter(tool => {
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesDescription = tool.description.toLowerCase().includes(query);
      const matchesKeywords = tool.seo.keywords.some(kw => kw.toLowerCase().includes(query));
      return matchesName || matchesDescription || matchesKeywords;
    }).slice(0, 8); // Limit to 8 results
  }, [tools, searchQuery]);

  // Filter tools - only show online tools by default, but allow filtering
  // Exclude featured tool from grid if it's accessible (will show in featured section)
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.seo.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    // Exclude featured tool from grid if it's accessible and search is empty
    const isFeatured = tool.id === 'render-section-drawing';
    const shouldExclude = isFeatured && isFeaturedToolAccessible && searchQuery === '';
    return matchesCategory && matchesSearch && !shouldExclude;
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.trim().length > 0);
    setSelectedIndex(0);
  };

  // Handle tool selection from dropdown
  const handleToolSelect = (tool: ToolConfig) => {
    if (isToolAccessible(tool.id) && tool.status === 'online') {
      router.push(`/apps/${tool.slug}`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!showDropdown || searchResults.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleToolSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowDropdown(false);
          setSearchQuery('');
          searchInputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown, searchResults, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && searchResults.length > 0) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, searchResults.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

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
              {/* Search Bar with Dropdown */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                  className="pl-8 h-8 text-sm bg-background"
                />
                
                {/* Search Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                  >
                    {searchResults.map((tool, index) => {
                      const isAccessible = isToolAccessible(tool.id) && tool.status === 'online';
                      const CategoryIcon = categoryIcons[tool.category];
                      
                      return (
                        <div
                          key={tool.id}
                          onClick={() => isAccessible && handleToolSelect(tool)}
                          className={cn(
                            "px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-b-0",
                            index === selectedIndex 
                              ? "bg-primary/10 border-primary/20" 
                              : "hover:bg-muted/50",
                            !isAccessible && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-md bg-primary/10 mt-0.5 shrink-0">
                              <CategoryIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-foreground">
                                  {tool.name}
                                </h4>
                                {!isAccessible && (
                                  <Badge variant="secondary" className="text-xs">
                                    Offline
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {tool.description}
                              </p>
                            </div>
                            {isAccessible && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* No results message */}
                {showDropdown && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">No tools found</p>
                  </div>
                )}
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

      {/* Featured Tool Card - Main App */}
      {featuredTool && isFeaturedToolAccessible && (
        <section className="py-8 px-4 w-full bg-gradient-to-b from-primary/5 to-background">
          <div className="w-full max-w-7xl mx-auto">
            <div className="mb-4">
              <Badge variant="default" className="bg-primary text-primary-foreground mb-2">
                Featured Tool
              </Badge>
              <h2 className="text-2xl font-bold mb-1">Try Our Main Tool</h2>
              <p className="text-muted-foreground text-sm">
                Start with our most powerful tool for transforming renders into section drawings
              </p>
            </div>
            <Link href={`/apps/${featuredTool.slug}`}>
              <Card className="group transition-all duration-300 overflow-hidden hover:shadow-xl cursor-pointer hover:border-primary border-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Media Section */}
                  <div className="relative w-full aspect-square md:aspect-auto md:h-full min-h-[300px]">
                    <ToolCardMedia tool={featuredTool} />
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="default" className="bg-primary">
                        Available Now
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl mb-3 group-hover:text-primary transition-colors">
                      {featuredTool.name}
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg mb-6">
                      {featuredTool.description}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-sm">
                        {categories.find(c => c.id === featuredTool.category)?.name}
                      </Badge>
                      <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                        <span className="text-base font-semibold mr-2">Try Tool</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}

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
                  // Use effective status (respects feature flags)
                  const isOnline = tool.status === 'online';
                  
                  return (
                    <Link 
                      key={tool.id} 
                      href={isOnline ? `/apps/${tool.slug}` : '#'}
                      onClick={(e) => {
                        if (!isOnline) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Card className={cn(
                        "group transition-all duration-300 h-full overflow-hidden",
                        isOnline 
                          ? "hover:shadow-lg cursor-pointer hover:border-primary" 
                          : "opacity-60 cursor-not-allowed"
                      )}>
                        <ToolCardMedia tool={tool} />
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex gap-2">
                              {tool.priority === 'high' && (
                                <Badge variant="default" className="bg-primary">
                                  Popular
                                </Badge>
                              )}
                              {!isOnline && (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                  Offline
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className={cn(
                            "text-xl mb-2 transition-colors",
                            isOnline && "group-hover:text-primary"
                          )}>
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
                            {isOnline ? (
                              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                                <span className="text-sm font-medium mr-1">Try Tool</span>
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex items-center text-muted-foreground">
                                <span className="text-sm font-medium">Coming Soon</span>
                              </div>
                            )}
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

