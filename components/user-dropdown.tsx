'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useCreditsWithReset, useIsPro } from '@/lib/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  LogOut, 
  FolderOpen, 
  Palette,
  LayoutDashboard,
  Image as ImageIcon,
  CreditCard,
  Coins,
  Info,
  Crown,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { data: creditsData, loading: creditsLoading } = useCreditsWithReset(profile?.id);
  const { data: isPro, loading: proLoading } = useIsPro(profile?.id);
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Format reset date
  const formatResetDate = (date: Date | null | undefined) => {
    if (!date) return 'No active subscription';
    const resetDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Resets today';
    if (diffDays === 1) return 'Resets tomorrow';
    if (diffDays <= 7) return `Resets in ${diffDays} days`;
    
    return `Resets on ${resetDate.toLocaleDateString()}`;
  };


  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  // Show loading state while profile is being fetched
  if (profileLoading) {
    return (
      <Skeleton className="h-8 w-8 rounded-full" />
    );
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={profile?.avatar || user.user_metadata?.avatar_url || user.user_metadata?.picture} 
                alt={profile?.name || user.email || 'User'} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {(profile?.name || user.email)?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isPro && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">
                  {profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || 'User'}
                </p>
                {isPro && (
                  <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {profile?.email || user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Credits Display */}
          <div className="px-2 py-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Coins className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Available Credits</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">
                          {creditsData?.nextResetDate 
                            ? `Credits reset monthly with your subscription. ${formatResetDate(creditsData.nextResetDate)}`
                            : 'Subscribe to a plan to get monthly credits'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-lg font-bold">
                    {creditsLoading ? '...' : creditsData?.balance ?? 0}
                  </p>
                </div>
              </div>
              {!isPro && (
                <Link href="/plans" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="h-7 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
            {creditsData?.nextResetDate && (
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                {formatResetDate(creditsData.nextResetDate)}
              </p>
            )}
          </div>
          <DropdownMenuSeparator />
        
        {/* Dashboard Link */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Quick Access to Render */}
        <DropdownMenuItem asChild>
          <Link href="/render" className="flex items-center">
            <Palette className="mr-2 h-4 w-4" />
            <span>Render</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* User Menu Items */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/projects" className="flex items-center">
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>My Projects</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/gallery" className="flex items-center">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Gallery</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/billing" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle */}
        <div className="px-2 py-1.5">
          <ThemeToggle />
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Sign Out */}
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  );
}
