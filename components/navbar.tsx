'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useCreditsWithReset } from '@/lib/hooks/use-subscription';
import { UserDropdown } from '@/components/user-dropdown';
import { AlphaBanner } from '@/components/alpha-banner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, Home, Sparkles, Images, Lightbulb, CreditCard, FileText, Newspaper, Play, Wrench, Layout, Coins, Layers, Square, Box, Palette, Sofa, Maximize2, Grid3x3, Brush, Split, RotateCw, Sun, Package, Replace, Image as ImageIcon, FileStack, LayoutGrid, Film } from 'lucide-react';
import { 
  FaGithub, 
  FaXTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaInstagram, 
  FaDiscord,
  FaReddit,
  FaThreads,
  FaQuora
} from 'react-icons/fa6';
import { SiBluesky } from 'react-icons/si';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CATEGORIES, getToolsByCategory, getAllTools } from '@/lib/tools/registry';

// Icon mapping for tools
const getToolIcon = (toolId: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Transformation tools
    'render-section-drawing': Layers,
    'render-to-cad': Square,
    'render-upscale': Maximize2,
    'render-effects': Sparkles,
    
    // Floorplan tools
    'floorplan-to-furnished': Sofa,
    'floorplan-to-3d': Box,
    'floorplan-technical-diagrams': Grid3x3,
    
    // Diagram tools
    'exploded-diagram': Split,
    'multi-angle-view': RotateCw,
    
    // Material tools
    'change-texture': Palette,
    'material-alteration': Brush,
    'change-lighting': Sun,
    
    // Interior tools
    'upholstery-change': Sofa,
    'product-placement': Package,
    'item-change': Replace,
    'moodboard-to-render': ImageIcon,
    
    // 3D tools
    '3d-to-render': Box,
    'sketch-to-render': FileStack,
    
    // Presentation tools
    'presentation-board-maker': LayoutGrid,
    'portfolio-layout-generator': FileStack,
    'presentation-sequence-creator': Film,
  };
  
  return iconMap[toolId] || Wrench;
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const { data: creditsData, loading: creditsLoading } = useCreditsWithReset(profile?.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = mounted 
    ? (currentTheme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg')
    : '/logo-dark.svg'; // Default to dark logo until mounted

  // Navigation items configuration
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/render', icon: Sparkles, label: 'Render' },
    { href: '/canvas', icon: Layout, label: 'Canvas' },
    { href: '/gallery', icon: Images, label: 'Gallery' },
    { href: '/docs', icon: FileText, label: 'Docs' },
  ];

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav 
        className="w-full fixed top-0 left-0 right-0 z-50 pt-4 pointer-events-none bg-background"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className="flex items-center justify-between h-11 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              {mounted ? (
                <Image
                  src={logoSrc}
                  alt="Renderiq"
                  width={44}
                  height={44}
                  className="h-11 w-auto"
                />
              ) : (
                <Skeleton className="h-11 w-11 rounded" />
              )}
              <span className="text-lg font-bold text-foreground">Renderiq</span>
            </Link>
          </div>

          {/* Middle Section: Navigation Links Dock */}
          {!loading && (
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="hidden md:flex items-center gap-0 bg-muted/80 backdrop-blur-sm border border-border/50 rounded-full px-2 py-2 shadow-lg h-11"
                onMouseLeave={() => {
                  // Only clear hover if dropdown is not open
                  if (!isAppsDropdownOpen) {
                    setHoveredItem(null);
                  }
                }}
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const isHovered = hoveredItem === item.href;
                  const showText = active || isHovered;

                  return (
                    <div key={item.href} className="flex items-center">
                      {index > 0 && (
                        <div className="h-6 w-px bg-border/50 mx-0.5 shrink-0" />
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full transition-all duration-300 ease-in-out overflow-hidden",
                              "text-foreground hover:text-primary relative",
                              active 
                                ? "bg-background/50 text-primary" 
                                : "hover:bg-background/50",
                              showText ? "px-3 w-auto" : "w-10 px-0 justify-center",
                              // Add safe zone padding to prevent flickering
                              "before:absolute before:inset-0 before:-mx-1 before:pointer-events-none"
                            )}
                            onMouseEnter={() => setHoveredItem(item.href)}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span 
                              className={cn(
                                "whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out",
                                showText 
                                  ? "opacity-100 max-w-[200px] ml-0" 
                                  : "opacity-0 max-w-0 ml-0 w-0"
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </TooltipTrigger>
                        {!showText && (
                          <TooltipContent side="bottom" sideOffset={8}>
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  );
                })}
                <div className="flex items-center">
                  <div className="h-6 w-px bg-border/50 mx-0.5 shrink-0" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DropdownMenu open={isAppsDropdownOpen} onOpenChange={setIsAppsDropdownOpen}>
                          <DropdownMenuTrigger asChild>
                            <button 
                              className={cn(
                                "flex items-center gap-1.5 rounded-full transition-all duration-300 ease-in-out overflow-hidden outline-none relative",
                                pathname.startsWith('/apps')
                                  ? "bg-background/50 text-primary"
                                  : "text-foreground hover:text-primary hover:bg-background/50",
                                hoveredItem === 'apps' || pathname.startsWith('/apps') || isAppsDropdownOpen
                                  ? "px-3 w-auto" 
                                  : "w-10 px-0 justify-center",
                                // Add safe zone padding to prevent flickering
                                "before:absolute before:inset-0 before:-mx-1 before:pointer-events-none"
                              )}
                              onMouseEnter={() => setHoveredItem('apps')}
                            >
                              <Wrench className="h-5 w-5 shrink-0" />
                              <span 
                                className={cn(
                                  "whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out",
                                  hoveredItem === 'apps' || pathname.startsWith('/apps') || isAppsDropdownOpen
                                    ? "opacity-100 max-w-[200px] ml-0" 
                                    : "opacity-0 max-w-0 ml-0 w-0"
                                )}
                              >
                                Apps
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="center" 
                            className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg z-50 p-4"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <div className="grid grid-cols-5 gap-2 min-w-[600px]">
                              {getAllTools().map((tool) => {
                                const ToolIcon = getToolIcon(tool.id);
                                return (
                                  <DropdownMenuItem key={tool.id} asChild>
                                    <Link 
                                      href={`/apps/${tool.slug}`}
                                      className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-accent transition-colors"
                                    >
                                      <ToolIcon className="h-5 w-5 shrink-0" />
                                      <span className="text-xs text-center leading-tight">{tool.name}</span>
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TooltipTrigger>
                    {!(hoveredItem === 'apps' || pathname.startsWith('/apps')) && (
                      <TooltipContent side="bottom" sideOffset={8}>
                        Apps
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Right Section: Start Creating Button, User Dropdown, and Hamburger Menu */}
          <div className="flex items-center flex-shrink-0 gap-2">
            {loading ? (
              <Skeleton className="w-8 h-8 rounded-full" />
            ) : (
              <>
                {/* Right Section: Credits, User Dropdown, Theme Toggle, Hamburger */}
                <div className="flex items-center gap-2">
                  {/* Credits Display - Only for authenticated users */}
                  {user && (
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
                      <Coins className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        {creditsLoading ? '...' : creditsData?.balance ?? 0}
                      </span>
                    </div>
                  )}
                  
                  {/* User Dropdown - Always show on desktop, and on mobile when authenticated */}
                  <div className={cn(
                    "flex items-center gap-2",
                    user ? "" : "hidden md:flex" // Hide on mobile when not authenticated
                  )}>
                    {!user && <ThemeToggle />}
                    <UserDropdown />
                  </div>
                  
                  {/* User Dropdown on mobile - Only when not authenticated (shows Sign In/Sign Up) */}
                  {!user && (
                    <div className="md:hidden flex items-center gap-2">
                      <ThemeToggle />
                      <UserDropdown />
                    </div>
                  )}
                  
                  {/* Hamburger Menu Button - Show on desktop when authenticated, always on mobile */}
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-full",
                          user ? "bg-muted/80 backdrop-blur-sm border border-border/50" : "md:hidden" // Hide on desktop when not authenticated
                        )}
                      >
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[280px] sm:w-[300px] p-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="h-full flex flex-col">
                      <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                        {/* Start Creating Button - Show when authenticated */}
                        {user && (
                          <Link
                            href="/render"
                            className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 block px-3 py-2 rounded-md text-base font-medium transition-colors mb-4"
                            onClick={() => setIsOpen(false)}
                          >
                            <Play className="h-4 w-4" />
                            <span>Start creating</span>
                          </Link>
                        )}
                        <Link
                          href="/"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Home className="h-4 w-4" />
                          <span>Home</span>
                        </Link>
                        <Link
                          href="/render"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Render</span>
                        </Link>
                        <Link
                          href="/use-cases"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Lightbulb className="h-4 w-4" />
                          <span>Use Cases</span>
                        </Link>
                        <Link
                          href="/gallery"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Images className="h-4 w-4" />
                          <span>Gallery</span>
                        </Link>
                        <Link
                          href="/pricing"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Pricing</span>
                        </Link>
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                            <Wrench className="h-4 w-4" />
                            <span className="text-base font-medium">Apps</span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {CATEGORIES.map((category) => {
                              const categoryTools = getToolsByCategory(category.id);
                              if (categoryTools.length === 0) return null;
                              
                              return (
                                <div key={category.id} className="mb-3">
                                  <div className="text-sm font-semibold text-foreground mb-1 px-2">
                                    {category.name}
                                  </div>
                                  <div className="space-y-0.5">
                                    {categoryTools.map((tool) => {
                                      const ToolIcon = getToolIcon(tool.id);
                                      return (
                                        <Link
                                          key={tool.id}
                                          href={`/apps/${tool.slug}`}
                                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                                          onClick={() => setIsOpen(false)}
                                        >
                                          <ToolIcon className="h-4 w-4 shrink-0" />
                                          <span>{tool.name}</span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <Link
                          href="/blog"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Newspaper className="h-4 w-4" />
                          <span>Blog</span>
                        </Link>
                        <Link
                          href="/docs"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Docs</span>
                        </Link>
                      </div>
                      
                      {/* Social Links */}
                      <div className="px-6 py-4 border-t shrink-0">
                        <h3 className="text-xs font-semibold text-foreground mb-2">Follow Us</h3>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="https://bsky.app/profile/renderiq.bsky.social"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Bluesky"
                          >
                            <SiBluesky className="h-4 w-4" />
                          </a>
                          <a
                            href="https://x.com/renderiq_ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="X (Twitter)"
                          >
                            <FaXTwitter className="h-4 w-4" />
                          </a>
                          <a
                            href="https://github.com/renderiq-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="GitHub"
                          >
                            <FaGithub className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.linkedin.com/company/renderiq-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="LinkedIn"
                          >
                            <FaLinkedin className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.instagram.com/renderiq.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Instagram"
                          >
                            <FaInstagram className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.youtube.com/@Renderiq_ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="YouTube"
                          >
                            <FaYoutube className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.reddit.com/user/Renderiq-AI/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Reddit"
                          >
                            <FaReddit className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.threads.com/@renderiq.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Threads"
                          >
                            <FaThreads className="h-4 w-4" />
                          </a>
                          <a
                            href="https://www.quora.com/profile/Renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Quora"
                          >
                            <FaQuora className="h-4 w-4" />
                          </a>
                          <a
                            href="https://discord.gg/KADV5pX3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                            onClick={() => setIsOpen(false)}
                            title="Discord"
                          >
                            <FaDiscord className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Legal Links */}
                      <div className="px-6 py-3 border-t shrink-0">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <Link
                            href="/terms"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Terms
                          </Link>
                          <Link
                            href="/privacy"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Privacy
                          </Link>
                          <Link
                            href="/refund"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Refund
                          </Link>
                          <Link
                            href="/cookies"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Cookies
                          </Link>
                          <Link
                            href="/dpa"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            DPA
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </nav>
      <AlphaBanner />
    </>
  );
}
