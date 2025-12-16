'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Sparkles, Images, User, CreditCard, Heart, FileText, HelpCircle, Layout, LayoutDashboard, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { getAllTools } from '@/lib/tools/registry';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Get custom SVG icon path for tools
const getToolIconPath = (slug: string): string => {
  return `/apps/icons/${slug}.svg`;
};

const publicNavItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/canvas', icon: Layout, label: 'Canvas' },
  { href: '/gallery', icon: Images, label: 'Gallery' },
  { href: '/docs', icon: FileText, label: 'Docs' },
  { href: '/pricing', icon: CreditCard, label: 'Pricing' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
];

const authenticatedNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/canvas', icon: Layout, label: 'Canvas' },
  { href: '/gallery', icon: Images, label: 'Gallery' },
  { href: '/dashboard/likes', icon: Heart, label: 'Likes' },
  // Apps will be handled separately as a dropdown
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAppsSheetOpen, setIsAppsSheetOpen] = useState(false);

  // Hide bottom nav on render routes, project/chain routes, dashboard routes, demo route, and auth routes
  if (
    pathname.includes('/render') || 
    pathname.startsWith('/project/') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/demo') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return null;
  }

  // Get all tools for Apps dropdown
  const allTools = getAllTools();
  const isAppsActive = pathname.startsWith('/apps');

  // Use conditional nav items based on auth state
  const navItems = user && !loading ? authenticatedNavItems : publicNavItems;

  // Split items for authenticated users: before Apps, Apps, after Apps
  const isAuthenticated = user && !loading;
  let leftItems: typeof authenticatedNavItems = [];
  let rightItems: typeof authenticatedNavItems = [];

  if (isAuthenticated) {
    // Split at Likes (index 3), Apps goes between Likes and Profile
    leftItems = authenticatedNavItems.slice(0, 3); // Dashboard, Canvas, Gallery
    rightItems = authenticatedNavItems.slice(3); // Likes, Profile
  } else {
    leftItems = navItems.slice(0, Math.ceil(navItems.length / 2));
    rightItems = navItems.slice(Math.ceil(navItems.length / 2));
  }

  const handleAppSelect = (toolSlug: string) => {
    router.push(`/${toolSlug}`);
    setIsAppsSheetOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-[9999]">
      <div className="relative flex items-center justify-between h-14 px-2">
        {/* Left side nav items */}
        <div className="flex items-center justify-between flex-1 gap-1 pr-6">
          {leftItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname.startsWith('/dashboard')) ||
              (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center space-y-0.5 transition-colors flex-1',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <item.icon className="h-[17px] w-[17px]" />
                <span className="text-[10.5px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Center Render Button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 flex-shrink-0 p-[3px] border-[0.25px] border-primary rounded-lg bg-background">
          <Link
            href="/render"
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105",
              pathname === '/render' || pathname?.startsWith('/render') ? 'ring-2 ring-primary ring-offset-2' : ''
            )}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[9px] font-semibold mt-0.5">Render</span>
          </Link>
        </div>

        {/* Right side nav items */}
        <div className="flex items-center justify-between flex-1 gap-1 pl-6">
          {isAuthenticated ? (
            <>
              {/* Likes */}
              {rightItems.slice(0, 1).map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                  (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center space-y-0.5 transition-colors flex-1',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    <item.icon className="h-[17px] w-[17px]" />
                    <span className="text-[10.5px] font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Apps Dropdown */}
              <Drawer open={isAppsSheetOpen} onOpenChange={setIsAppsSheetOpen}>
                <DrawerTrigger asChild>
                  <button
                    className={cn(
                      'flex flex-col items-center justify-center space-y-0.5 transition-colors flex-1',
                      isAppsActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    <Wrench className="h-[17px] w-[17px]" />
                    <span className="text-[10.5px] font-medium">Apps</span>
                  </button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh] rounded-t-xl">
                  <DrawerHeader>
                    <DrawerTitle>Select an App</DrawerTitle>
                  </DrawerHeader>
                  <div className="mt-6 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-1">
                      {allTools.map((tool) => {
                        const iconPath = getToolIconPath(tool.slug);
                        const isOnline = ('status' in tool ? tool.status : 'offline') === 'online';
                        
                        return (
                          <Button
                            key={tool.id}
                            variant="ghost"
                            className={cn(
                              "h-auto w-full justify-start gap-3 px-3 py-2 text-left",
                              !isOnline && "opacity-60 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isOnline) {
                                handleAppSelect(tool.slug);
                              }
                            }}
                            disabled={!isOnline}
                          >
                            <div className="w-4 h-4 shrink-0 rounded overflow-hidden">
                              <img 
                                src={iconPath} 
                                alt={tool.name}
                                className="w-full h-full object-contain rounded"
                                onError={(e) => {
                                  // Fallback to a default icon if custom icon doesn't exist
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{tool.name}</span>
                                {!isOnline && (
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {tool.description}
                              </p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              {/* Profile */}
              {rightItems.slice(1).map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                  (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center space-y-0.5 transition-colors flex-1',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    <item.icon className="h-[17px] w-[17px]" />
                    <span className="text-[10.5px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            rightItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
                (item.href === '/dashboard' && pathname.startsWith('/dashboard'));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center space-y-0.5 transition-colors flex-1',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <item.icon className="h-[17px] w-[17px]" />
                  <span className="text-[10.5px] font-medium">{item.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </nav>
  );
}
