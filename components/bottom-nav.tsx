'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Sparkles, Images, User, Settings, CreditCard, Info, Heart, FileText, HelpCircle, Layout, LayoutDashboard, Wrench, Layers, Square, Maximize2, Sofa, Box, Grid3x3, Split, RotateCw, Palette, Brush, Sun, Package, Replace, Image as ImageIcon, FileStack, LayoutGrid, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { getOnlineTools } from '@/lib/tools/registry';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Icon mapping for tools (same as navbar)
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

  // Hide bottom nav on render routes, project/chain routes, and demo route
  // Note: Dashboard routes now show bottom nav for authenticated users
  if (
    pathname.includes('/render') || 
    pathname.startsWith('/project/') ||
    pathname?.startsWith('/demo')
  ) {
    return null;
  }

  // Get online tools for Apps dropdown
  const onlineTools = getOnlineTools();
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
    router.push(`/apps/${toolSlug}`);
    setIsAppsSheetOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
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
              <Sheet open={isAppsSheetOpen} onOpenChange={setIsAppsSheetOpen}>
                <SheetTrigger asChild>
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
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                  <SheetHeader>
                    <SheetTitle>Select an App</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      {onlineTools.map((tool) => {
                        const ToolIcon = getToolIcon(tool.id);
                        return (
                          <Button
                            key={tool.id}
                            variant="outline"
                            className="h-auto flex-col items-start justify-start p-4 text-left"
                            onClick={() => handleAppSelect(tool.slug)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <ToolIcon className="h-4 w-4 shrink-0" />
                              <span className="font-semibold text-sm">{tool.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {tool.description}
                            </p>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
