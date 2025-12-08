'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useUserBillingStats } from '@/lib/hooks/use-subscription';
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
  Zap,
  Workflow,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  // ✅ BATCHED: Single hook replaces 3 separate hooks to prevent N+1 queries
  const { data: billingStats, loading: billingLoading } = useUserBillingStats(profile?.id);
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract data from batched stats
  const creditsData = billingStats?.credits;
  const subscription = billingStats?.subscription;
  const isPro = billingStats?.isPro || false;
  const creditsLoading = billingLoading;
  const proLoading = billingLoading;
  const subscriptionLoading = billingLoading;

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
          <Button size="sm">
            Get Started
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

  // Get subscription status - check both subscription hook and creditsData
  const subscriptionStatus = subscription?.subscription?.status || creditsData?.subscription?.status;
  const isActiveSubscription = subscriptionStatus === 'active';
  const isPendingSubscription = subscriptionStatus === 'pending';
  const isFailedSubscription = subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid' || subscriptionStatus === 'canceled';
  
  // Only show plan name for active subscriptions (not pending/failed/canceled)
  // Also check isPro to ensure user is actually pro
  const planName = (isActiveSubscription && isPro) ? creditsData?.plan?.name : null;
  const hasPlan = !!planName && isActiveSubscription && isPro;
  
  // Show status badge if subscription is pending or failed
  const showStatusBadge = isPendingSubscription || isFailedSubscription;
  const statusBadgeText = isPendingSubscription ? 'Pending' : isFailedSubscription ? 'Failed' : null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Credits Display - Only on mobile (desktop shows in navbar) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
          {/* Credits */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-8 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50">
            <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              {creditsLoading ? '...' : creditsData?.balance ?? 0}
            </span>
          </div>

          {/* Top Up Button - Hidden on very small screens */}
          <Link href="/pricing" className="hidden sm:block">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-full">
              <Zap className="h-3 w-3 mr-1" />
              Top Up
            </Button>
          </Link>

          {/* Plan Name, Status Badge, or Get Pro Button */}
          {hasPlan ? (
            <Badge variant="secondary" className="h-7 px-2 sm:px-2.5 text-xs rounded-full">
              {planName}
            </Badge>
          ) : showStatusBadge ? (
            <Badge variant="outline" className="h-7 px-2 sm:px-2.5 text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-full">
              {statusBadgeText}
            </Badge>
          ) : (
            <Link href="/pricing">
              <Button variant="default" size="sm" className="h-7 px-1.5 sm:px-2 text-[10px] leading-tight rounded-full">
                <Crown className="h-2.5 w-2.5 mr-0.5 sm:mr-1 shrink-0" />
                <span className="flex flex-col leading-none">
                  <span>Get</span>
                  <span>Pro</span>
                </span>
              </Button>
            </Link>
          )}
        </div>
        
        {/* Desktop: Top Up, Plan Name, Status Badge, or Get Pro Button */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Top Up Button */}
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs rounded-full">
              <Zap className="h-3 w-3 mr-1" />
              Top Up
            </Button>
          </Link>

          {/* Plan Name, Status Badge, or Get Pro Button */}
          {hasPlan ? (
            <Badge variant="secondary" className="h-8 px-2.5 text-xs rounded-full">
              {planName}
            </Badge>
          ) : showStatusBadge ? (
            <Badge variant="outline" className="h-8 px-2.5 text-xs border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-full">
              {statusBadgeText}
            </Badge>
          ) : (
            <Link href="/pricing">
              <Button variant="default" size="sm" className="h-8 px-2 text-[10px] leading-tight rounded-full">
                <Crown className="h-2.5 w-2.5 mr-1 shrink-0" />
                <span className="flex flex-col leading-none">
                  <span>Get</span>
                  <span>Pro</span>
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Avatar Dropdown */}
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
              {isPro && isActiveSubscription && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {showStatusBadge && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-background">
                  <Info className="w-2.5 h-2.5 text-white" />
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
                {isPro && isActiveSubscription && (
                  <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
                {showStatusBadge && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                    {statusBadgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {profile?.email || user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Credits Info (if has subscription) */}
          {creditsData?.nextResetDate && (
            <>
              <div className="px-2 py-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Credits reset:</span>
                  <span>{formatResetDate(creditsData.nextResetDate)}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
        
        {/* Quick Access to Render - Primary */}
        <DropdownMenuItem asChild>
          <Link href="/render" className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90">
            <Palette className="mr-2 h-4 w-4" />
            <span>Render</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Canvas Access */}
        <DropdownMenuItem asChild>
          <Link href="/canvas" className="flex items-center">
            <Workflow className="mr-2 h-4 w-4" />
            <span>Canvas</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Create Project */}
        <CreateProjectModal onProjectCreated={() => setIsOpen(false)}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Project</span>
          </DropdownMenuItem>
        </CreateProjectModal>
        
        {/* Dashboard Link */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
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
      </div>
    </TooltipProvider>
  );
}
