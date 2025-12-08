'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PanelLeftClose, 
  PanelLeftOpen,
  LayoutDashboard,
  FolderOpen,
  FolderOpen as FolderOpenIcon,
  Folder,
  CreditCard,
  Heart,
  Settings,
  User,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  BookOpen,
  HelpCircle,
  FileText,
  RefreshCw,
  Sparkles,
  Command
} from 'lucide-react';
import { 
  FaXTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaReddit
} from 'react-icons/fa6';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProjectTree } from '@/components/dashboard/project-tree';
import type { Project, RenderChain } from '@/lib/db/schema';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface ChainWithRenders extends RenderChain {
  renders: any[];
}

// Page titles mapping (for sidebar)
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/projects': 'Projects & Chains',
  '/dashboard/library': 'Library',
  '/dashboard/billing': 'Billing & Subscription',
  '/dashboard/billing/history': 'Payment History & Invoices',
  '/dashboard/billing/history/credits': 'Credit Transactions',
  '/dashboard/likes': 'Liked Renders',
  '/dashboard/profile': 'User Profile',
  '/dashboard/settings': 'Account Settings',
};

// Page descriptions mapping (for main content header)
const pageDescriptions: Record<string, string> = {
  '/dashboard': "Here's what's happening in your dashboard",
  '/dashboard/projects': 'Organize and manage your projects and render chains',
  '/dashboard/library': 'View all your renders organized by project',
  '/dashboard/billing': 'Manage your subscription, credits, and payment history',
  '/dashboard/billing/history': 'View all your payment transactions and invoices',
  '/dashboard/billing/history/credits': 'Track all your credit transactions and usage',
  '/dashboard/likes': "Here's what you've liked",
  '/dashboard/profile': 'View and manage your profile information',
  '/dashboard/settings': 'Your command center for account preferences',
};

// Page icons mapping (for main content header)
const pageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/projects': FolderOpen,
  '/dashboard/library': BookOpen,
  '/dashboard/billing': CreditCard,
  '/dashboard/billing/history': FileText,
  '/dashboard/billing/history/credits': RefreshCw,
  '/dashboard/likes': Heart,
  '/dashboard/profile': User,
  '/dashboard/settings': Command,
};

// Helper function to get page title from pathname (for sidebar)
function getPageTitle(pathname: string): string {
  // Check exact matches first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  
  // Check for nested routes
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== '/dashboard') {
      return title;
    }
  }
  
  // Default to Dashboard
  return 'Dashboard';
}

// Helper function to get page description from pathname (for main content)
function getPageDescription(pathname: string): string {
  // Check exact matches first
  if (pageDescriptions[pathname]) {
    return pageDescriptions[pathname];
  }
  
  // Check for nested routes
  for (const [path, description] of Object.entries(pageDescriptions)) {
    if (pathname.startsWith(path) && path !== '/dashboard') {
      return description;
    }
  }
  
  // Default description
  return "Here's what's happening";
}

// Helper function to get page icon from pathname (for main content)
function getPageIcon(pathname: string): React.ComponentType<{ className?: string }> {
  // Check exact matches first
  if (pageIcons[pathname]) {
    return pageIcons[pathname];
  }
  
  // Check for nested routes
  for (const [path, Icon] of Object.entries(pageIcons)) {
    if (pathname.startsWith(path) && path !== '/dashboard') {
      return Icon;
    }
  }
  
  // Default icon
  return LayoutDashboard;
}


