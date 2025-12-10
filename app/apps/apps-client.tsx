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
import { useSearchFilterStore } from '@/lib/stores/search-filter-store';

const categoryIcons: Record<ToolCategory, typeof Sparkles> = {
  transformation: Sparkles,
  floorplan: LayoutGrid,
  diagram: Layers,
  material: PaintBucket,
  interior: Home,
  '3d': Box,
  presentation: Presentation,
  video: Play,
};

// Get custom SVG icon path for tools
const getToolIconPath = (slug: string): string => {
  return `/apps/icons/${slug}.svg`;
};

// Component to display tool cover image
function ToolCardMedia({ tool }: { tool: ToolConfig }) {
  const [imageError, setImageError] = useState(false);
  const coverImage = `/apps/cover/${tool.slug}.jpg`;

  return (
    <div className="relative w-full aspect-video bg-muted overflow-hidden">
      <Image
        src={coverImage}
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

// Component to render tool icon with fallback to category icon
function ToolIconWithFallback({ 
  tool, 
  CategoryIcon 
}: { 
  tool: ToolConfig; 
  CategoryIcon: typeof Sparkles;
}) {
  const [iconError, setIconError] = useState(false);
  const iconPath = getToolIconPath(tool.slug);

  if (iconError) {
    return <CategoryIcon className="h-16 w-16 text-primary" />;
  }

  return (
    <img 
      src={iconPath} 
      alt={tool.name}
      className="w-16 h-16 object-contain rounded-md"
      onError={() => setIconError(true)}
    />
  );
}

interface AppsPageClientProps {
  tools: ToolConfig[];
  categories: typeof CATEGORIES;
}

export function AppsPageClient({ tools, categories }: AppsPageClientProps) {
  const router = useRouter();
  
  // ✅ MIGRATED: Using Zustand stores for state management
  const { toolSearchQuery, toolCategory, setToolFilters } = useSearchFilterStore();
  
  // Use store values with local aliases for backward compatibility
  const selectedCategory = toolCategory;
  const searchQuery = toolSearchQuery;
  const setSelectedCategory = (category: ToolCategory | 'all') => setToolFilters(searchQuery, category);
  const setSearchQuery = (query: string) => setToolFilters(query, selectedCategory);
  
  // Local state (ephemeral, not persisted)
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);


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
  // Filter tools by category and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.seo.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
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
      <section className="relative pb-8 bg-primary w-full mt-[var(--navbar-height)] pt-6">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full">
            {/* Left Column: Title & Description */}
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-primary-foreground">
                AI Architecture Apps
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/80">
                {tools.length} specialized apps for every stage of your architectural workflow. 
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
                  placeholder="Search apps..."
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
                    <p className="text-sm text-muted-foreground">No apps found</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="px-2 py-0.5">
                  {tools.length} Apps
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
      <section className="sticky top-[var(--navbar-height)] z-10 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-b w-full">
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
              All Apps
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
              <h3 className="text-xl font-semibold mb-2">No apps found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing {filteredTools.length} {filteredTools.length === 1 ? 'app' : 'apps'}
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
                        "group transition-all duration-300 h-full overflow-hidden flex flex-col",
                        isOnline 
                          ? "hover:shadow-lg cursor-pointer hover:border-primary" 
                          : "opacity-60 cursor-not-allowed"
                      )}>
                        {/* Image with category badge overlay */}
                        <div className="relative">
                          <ToolCardMedia tool={tool} />
                          {/* Category badge over image */}
                          {category && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="default" className="bg-primary text-primary-foreground">
                                {category.name}
                              </Badge>
                            </div>
                          )}
                          {/* Priority/Status badges */}
                          <div className="absolute top-2 right-2 flex gap-2">
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
                        
                        <CardHeader className="flex-1 flex flex-col">
                          {/* Icon, Title, and Description in same row */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors overflow-hidden shrink-0">
                              <ToolIconWithFallback tool={tool} CategoryIcon={CategoryIcon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className={cn(
                                "text-xl mb-1 transition-colors line-clamp-1",
                                isOnline && "group-hover:text-primary"
                              )}>
                                {tool.name}
                              </CardTitle>
                              <CardDescription className="text-sm line-clamp-2">
                                {tool.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Go to App button - full width, primary */}
                          {isOnline ? (
                            <Button 
                              variant="default" 
                              className="w-full"
                            >
                              <span className="text-sm font-medium mr-1">Go to App</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full"
                              disabled
                            >
                              <span className="text-sm font-medium">Coming Soon</span>
                            </Button>
                          )}
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
            Start using these apps today. No prompts needed—just upload and generate.
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

