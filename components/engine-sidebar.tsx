'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Home, 
  Palette, 
  Sofa, 
  Map, 
  Settings, 
  GalleryVertical,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/engine/interior-ai', icon: Palette, label: 'Interior AI', comingSoon: true },
  { href: '/engine/exterior-ai', icon: Building2, label: 'Exterior AI' },
  { href: '/engine/furniture-ai', icon: Sofa, label: 'Furniture AI', comingSoon: true },
  { href: '/engine/site-plan-ai', icon: Map, label: 'Site Plan AI', comingSoon: true },
  { href: '/gallery', icon: GalleryVertical, label: 'Gallery' },
  { href: '/profile/settings', icon: Settings, label: 'Settings' },
];

export function EngineSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-background border-r border-border transition-all duration-300',
        isExpanded ? 'w-64 z-40' : 'w-16 z-30',
        'hidden lg:block' // Hide on mobile
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border pt-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <h2 className="font-semibold text-foreground truncate">AI Engines</h2>
                <p className="text-xs text-muted-foreground">Architectural AI</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group cursor-not-allowed opacity-60'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && (
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
                {isExpanded && (
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {isExpanded && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <p>Powered by AI</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
