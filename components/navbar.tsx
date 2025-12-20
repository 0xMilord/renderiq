'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useUserBillingStats } from '@/lib/hooks/use-subscription';
import { UserDropdown } from '@/components/user-dropdown';
import { AlphaBanner } from '@/components/alpha-banner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, Home, Sparkles, Images, Lightbulb, CreditCard, FileText, Newspaper, Play, Wrench, Layout, Coins, HelpCircle, Info } from 'lucide-react';
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

// Get custom SVG icon path for tools
// Get app icon path (uses app ID, not slug, since icon files use IDs)
const getAppIconPath = (appId: string): string => {
  return `/apps/icons/${appId}.svg`;
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAppsDropdownOpen, setIsAppsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const { user, loading } = useAuth();
  // Get initialized state from store to check if auth has been initialized
  const initialized = useAuthStore((state) => state.initialized);
  // ✅ OPTIMIZED: Use user.id directly instead of waiting for profile to prevent sequential dependency
  // This allows billing stats to fetch in parallel with profile fetch
  const { data: billingStats, loading: billingLoading } = useUserBillingStats(user?.id);
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

  // Navigation items configuration - Main visible navbar items
  // Show "Dashboard" instead of "Home" for authenticated users
  const navItems = [
    { href: user ? '/dashboard' : '/', icon: Home, label: user ? 'Dashboard' : 'Home' },
    { href: '/render', icon: Sparkles, label: 'Render' },
    { href: '/canvas', icon: Layout, label: 'Canvas' },
    { href: '/gallery', icon: Images, label: 'Gallery' },
  ];

  // Hamburger menu items - Moved from main navbar
  const hamburgerMenuItems = [
    { href: '/pricing', icon: CreditCard, label: 'Pricing' },
    { href: '/blog', icon: Newspaper, label: 'Blog' },
    { href: '/use-cases', icon: Lightbulb, label: 'Use Cases' },
    { href: '/docs', icon: FileText, label: 'Docs' },
    { href: '/support', icon: HelpCircle, label: 'Support' },
    { href: '/about', icon: Info, label: 'About' },
  ];

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/' || href === '/dashboard') {
      // For home/dashboard, check both routes based on auth state
      if (user) {
        return pathname === '/dashboard' || pathname.startsWith('/dashboard');
      }
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
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const hasDropdown = item.dropdown && item.dropdown.length > 0;

                  return (
                    <div key={item.href} className="flex items-center">
                      {index > 0 && (
                        <div className="h-6 w-px bg-border/50 mx-1 shrink-0" />
                      )}
                      <div className="relative">
                        {hasDropdown ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 outline-none",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">
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
                              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">
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
                  <div className="relative">
                  <DropdownMenu open={isAppsDropdownOpen} onOpenChange={setIsAppsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 outline-none",
                          pathname.startsWith('/apps')
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <Wrench className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          Apps
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="bg-background border border-border rounded-lg shadow-lg z-50 p-4 w-auto min-w-[400px] max-w-[600px]"
                  >
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {/* View All Apps - First Item */}
                      <div className="relative">
                        <DropdownMenuItem asChild>
                          <Link 
                            href="/apps"
                            className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:bg-primary/20 hover:border-primary transition-all min-w-0 w-full"
                          >
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 flex-shrink-0">
                              <Wrench className="h-3.5 w-3.5 shrink-0" />
                            </div>
                            <span className="text-xs leading-snug break-words min-w-0 flex-1">View All Apps</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      {getAllTools().map((tool, index) => {
                        const iconPath = getAppIconPath(tool.id);
                        return (
                          <div key={tool.id} className="relative">
                            <DropdownMenuItem asChild>
                              <Link 
                                href={`/${tool.slug}`}
                                className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:bg-primary/20 hover:border-primary transition-all min-w-0 w-full"
                              >
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 flex-shrink-0">
                                  <img 
                                    src={iconPath} 
                                    alt={tool.name}
                                    className="w-full h-full object-contain rounded-md"
                                    onError={(e) => {
                                      // Fallback to a default icon if custom icon doesn't exist
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <span className="text-xs leading-snug break-words min-w-0 flex-1">{tool.name}</span>
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
            {/* ✅ Safety check: Only show loading skeleton during initial auth check */}
            {/* If user is null after initialization, show non-auth UI immediately */}
            {loading && !initialized ? (
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
                  
                  {/* Hamburger Menu Button - Always show */}
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-full",
                          user ? "bg-muted/80 backdrop-blur-sm border border-border/50" : "bg-muted/80 backdrop-blur-sm border border-border/50"
                        )}
                      >
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[320px] sm:w-[360px] p-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="h-full flex flex-col">
                      <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Apps Grid - 2 columns */}
                        <div className="grid grid-cols-2 gap-3">
                          {getAllTools().slice(0, 20).map((tool) => {
                            const iconPath = getAppIconPath(tool.id);
                            return (
                              <Link
                                key={tool.id}
                                href={`/${tool.slug}`}
                                className="flex flex-row items-center justify-start gap-2 p-2 rounded-lg border border-transparent hover:bg-primary/20 hover:border-primary transition-all group"
                                onClick={() => setIsOpen(false)}
                              >
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden shrink-0">
                                  <img 
                                    src={iconPath} 
                                    alt={tool.name}
                                    className="w-full h-full object-contain rounded-md"
                                    onError={(e) => {
                                      // Fallback to a default icon if custom icon doesn't exist
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight truncate min-w-0 flex-1">
                                  {tool.name}
                                </span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-border" />

                        {/* Node Canvas and Render Links */}
                        <div className="space-y-2">
                          <Link
                            href="/canvas"
                            className="flex items-center space-x-3 text-muted-foreground hover:text-foreground block px-3 py-2.5 rounded-md text-base font-medium transition-colors border border-transparent hover:bg-primary/20 hover:border-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            <Layout className="h-5 w-5" />
                            <span>Node Canvas</span>
                          </Link>
                          <Link
                            href="/render"
                            className="flex items-center space-x-3 text-muted-foreground hover:text-foreground block px-3 py-2.5 rounded-md text-base font-medium transition-colors border border-transparent hover:bg-primary/20 hover:border-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            <Sparkles className="h-5 w-5" />
                            <span>Render</span>
                          </Link>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-border" />

                        {/* Pricing, Blog, Use Cases, Docs, Support, About */}
                        <div className="space-y-2">
                          {hamburgerMenuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                  "flex flex-row items-center gap-3 text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-md text-base font-medium transition-colors border border-transparent hover:bg-primary/20 hover:border-primary",
                                  active && "text-foreground bg-primary/10 border-primary"
                                )}
                                onClick={() => setIsOpen(false)}
                              >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className="flex-1">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
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
                            className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Terms
                          </Link>
                          <Link
                            href="/privacy"
                            className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Privacy
                          </Link>
                          <Link
                            href="/refund"
                            className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Refund
                          </Link>
                          <Link
                            href="/cookies"
                            className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Cookies
                          </Link>
                          <Link
                            href="/dpa"
                            className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
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
      {/* End-to-end separator below main app header */}
      <div className="fixed top-[var(--navbar-height)] left-0 right-0 z-50 h-px bg-border pointer-events-none" />
      <AlphaBanner />
    </>
  );
}
