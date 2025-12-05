'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  FaGithub, 
  FaXTwitter, 
  FaLinkedin, 
  FaInstagram, 
  FaYoutube, 
  FaReddit, 
  FaThreads,
  FaQuora,
  FaDiscord
} from 'react-icons/fa6';
import { SiBluesky } from 'react-icons/si';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  const { user, userProfile, initialize, signOut } = useAuthStore();

  // Get current page title (for sidebar), description, and icon (for main content)
  const currentPageTitle = getPageTitle(pathname);
  const currentPageDescription = getPageDescription(pathname);
  const CurrentPageIcon = getPageIcon(pathname);

  // Get user display info
  const userName = userProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = userProfile?.avatar || user?.user_metadata?.avatar_url || '';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

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

  // Fetch projects and chains
  const fetchData = async () => {
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
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
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

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Handle chain selection
  const handleSelectChain = (chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      const project = projects.find(p => p.id === chain.projectId);
      if (project) {
        router.push(`/project/${project.slug}/chain/${chainId}`);
      }
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

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
    <div className="flex h-[calc(100vh-1rem-2.75rem)] bg-background">
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
                            <Accordion 
                              type="multiple" 
                              className="w-full ml-7"
                              value={Array.from(expandedProjects).filter(id => id !== 'projects')}
                              onValueChange={(value) => {
                                const projectIds = value.filter(id => id !== 'projects');
                                setExpandedProjects(new Set(['projects', ...projectIds]));
                              }}
                            >
                              {projects.map((project) => {
                                const projectChains = chainsByProject[project.id] || [];
                                const isProjectActive = pathname.includes(`/dashboard/projects/${project.slug}`);
                                
                                return (
                                  <AccordionItem 
                                    key={project.id} 
                                    value={project.id}
                                    className="border-0"
                                  >
                                    <AccordionTrigger 
                                      className={cn(
                                        "px-2 py-2 h-8 rounded-md hover:bg-accent hover:no-underline [&>svg:last-child]:hidden",
                                        isProjectActive && "bg-accent text-accent-foreground",
                                        "text-xs font-medium"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0 relative pl-3">
                                        {/* Tree line connector - vertical line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                                        {/* Tree line connector - horizontal line */}
                                        <div className="absolute left-0 top-1/2 w-3 h-px bg-border" />
                                        <ChevronRight className={cn(
                                          "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 relative z-10",
                                          expandedProjects.has(project.id) && "rotate-90"
                                        )} />
                                        <Folder className={cn(
                                          "h-3.5 w-3.5 flex-shrink-0 relative z-10",
                                          isProjectActive
                                            ? "text-foreground"
                                            : "text-primary"
                                        )} />
                                        <span className="truncate">{project.name}</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-0">
                                      {projectChains.length > 0 ? (
                                        <div className="ml-4 space-y-0 relative pl-3">
                                          {/* Vertical tree line for chains */}
                                          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
                                          {projectChains.map((chain, index) => {
                                            const chainPath = `/project/${project.slug}/chain/${chain.id}`;
                                            const isChainActive = pathname === chainPath || pathname.includes(`/chain/${chain.id}`);
                                            const isLast = index === projectChains.length - 1;
                                            
                                            return (
                                              <div key={chain.id} className="relative">
                                                {/* Horizontal tree line connector */}
                                                <div className="absolute left-0 top-1/2 w-3 h-px bg-border" />
                                                {/* Vertical line continuation - only if not last */}
                                                {!isLast && (
                                                  <div className="absolute left-0 top-1/2 bottom-0 w-px bg-border" />
                                                )}
                                                <Link
                                                  href={chainPath}
                                                  className={cn(
                                                    "flex items-center gap-2 px-2 py-2 h-8 rounded-md hover:bg-accent transition-colors group relative z-10",
                                                    isChainActive && "bg-accent text-accent-foreground"
                                                  )}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectChain(chain.id);
                                                  }}
                                                >
                                                  <MessageSquare className={cn(
                                                    "h-3 w-3 flex-shrink-0",
                                                    isChainActive
                                                      ? "text-foreground"
                                                      : "text-muted-foreground group-hover:text-foreground"
                                                  )} />
                                                  <span className="text-xs truncate">{chain.name}</span>
                                                </Link>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="ml-4 px-2 py-2 h-8 text-xs text-muted-foreground flex items-center">
                                          No chains yet
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
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
              <div className="flex gap-2 mb-3">
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
              <div className="h-px bg-border mb-3" />

              {/* Community Socials */}
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                <a
                  href="https://bsky.app/profile/renderiq.bsky.social"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Bluesky"
                >
                  <SiBluesky className="h-4 w-4" />
                </a>
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
                  href="https://github.com/renderiq-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="GitHub"
                >
                  <FaGithub className="h-4 w-4" />
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
                  href="https://www.instagram.com/renderiq.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Instagram"
                >
                  <FaInstagram className="h-4 w-4" />
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
                <a
                  href="https://www.threads.com/@renderiq.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Threads"
                >
                  <FaThreads className="h-4 w-4" />
                </a>
                <a
                  href="https://www.quora.com/profile/Renderiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Quora"
                >
                  <FaQuora className="h-4 w-4" />
                </a>
                <a
                  href="https://discord.gg/KADV5pX3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black"
                  title="Discord"
                >
                  <FaDiscord className="h-4 w-4" />
                </a>
              </div>

              {/* Separator */}
              <div className="h-px bg-border mb-3" />

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
              <div className="flex flex-col gap-1 w-full">
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
              <div className="w-full h-px bg-border" />

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 border-b shrink-0 h-16 flex items-center pointer-events-auto">
          <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-3">
            <CurrentPageIcon className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-semibold text-foreground truncate min-w-0">{currentPageDescription}</h2>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

