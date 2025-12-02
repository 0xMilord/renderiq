'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Menu, 
  X, 
  ChevronRight, 
  Search,
  Home,
  User,
  FolderOpen,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const docsNav = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Getting Started', href: '/docs/getting-started', icon: Home },
      { title: 'Making Your Account', href: '/docs/making-your-account', icon: User },
      { title: 'Around the App', href: '/docs/around-the-app', icon: BookOpen },
    ],
  },
  {
    title: 'Projects',
    items: [
      { title: 'Creating Your First Project', href: '/docs/creating-your-first-project', icon: FolderOpen },
      { title: 'Creating Your First Chain', href: '/docs/creating-your-first-chain', icon: FolderOpen },
    ],
  },
  {
    title: 'Features',
    items: [
      { title: 'Unified Chat Interface', href: '/docs/unified-chat-interface', icon: MessageSquare },
      { title: 'Prompt Engineering', href: '/docs/prompt-engineering', icon: Lightbulb },
    ],
  },
  {
    title: 'Support',
    items: [
      { title: 'Known Issues', href: '/docs/known-issues', icon: AlertCircle },
      { title: 'Changelog', href: '/docs/changelog', icon: FileText },
    ],
  },
];

interface DocsLayoutProps {
  children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const filteredNav = docsNav.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-2"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/docs" className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">Docs</span>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform lg:translate-x-0 lg:static lg:inset-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Desktop Header */}
            <div className="hidden border-b px-6 py-4 lg:block">
              <Link href="/docs" className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span className="text-lg font-semibold">Documentation</span>
              </Link>
            </div>

            {/* Search */}
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <nav className="p-4 space-y-6">
                {filteredNav.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Renderiq
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

