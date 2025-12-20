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
  Command,
  Users,
  Paintbrush,
  Image,
  Key,
  BarChart3,
  Database,
  TrendingUp,
  Zap
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
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { DuplicateProjectModal } from '@/components/projects/duplicate-project-modal';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { ShareProjectModal } from '@/components/projects/share-project-modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tree, Folder, File, type TreeViewElement } from '@/components/ui/file-tree';
import { Edit, Copy, Trash2, Share2, Globe, Lock } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { toSentenceCase } from '@/lib/utils/string';
import type { Project, RenderChain } from '@/lib/db/schema';
import { TasksStatsButtons } from '@/components/tasks/tasks-stats-buttons';
import { AmbassadorHeaderContent } from '@/components/ambassador/ambassador-header-content';
import { ProfileQuickActions } from '@/components/profile/profile-quick-actions';
import { CreateApiKeyButton } from '@/components/api-keys/create-api-key-button';
import { Suspense } from 'react';
import { AnalyticsTabsHeader } from '@/components/analytics/analytics-tabs-header';
import { SettingsTabsHeader } from '@/components/settings/settings-tabs-header';
import { ApiKeysHeaderStats } from '@/components/api-keys/api-keys-header-stats';
import { ProjectHeaderTabs } from '@/components/projects/project-header-tabs';
import { ProfileHeaderStats } from '@/components/profile/profile-header-stats';

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
  '/dashboard/ambassador': 'Ambassador Program',
  '/dashboard/profile': 'User Profile',
  '/dashboard/settings': 'Account Settings',
  '/dashboard/api-keys': 'API Keys',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/tasks': 'Earn Credits',
};

// Page descriptions mapping (for main content header)
const pageDescriptions: Record<string, string> = {
  '/dashboard': "",
  '/dashboard/projects': 'Organize and manage your projects and render chains',
  '/dashboard/library': 'View all your renders organized by project',
  '/dashboard/billing': 'Manage your subscription, credits, and payment history',
  '/dashboard/billing/history': 'View all your payment transactions and invoices',
  '/dashboard/billing/history/credits': 'Track all your credit transactions and usage',
  '/dashboard/likes': "Here's what you've liked",
  '/dashboard/ambassador': '',
  '/dashboard/profile': '',
  '/dashboard/settings': 'Your command center for account preferences',
  '/dashboard/api-keys': '',
  '/dashboard/analytics': 'View your usage statistics and analytics',
  '/dashboard/tasks': 'Complete tasks to earn credits. All tasks happen inside Renderiq.',
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
  '/dashboard/ambassador': Users,
  '/dashboard/profile': User,
  '/dashboard/settings': Command,
  '/dashboard/api-keys': Key,
  '/dashboard/analytics': BarChart3,
  '/dashboard/tasks': Sparkles,
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
function getPageDescription(pathname: string, projects: Project[] = [], chains: ChainWithRenders[] = []): string {
  // Check for chain detail page: /dashboard/projects/[slug]/chain/[chainId]
  const chainMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)\/chain\/([^/]+)$/);
  if (chainMatch) {
    const [, slug, chainId] = chainMatch;
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      return chain.name;
    }
  }
  
  // Check for project detail page: /dashboard/projects/[slug]
  // Return empty string so header tabs can be shown instead
  const projectMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)$/);
  if (projectMatch) {
    return '';
  }
  
  // ✅ FIXED: For projects page, include dynamic counts in description
  if (pathname === '/dashboard/projects') {
    const projectCount = projects.length;
    const chainCount = chains.length;
    return `Organize and manage your ${projectCount} project${projectCount !== 1 ? 's' : ''} and ${chainCount} render chain${chainCount !== 1 ? 's' : ''}`;
  }
  
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

