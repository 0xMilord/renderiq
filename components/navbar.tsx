'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDropdown } from '@/components/user-dropdown';
import { Menu, X, Home, Upload, GalleryVertical, BookOpen, Lightbulb, CreditCard } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { loading } = useAuth();

  return (
    <nav className="bg-background shadow-sm border-b w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-foreground">AecoSec</span>
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
            <div className="relative group">
              <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
                <Upload className="h-4 w-4" />
                <span>AI Engines</span>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-popover rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link href="/engine/exterior-ai" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">
                    Exterior AI
                  </Link>
                  <div className="block px-4 py-2 text-sm text-muted-foreground cursor-not-allowed flex items-center justify-between">
                    <span>Interior AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="block px-4 py-2 text-sm text-muted-foreground cursor-not-allowed flex items-center justify-between">
                    <span>Furniture AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="block px-4 py-2 text-sm text-muted-foreground cursor-not-allowed flex items-center justify-between">
                    <span>Site Plan AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            ) : (
              <UserDropdown />
            )}
          </div>

          {/* Mobile menu button and user dropdown */}
          <div className="md:hidden flex items-center space-x-2">
            {/* User Dropdown for mobile */}
            {loading ? (
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
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
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">AI Engines</div>
                <div className="space-y-1">
                  <Link
                    href="/engine/exterior-ai"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Exterior AI</span>
                  </Link>
                  <div className="flex items-center justify-between text-muted-foreground block px-3 py-2 rounded-md text-sm cursor-not-allowed">
                    <span>Interior AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground block px-3 py-2 rounded-md text-sm cursor-not-allowed">
                    <span>Furniture AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground block px-3 py-2 rounded-md text-sm cursor-not-allowed">
                    <span>Site Plan AI</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </div>
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
  );
}