// Navigation items
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/dashboard/library', icon: BookOpen, label: 'Library' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { href: '/dashboard/likes', icon: Heart, label: 'Likes' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedBilling, setExpandedBilling] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chains, setChains] = useState<ChainWithRenders[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, loading: authLoading, initialized, initialize, signOut } = useAuthStore();

  // Get current page title (for sidebar), description, and icon (for main content)
  const currentPageTitle = getPageTitle(pathname);
  const currentPageDescription = getPageDescription(pathname);
  const CurrentPageIcon = getPageIcon(pathname);

  // Get user display info - memoized to avoid recalculating on every render
  const { userName, userEmail, userAvatar, userInitials } = useMemo(() => {
    const name = userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';
    const avatar = userProfile?.avatar || user?.user_metadata?.avatar_url || '';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    return { userName: name, userEmail: email, userAvatar: avatar, userInitials: initials };
  }, [userProfile, user]);

  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);

  // Auto-expand billing if on history page
  useEffect(() => {
    if (pathname.startsWith('/dashboard/billing/history')) {
      setExpandedBilling(true);
    }
  }, [pathname]);

  // Auto-expand projects if on project page
  useEffect(() => {
    if (pathname.includes('/project/') || pathname === '/dashboard/projects') {
      setExpandedProjects(new Set(['projects']));
    }
  }, [pathname]);

  // Fetch projects and chains - memoized with useCallback
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [projectsRes, chainsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/projects/chains')
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);
      }

      if (chainsRes.ok) {
        const chainsData = await chainsRes.json();
        setChains(chainsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects/chains:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, fetchData]);

  // Group chains by project
  const chainsByProject = useMemo(() => 
    chains.reduce((acc, chain) => {
      if (!acc[chain.projectId]) {
        acc[chain.projectId] = [];
      }
      acc[chain.projectId].push(chain);
      return acc;
    }, {} as Record<string, ChainWithRenders[]>),
    [chains]
  );

  // Toggle project expansion - memoized with useCallback
  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return newExpanded;
    });
  }, []);

  // Handle chain selection - memoized with useCallback
  const handleSelectChain = useCallback((chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      const project = projects.find(p => p.id === chain.projectId);
      if (project) {
        router.push(`/project/${project.slug}/chain/${chainId}`);
      }
    }
  }, [chains, projects, router]);

  // Handle sign out - memoized with useCallback
  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/login');
  }, [signOut, router]);

  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex fixed inset-0 bg-background pt-[var(--navbar-height)]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 shrink-0 overflow-hidden",
          isSidebarOpen 
            ? "w-full max-w-[40vw] sm:w-60" 
            : "w-12"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "border-b shrink-0 flex items-center",
          isSidebarOpen ? "px-4 h-16" : "px-0 h-16 justify-center"
        )}>
          {isSidebarOpen ? (
            <div className="flex items-center justify-between w-full gap-4 min-h-0">
              <h2 className="text-lg font-semibold truncate flex-1 min-w-0">
                {currentPageTitle}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="h-8 w-8"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          isSidebarOpen ? "p-2" : "p-2 flex flex-col items-center gap-2"
        )}
        >
          {isSidebarOpen ? (
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const isProjects = item.href === '/dashboard/projects';
                const isBilling = item.href === '/dashboard/billing';
                
                if (isBilling) {
                  const isBillingHistoryActive = pathname.startsWith('/dashboard/billing/history');
                  
                  return (
                    <div key={item.href} className="w-full">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2 h-10 rounded-md text-sm font-medium transition-colors",
                        isActive && !isBillingHistoryActive && "bg-accent text-accent-foreground",
                        !isActive && !isBillingHistoryActive && "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{item.label}</span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            setExpandedBilling(!expandedBilling);
                          }}
                        >
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            expandedBilling && "rotate-90"
                          )} />
                        </Button>
                      </div>
                      {expandedBilling && (
                        <div className="ml-7 space-y-1 mt-1">
                          <Link
                            href="/dashboard/billing/history"
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors h-8",
                              pathname === '/dashboard/billing/history'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate flex-1">Payment History</span>
                          </Link>
                          <Link
                            href="/dashboard/billing/history/credits"
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors h-8",
                              pathname === '/dashboard/billing/history/credits'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <RefreshCw className="h-4 w-4 shrink-0" />
                            <span className="truncate flex-1">Credit Transactions</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (isProjects) {
                  const isProjectPageActive = pathname === '/dashboard/projects' || pathname.includes('/project/');
                  const isProjectsExpanded = expandedProjects.has('projects');
                  
                  return (
                    <div key={item.href} className="w-full">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2 h-10 rounded-md text-sm font-medium transition-colors",
                        isProjectPageActive && !isProjectsExpanded && "bg-accent text-accent-foreground",
                        !isProjectPageActive && !isProjectsExpanded && "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{item.label}</span>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            if (isProjectsExpanded) {
                              setExpandedProjects(new Set());
                            } else {
                              setExpandedProjects(new Set(['projects']));
                            }
                          }}
                        >
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isProjectsExpanded && "rotate-90"
                          )} />
                        </Button>
                      </div>
                      {isProjectsExpanded && (
                        <div className="ml-7 space-y-1 mt-1">
                          {loading ? (
                            <div className="text-xs text-muted-foreground px-2 py-1 ml-7">Loading...</div>
                          ) : projects.length === 0 ? (
                            <div className="text-xs text-muted-foreground px-2 py-1 ml-7">
                              <CreateProjectModal onProjectCreated={() => fetchData()}>
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Create Project
                                </Button>
                              </CreateProjectModal>
                            </div>
                          ) : (
                            <div className="w-full ml-7">
                              <ProjectTree 
                                projects={projects} 
                                chains={chains.map(chain => ({
                                  ...chain,
                                  projectId: chain.projectId,
                                }))}
                              />
                            </div>
                          )}
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
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full overflow-x-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const isProjects = item.href === '/dashboard/projects';
                const isBilling = item.href === '/dashboard/billing';
                
                return (
                  <div key={item.href} className="w-full flex flex-col items-center gap-1 min-w-0">
                    <Link
                      href={item.href}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors shrink-0",
                        isActive && !isProjects && !isBilling
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      title={item.label}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                    
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer Section */}
        <div className={cn(
          "border-t shrink-0 flex flex-col",
          isSidebarOpen ? "p-3" : "p-2"
        )}>
          {isSidebarOpen ? (
            <>
              {/* Docs and Support Buttons */}
              <div className="flex gap-2 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  asChild
                >
                  <Link href="/docs" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-3 w-3 mr-1.5" />
                    Docs
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  asChild
                >
                  <Link href="/support" target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3 mr-1.5" />
                    Support
                  </Link>
                </Button>
              </div>

              {/* Separator */}
              <div className="h-px bg-border mb-1" />

              {/* Community Socials */}
              <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                <a
                  href="https://x.com/renderiq_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="X (Twitter)"
                >
                  <FaXTwitter className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/renderiq-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="LinkedIn"
                >
                  <FaLinkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com/@Renderiq_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="YouTube"
                >
                  <FaYoutube className="h-4 w-4" />
                </a>
                <a
                  href="https://www.reddit.com/user/Renderiq-AI/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Reddit"
                >
                  <FaReddit className="h-4 w-4" />
                </a>
              </div>

              {/* Separator */}
              <div className="h-px bg-border mb-1" />

              {/* User Info and Sign Out */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <div className="h-8 w-px bg-border shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Docs and Support - Collapsed */}
              <div className="flex flex-col gap-1 w-full py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <Link href="/docs" target="_blank" rel="noopener noreferrer" title="Docs">
                    <BookOpen className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <Link href="/support" target="_blank" rel="noopener noreferrer" title="Support">
                    <HelpCircle className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Separator */}
              <div className="w-full h-px bg-border my-1" />

              {/* User Avatar and Sign Out - Collapsed */}
              <div className="flex flex-col items-center gap-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSignOut}
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 border-b shrink-0 h-16 flex items-center pointer-events-auto">
          <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-3">
            <CurrentPageIcon className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-semibold text-foreground truncate min-w-0">{currentPageDescription}</h2>
          </div>
        </div>

        {/* Page Content - ✅ FIXED: Full width and height */}
        <div className="flex-1 overflow-y-auto w-full min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