// Helper function to get current project from pathname
function getCurrentProject(pathname: string, projects: Project[] = []): Project | null {
  const projectMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)$/);
  if (projectMatch) {
    const [, slug] = projectMatch;
    return projects.find(p => p.slug === slug) || null;
  }
  return null;
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
  { href: '/dashboard/tasks', icon: Sparkles, label: 'Earn Credits' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  { href: '/dashboard/likes', icon: Heart, label: 'Likes' },
  { href: '/dashboard/ambassador', icon: Users, label: 'Ambassador' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
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
  const { user, userProfile, loading: authLoading, initialized, signOut } = useAuthStore();

  // Get current page title (for sidebar), description, and icon (for main content)
  const currentPageTitle = getPageTitle(pathname);
  const currentPageDescription = getPageDescription(pathname, projects, chains);
  const CurrentPageIcon = getPageIcon(pathname);
  
  // Get current project if on project detail page
  const currentProject = useMemo(() => getCurrentProject(pathname, projects), [pathname, projects]);
  
  // Project action modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const { updateProject, removeProject, duplicateProject } = useProjects();

  // Get user display info - memoized to avoid recalculating on every render
  const { userName, userEmail, userAvatar, userInitials } = useMemo(() => {
    const name = userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const email = user?.email || '';
    const avatar = userProfile?.avatar || user?.user_metadata?.avatar_url || '';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    return { userName: name, userEmail: email, userAvatar: avatar, userInitials: initials };
  }, [userProfile, user]);

  // ✅ REMOVED: Duplicate initialize() call
  // AuthProvider already calls initialize(), no need to call it here
  // Components should only read from store, not initialize it

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

  // ✅ OPTIMIZED: Fetch projects and chains using server actions
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // ✅ OPTIMIZED: Use server actions instead of API routes
      const { getUserProjects, getUserChainsWithRenders } = await import('@/lib/actions/projects.actions');
      const [projectsResult, chainsResult] = await Promise.all([
        getUserProjects(),
        getUserChainsWithRenders()
      ]);

      if (projectsResult.success && projectsResult.data) {
        setProjects(projectsResult.data);
      }

      if (chainsResult.success && chainsResult.data) {
        setChains(chainsResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects/chains:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ FIXED: Remove fetchData from dependency array to prevent infinite loop
  // fetchData is stable (memoized with useCallback), so we only need user?.id
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  // Get selected project and chain from pathname
  const selectedProjectId = useMemo(() => {
    const projectMatch = pathname.match(/\/project\/([^/]+)/);
    if (projectMatch && currentProject) {
      return currentProject.id;
    }
    return undefined;
  }, [pathname, currentProject]);

  const selectedChainId = useMemo(() => {
    const chainMatch = pathname.match(/\/chain\/([^/]+)/);
    return chainMatch ? chainMatch[1] : undefined;
  }, [pathname]);

  // Build tree structure for file-tree component
  const treeElements: TreeViewElement[] = useMemo(() => {
    return projects.map(project => {
      const projectChains = chainsByProject[project.id] || [];
      return {
        id: project.id,
        name: project.name,
        isSelectable: true,
        children: projectChains.map(chain => ({
          id: chain.id,
          name: chain.name,
          isSelectable: true,
        })),
      };
    });
  }, [projects, chainsByProject]);

  // Get initial expanded items (selected project)
  const initialExpandedItems = useMemo(() => {
    if (selectedProjectId) {
      return [selectedProjectId];
    }
    return [];
  }, [selectedProjectId]);

  // Get initial selected item (selected chain or project)
  const initialSelectedId = useMemo(() => {
    return selectedChainId || selectedProjectId || undefined;
  }, [selectedChainId, selectedProjectId]);

  // Handle project click - memoized with useCallback
  const handleProjectClick = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      router.push(`/dashboard/projects/${project.slug}`);
    }
  }, [projects, router]);

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
            ? "w-[55%] sm:w-[275px]" 
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
                        <div className="ml-1 space-y-1 mt-1">
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
                        <div className="ml-1 space-y-1 mt-1">
                          {loading ? (
                            <div className="text-xs text-muted-foreground px-2 py-1">Loading...</div>
                          ) : projects.length === 0 ? (
                            <div className="text-xs text-muted-foreground px-2 py-1">
                              <CreateProjectModal onProjectCreated={() => fetchData()}>
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Create Project
                                </Button>
                              </CreateProjectModal>
                            </div>
                          ) : (
                            <div className="w-full">
                              <Tree
                                initialSelectedId={initialSelectedId}
                                initialExpandedItems={initialExpandedItems}
                                elements={treeElements}
                                indicator={true}
                                className="w-full"
                              >
                                {treeElements.map((projectElement) => {
                                  const isProjectSelected = selectedProjectId === projectElement.id;
                                  return (
                                    <Folder
                                      key={projectElement.id}
                                      element={projectElement.name}
                                      value={projectElement.id}
                                      isSelect={isProjectSelected}
                                      className={cn(
                                        "px-2 py-1.5",
                                        isProjectSelected && "bg-primary/20"
                                      )}
                                      onFolderSelect={handleProjectClick}
                                    >
                                      {projectElement.children?.map((chainElement) => {
                                        const isChainSelected = selectedChainId === chainElement.id;
                                        return (
                                          <File
                                            key={chainElement.id}
                                            value={chainElement.id}
                                            isSelect={isChainSelected}
                                            fileIcon={<MessageSquare className="size-4" />}
                                            className={cn(
                                              "px-2 py-1.5 w-full text-left",
                                              isChainSelected && "bg-primary/20"
                                            )}
                                            handleSelect={(id) => handleSelectChain(id)}
                                          >
                                            {chainElement.name}
                                          </File>
                                        );
                                      })}
                                    </Folder>
                                  );
                                })}
                              </Tree>
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
        <div className="px-4 border-b shrink-0 flex items-center justify-between pointer-events-auto">
          {pathname === '/dashboard' ? (
            /* Quick Actions for Dashboard */
            <div className="flex-1 py-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button asChild size="default" variant="default" className="flex-1 min-w-0 sm:flex-initial">
                  <Link href="/render" className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Render</span>
                  </Link>
                </Button>
                <Button asChild size="default" variant="outline" className="relative flex-1 min-w-0 sm:flex-initial">
                  <Link href="/canvas" className="flex items-center justify-center gap-2">
                    <Paintbrush className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Canvas</span>
                  </Link>
                </Button>
                <Button asChild size="default" variant="outline" className="flex-1 min-w-0 sm:flex-initial">
                  <Link href="/dashboard/projects" className="flex items-center justify-center gap-2">
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Projects</span>
                  </Link>
                </Button>
                <Button asChild size="default" variant="outline" className="flex-1 min-w-0 sm:flex-initial">
                  <Link href="/dashboard/billing" className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Billing</span>
                  </Link>
                </Button>
                <Button asChild size="default" variant="outline" className="flex-1 min-w-0 sm:flex-initial">
                  <Link href="/gallery" className="flex items-center justify-center gap-2">
                    <Image className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Gallery</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1 overflow-hidden flex items-center justify-between gap-3 h-16">
              {/* Analytics: Tabs on the left, full width, no icon/description */}
              {pathname === '/dashboard/analytics' ? (
                <AnalyticsTabsHeader />
              ) : pathname.match(/^\/dashboard\/projects\/[^/]+$/) ? (
                /* Project Detail: Tabs on the left, New Chain button shown conditionally */
                <ProjectHeaderTabs />
              ) : pathname === '/dashboard/settings' ? (
                /* Settings: Tabs on the left, full width, no icon/description */
                <SettingsTabsHeader />
              ) : pathname === '/dashboard/api-keys' ? (
                /* API Keys: Stats on the left, create button on the right */
                <>
                  <Suspense fallback={<div className="flex-1 h-16 bg-muted animate-pulse rounded shrink-0" />}>
                    <ApiKeysHeaderStats />
                  </Suspense>
                  <Suspense fallback={<div className="h-9 w-32 bg-muted animate-pulse rounded shrink-0" />}>
                    <CreateApiKeyButton />
                  </Suspense>
                </>
              ) : pathname === '/dashboard/profile' ? (
                /* Profile: Quick actions on the left, stats on the right */
                <>
                  <ProfileQuickActions />
                  <Suspense fallback={<div className="h-14 w-96 bg-muted animate-pulse rounded shrink-0" />}>
                    <ProfileHeaderStats />
                  </Suspense>
                </>
              ) : pathname === '/dashboard/ambassador' ? (
                /* Ambassador: Referral code and tier on the left, create link button on the right */
                <Suspense fallback={<div className="flex-1 h-10 bg-muted animate-pulse rounded shrink-0" />}>
                  <AmbassadorHeaderContent />
                </Suspense>
              ) : (
                <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-3">
                  <CurrentPageIcon className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground truncate min-w-0">{currentPageDescription}</h2>
                </div>
              )}
            </div>
          )}
          {/* Tasks Page Stats Buttons */}
          {pathname === '/dashboard/tasks' && (
            <TasksStatsButtons />
          )}
          {/* Projects Page Actions */}
          {pathname === '/dashboard/projects' && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <CreateProjectModal onProjectCreated={() => fetchData()}>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Project</span>
                </Button>
              </CreateProjectModal>
            </div>
          )}
          
          {/* Project Detail Page Actions */}
          {currentProject && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDuplicateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Duplicate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (currentProject) {
                    await updateProject(currentProject.id, { isPublic: !currentProject.isPublic });
                    fetchData();
                  }
                }}
                className="flex items-center gap-2"
              >
                {currentProject.isPublic ? (
                  <>
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Private</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>

        {/* Page Content - ✅ FIXED: Full width and height */}
        <div className="flex-1 overflow-y-auto w-full min-h-0">
          {children}
        </div>
      </div>
      
      {/* Project Action Modals */}
      {currentProject && (
        <>
          <EditProjectModal
            project={currentProject}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onProjectUpdated={(updatedProject) => {
              fetchData();
              setEditModalOpen(false);
            }}
          />
          <DuplicateProjectModal
            project={currentProject}
            open={duplicateModalOpen}
            onOpenChange={setDuplicateModalOpen}
            onProjectDuplicated={() => {
              fetchData();
              setDuplicateModalOpen(false);
            }}
          />
          <DeleteProjectDialog
            project={currentProject}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={async (projectId: string) => {
              await removeProject(projectId);
              fetchData();
              router.push('/dashboard/projects');
            }}
          />
          <ShareProjectModal
            project={currentProject}
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            onProjectUpdated={(updatedProject) => {
              fetchData();
            }}
          />
        </>
      )}
    </div>
  );
}

