import Link from 'next/link';
import Image from 'next/image';
import { Building2, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
// PWA install button removed

export function Footer() {
  return (
    <footer className="bg-background border-t w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.svg"
                alt="Arqihive"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-foreground">Arqihive</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Transform your architectural sketches into hyperrealistic AI renders and videos. 
              Professional-grade visualization tools for architects, designers, and developers.
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="GitHub">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Email">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Theme:</span>
                  <ThemeToggle />
                </div>
                {/* PWA install button removed */}
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/chat" className="text-muted-foreground hover:text-primary transition-colors">
                  AI Chat
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="text-muted-foreground hover:text-primary transition-colors">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-muted-foreground hover:text-primary transition-colors">
                  API Docs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Arqihive. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
