'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDropdown } from '@/components/user-dropdown';
import { NavbarSelectors } from '@/components/navbar-selectors';
import { AlphaBanner } from '@/components/alpha-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, X, Home, Sparkles, Images, Lightbulb, CreditCard, Info, FileText, Mail, Newspaper, Play } from 'lucide-react';
import { 
  FaGithub, 
  FaXTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaInstagram, 
  FaDiscord 
} from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <>
      <AlphaBanner />
      <nav className="bg-background shadow-sm border-b w-full relative z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 gap-4">
          {/* Logo and Selectors */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="Renderiq"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-lg font-bold text-foreground">Renderiq</span>
            </Link>
            
            {/* Project and Chain Selectors - Only for authenticated users */}
            {user && !loading && <NavbarSelectors />}
          </div>

          {/* Middle Section: Navigation Links (only when not authenticated) */}
          {!user && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  href="/"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/render"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Render</span>
                </Link>
                <Link
                  href="/use-cases"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>Use Cases</span>
                </Link>
                <Link
                  href="/gallery"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Images className="h-4 w-4" />
                  <span>Gallery</span>
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pricing</span>
                </Link>
                <Link
                  href="/about"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Newspaper className="h-4 w-4" />
                  <span>Blog</span>
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Docs</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact</span>
                </Link>
              </div>
            </div>
          )}

          {/* Right Section: Start Creating Button, User Dropdown, and Hamburger Menu */}
          <div className="flex items-center flex-shrink-0 gap-2">
            {loading ? (
              <Skeleton className="w-8 h-8 rounded-full" />
            ) : (
              <>
                {/* Start Creating Button - Show when authenticated */}
                {user && (
                  <Link href="/render">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 hidden md:flex"
                    >
                      <Play className="h-4 w-4" />
                      Start creating
                    </Button>
                  </Link>
                )}
                
                {/* User Dropdown - Always show on desktop, and on mobile when authenticated */}
                <div className={cn(
                  "flex items-center",
                  user ? "" : "hidden md:flex" // Hide on mobile when not authenticated
                )}>
                  <UserDropdown />
                </div>
                
                {/* User Dropdown on mobile - Only when not authenticated (shows Sign In/Sign Up) */}
                {!user && (
                  <div className="md:hidden flex items-center">
                    <UserDropdown />
                  </div>
                )}
                
                {/* Hamburger Menu Button - Show on desktop when authenticated, always on mobile */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 text-muted-foreground hover:text-primary",
                        user ? "" : "md:hidden" // Hide on desktop when not authenticated
                      )}
                    >
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-[280px] sm:w-[300px] p-0"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="h-full flex flex-col">
                      <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                        {/* Start Creating Button - Show when authenticated */}
                        {user && (
                          <Link
                            href="/render"
                            className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 block px-3 py-2 rounded-md text-base font-medium transition-colors mb-4"
                            onClick={() => setIsOpen(false)}
                          >
                            <Play className="h-4 w-4" />
                            <span>Start creating</span>
                          </Link>
                        )}
                        <Link
                          href="/"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Home className="h-4 w-4" />
                          <span>Home</span>
                        </Link>
                        <Link
                          href="/render"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Render</span>
                        </Link>
                        <Link
                          href="/use-cases"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Lightbulb className="h-4 w-4" />
                          <span>Use Cases</span>
                        </Link>
                        <Link
                          href="/gallery"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Images className="h-4 w-4" />
                          <span>Gallery</span>
                        </Link>
                        <Link
                          href="/pricing"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Pricing</span>
                        </Link>
                        <Link
                          href="/about"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Info className="h-4 w-4" />
                          <span>About</span>
                        </Link>
                        <Link
                          href="/blog"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Newspaper className="h-4 w-4" />
                          <span>Blog</span>
                        </Link>
                        <Link
                          href="/docs"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Docs</span>
                        </Link>
                        <Link
                          href="/contact"
                          className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <Mail className="h-4 w-4" />
                          <span>Contact</span>
                        </Link>
                      </div>
                      
                      {/* Social Links */}
                      <div className="px-6 py-4 border-t shrink-0">
                        <h3 className="text-xs font-semibold text-foreground mb-2">Follow Us</h3>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="https://github.com/renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="GitHub"
                          >
                            <FaGithub className="h-4 w-4" />
                          </a>
                          <a
                            href="https://twitter.com/renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="Twitter"
                          >
                            <FaXTwitter className="h-4 w-4" />
                          </a>
                          <a
                            href="https://linkedin.com/company/renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="LinkedIn"
                          >
                            <FaLinkedin className="h-4 w-4" />
                          </a>
                          <a
                            href="https://youtube.com/@renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="YouTube"
                          >
                            <FaYoutube className="h-4 w-4" />
                          </a>
                          <a
                            href="https://instagram.com/renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="Instagram"
                          >
                            <FaInstagram className="h-4 w-4" />
                          </a>
                          <a
                            href="https://discord.gg/renderiq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                            onClick={() => setIsOpen(false)}
                            title="Discord"
                          >
                            <FaDiscord className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Legal Links */}
                      <div className="px-6 py-3 border-t shrink-0">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <Link
                            href="/terms"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Terms
                          </Link>
                          <Link
                            href="/privacy"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Privacy
                          </Link>
                          <Link
                            href="/refund"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Refund
                          </Link>
                          <Link
                            href="/cookies"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Cookies
                          </Link>
                          <Link
                            href="/dpa"
                            className="text-muted-foreground hover:text-primary text-[10px] transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            DPA
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
      </nav>
    </>
  );
}
