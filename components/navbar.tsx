'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useUserBillingStats } from '@/lib/hooks/use-subscription';
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
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  // ✅ BATCHED: Single hook replaces separate hooks to prevent N+1 queries
  const { data: billingStats, loading: billingLoading } = useUserBillingStats(profile?.id);
  const creditsData = billingStats?.credits;
  const creditsLoading = billingLoading;

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
    { 
      href: '/gallery', 
      icon: Images, 
      label: 'Gallery',
      dropdown: [
        { href: '/gallery', label: 'Browse Gallery' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/blog', label: 'Blog' },
      ]
    },
    { 
      href: '/use-cases', 
      icon: Lightbulb, 
      label: 'Use Cases',
      dropdown: [
        { href: '/use-cases', label: 'All Use Cases' },
        { href: '/use-cases/real-time-visualization', label: 'Real-time Visualization' },
        { href: '/use-cases/initial-prototyping', label: 'Initial Prototyping' },
        { href: '/use-cases/material-testing-built-spaces', label: 'Material Testing' },
        { href: '/use-cases/rapid-concept-video', label: 'Rapid Concept Video' },
        { href: '/use-cases/presentation-ready-graphics', label: 'Presentation Graphics' },
        { href: '/use-cases/social-media-content', label: 'Social Media Content' },
      ]
    },
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
        className="w-full fixed top-0 left-0 right-0 z-50 pointer-events-none bg-background"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-[0.4rem] pointer-events-auto">
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
              <span className="hidden md:inline text-lg font-bold text-foreground">Renderiq</span>
            </Link>
          </div>

          {/* Middle Section: Navigation Links */}
          {!loading && (
            <div className="flex-1 flex items-center justify-center">
              <nav 
                className="hidden md:flex items-center gap-2"
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const hasDropdown = item.dropdown && item.dropdown.length > 0;
                  const showText = active || hoveredNavItem === item.href;

                  return (
                    <div key={item.href} className="flex items-center">
                      {index > 0 && (
                        <div className="h-6 w-px bg-border/50 mx-1 shrink-0" />
                      )}
                      <div 
                        className="relative"
                        onMouseEnter={() => setHoveredNavItem(item.href)}
                        onMouseLeave={() => setHoveredNavItem(null)}
                      >
                        {hasDropdown ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "flex items-center gap-2 rounded-md text-sm font-medium transition-all duration-200 outline-none overflow-hidden",
                                  showText ? "px-3 py-2 gap-2" : "p-2 gap-0",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span 
                                  className={cn(
                                    "whitespace-nowrap transition-all duration-200",
                                    showText 
                                      ? "opacity-100 max-w-[200px] ml-0" 
                                      : "opacity-0 max-w-0 ml-0 w-0"
                                  )}
                                >
                                  {item.label}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="start" 
                              className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg z-50 p-2 min-w-[200px]"
                            >
                              {item.dropdown?.map((dropdownItem) => (
                                <DropdownMenuItem key={dropdownItem.href} asChild>
                                  <Link 
                                    href={dropdownItem.href}
                                    className="cursor-pointer"
                                  >
                                    {dropdownItem.label}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md text-sm font-medium transition-all duration-200 overflow-hidden",
                              showText ? "px-3 py-2 gap-2" : "p-2 gap-0",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span 
                              className={cn(
                                "whitespace-nowrap transition-all duration-200",
                                showText 
                                  ? "opacity-100 max-w-[200px] ml-0" 
                                  : "opacity-0 max-w-0 ml-0 w-0"
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center">
                  <div className="h-6 w-px bg-border/50 mx-1 shrink-0" />
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredNavItem('apps')}
                    onMouseLeave={() => setHoveredNavItem(null)}
                  >
                  <DropdownMenu open={isAppsDropdownOpen} onOpenChange={setIsAppsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className={cn(
                          "flex items-center gap-2 rounded-md text-sm font-medium transition-all duration-200 outline-none overflow-hidden",
                          (hoveredNavItem === 'apps' || pathname.startsWith('/apps')) ? "px-3 py-2 gap-2" : "p-2 gap-0",
                          pathname.startsWith('/apps')
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Wrench className="h-4 w-4 shrink-0" />
                        <span 
                          className={cn(
                            "whitespace-nowrap transition-all duration-200",
                            (hoveredNavItem === 'apps' || pathname.startsWith('/apps'))
                              ? "opacity-100 max-w-[400px] ml-0" 
                              : "opacity-0 max-w-0 ml-0 w-0"
                          )}
                        >
                          Apps
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="bg-background border border-border rounded-lg shadow-lg z-50 p-4"
                  >
                    <div className="grid grid-cols-5 gap-0 min-w-[600px]">
                      {getAllTools().map((tool, index) => {
                        const ToolIcon = getToolIcon(tool.id);
                        const isLastInRow = (index + 1) % 5 === 0;
                        return (
                          <div key={tool.id} className="relative">
                            {!isLastInRow && (
                              <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
                            )}
                            <DropdownMenuItem asChild>
                              <Link 
                                href={`/apps/${tool.slug}`}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors min-w-0"
                              >
                                <ToolIcon className="h-4 w-4 shrink-0" />
                                <span className="text-xs leading-tight truncate min-w-0">{tool.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          </div>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                  </div>
                </div>
              </nav>
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
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                            <Images className="h-4 w-4" />
                            <span className="text-base font-medium">Gallery</span>
                          </div>
                          <div className="ml-6 space-y-0.5">
                            <Link
                              href="/gallery"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Browse Gallery</span>
                            </Link>
                            <Link
                              href="/pricing"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Pricing</span>
                            </Link>
                            <Link
                              href="/blog"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Blog</span>
                            </Link>
                          </div>
                        </div>
                        <div className="px-3 py-2">
                          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                            <Lightbulb className="h-4 w-4" />
                            <span className="text-base font-medium">Use Cases</span>
                          </div>
                          <div className="ml-6 space-y-0.5">
                            <Link
                              href="/use-cases"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>All Use Cases</span>
                            </Link>
                            <Link
                              href="/use-cases/real-time-visualization"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Real-time Visualization</span>
                            </Link>
                            <Link
                              href="/use-cases/initial-prototyping"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Initial Prototyping</span>
                            </Link>
                            <Link
                              href="/use-cases/material-testing-built-spaces"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Material Testing</span>
                            </Link>
                            <Link
                              href="/use-cases/rapid-concept-video"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Rapid Concept Video</span>
                            </Link>
                            <Link
                              href="/use-cases/presentation-ready-graphics"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Presentation Graphics</span>
                            </Link>
                            <Link
                              href="/use-cases/social-media-content"
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary block px-2 py-1.5 rounded-md transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Social Media Content</span>
                            </Link>
                          </div>
                        </div>
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
