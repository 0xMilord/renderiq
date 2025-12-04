'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Images, User, Settings, CreditCard, Info, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

const publicNavItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/render', icon: Sparkles, label: 'Render' },
  { href: '/gallery', icon: Images, label: 'Gallery' },
  { href: '/pricing', icon: CreditCard, label: 'Pricing' },
  { href: '/about', icon: Info, label: 'About' },
];

const authenticatedNavItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/render', icon: Sparkles, label: 'Render' },
  { href: '/gallery', icon: Images, label: 'Gallery' },
  { href: '/dashboard/likes', icon: Heart, label: 'Likes' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Hide bottom nav on render routes, project/chain routes, dashboard routes, and demo route
  if (
    pathname.includes('/render') || 
    pathname.startsWith('/project/') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/demo')
  ) {
    return null;
  }

  // Use conditional nav items based on auth state
  const navItems = user && !loading ? authenticatedNavItems : publicNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
      <div className={cn("grid h-16", navItems.length === 5 ? "grid-cols-5" : navItems.length === 6 ? "grid-cols-6" : "grid-cols-4")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
