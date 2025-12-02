'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDropdown } from '@/components/user-dropdown';
import { NavbarSelectors } from '@/components/navbar-selectors';
import { AlphaBanner } from '@/components/alpha-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, X, Home, MessageSquare, GalleryVertical, BookOpen, Lightbulb, CreditCard, Info, FileText, Mail } from 'lucide-react';

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

          {/* Middle Section: Navigation Links (not authenticated) */}
          <div className="flex-1 flex items-center justify-center">
            {!user && !loading && (
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
                  <MessageSquare className="h-4 w-4" />
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
                  <GalleryVertical className="h-4 w-4" />
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
            )}
          </div>

          {/* Right Section: User Dropdown - Desktop only */}
          <div className="hidden md:flex items-center flex-shrink-0">
            {loading ? (
              <Skeleton className="w-8 h-8 rounded-full" />
            ) : (
              <UserDropdown />
            )}
          </div>

          {/* Mobile menu button and user dropdown */}
          <div className="md:hidden flex items-center space-x-2">
            {/* User Dropdown for mobile */}
            {loading ? (
              <Skeleton className="w-8 h-8 rounded-full" />
            ) : (
              <UserDropdown />
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-primary focus:outline-none focus:text-primary"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                href="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/render"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Render</span>
              </Link>
              <Link
                href="/use-cases"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Lightbulb className="h-4 w-4" />
                <span>Use Cases</span>
              </Link>
              <Link
                href="/gallery"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <GalleryVertical className="h-4 w-4" />
                <span>Gallery</span>
              </Link>
              <Link
                href="/plans"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link
                href="/about"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Info className="h-4 w-4" />
                <span>About</span>
              </Link>
              <Link
                href="/docs"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <Mail className="h-4 w-4" />
                <span>Contact</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      </nav>
    </>
  );
}
