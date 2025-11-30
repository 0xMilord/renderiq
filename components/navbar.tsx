'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDropdown } from '@/components/user-dropdown';
import { AlphaBanner } from '@/components/alpha-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, X, Home, MessageSquare, GalleryVertical, BookOpen, Lightbulb, CreditCard } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { loading } = useAuth();

  return (
    <>
      <AlphaBanner />
      <nav className="bg-background shadow-sm border-b w-full relative z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-11">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="renderiq"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-lg font-bold text-foreground">renderiq</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Chat</span>
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
              href="/plans"
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span>Plans</span>
            </Link>

            {/* User Dropdown */}
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
                href="/chat"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>AI Chat</span>
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
                <span>Plans</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      </nav>
    </>
  );
}
