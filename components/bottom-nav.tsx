'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Images, User, Settings, CreditCard, Info, Heart, FileText, HelpCircle, Layout, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

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
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Hide bottom nav on render routes, project/chain routes, and demo route
  // Note: Dashboard routes now show bottom nav for authenticated users
  if (
    pathname.includes('/render') || 
    pathname.startsWith('/project/') ||
    pathname?.startsWith('/demo')
  ) {
    return null;
  }

  // Use conditional nav items based on auth state
  const navItems = user && !loading ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className="relative flex items-center justify-between h-14 px-2">
        {/* Left side nav items */}
        <div className="flex items-center justify-between flex-1 gap-1 pr-6">
          {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => {
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
          {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => {
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
        </div>
      </div>
    </nav>
  );
}
