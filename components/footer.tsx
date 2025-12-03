import Link from 'next/link';
import Image from 'next/image';
import { 
  FaGithub, 
  FaXTwitter, 
  FaLinkedin, 
  FaMedium, 
  FaInstagram, 
  FaYoutube, 
  FaDiscord, 
  FaReddit, 
  FaThreads,
  FaMastodon
} from 'react-icons/fa6';
import { Sparkles, Images, Lightbulb, Newspaper, CreditCard, Info, FileText, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PWAInstallButton } from '@/components/pwa/install-button';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-background border-t w-full relative">
      {/* Floating Render Button - Centered with top offset */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
        <Button asChild size="lg" className="shadow-lg">
          <Link href="/render">
            <Sparkles className="h-5 w-5 mr-2" />
            Render
          </Link>
        </Button>
      </div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.svg"
                alt="Renderiq"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-foreground">Renderiq</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Transform your architectural sketches into hyperrealistic AI renders and videos. 
              Professional-grade visualization tools for architects, designers, and developers.
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="GitHub" target="_blank" rel="noopener noreferrer">
                  <FaGithub className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="X (Twitter)" target="_blank" rel="noopener noreferrer">
                  <FaXTwitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <FaLinkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Medium" target="_blank" rel="noopener noreferrer">
                  <FaMedium className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Bluesky" target="_blank" rel="noopener noreferrer">
                  <FaMastodon className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Instagram" target="_blank" rel="noopener noreferrer">
                  <FaInstagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="YouTube" target="_blank" rel="noopener noreferrer">
                  <FaYoutube className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Discord" target="_blank" rel="noopener noreferrer">
                  <FaDiscord className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Reddit" target="_blank" rel="noopener noreferrer">
                  <FaReddit className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" title="Threads" target="_blank" rel="noopener noreferrer">
                  <FaThreads className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                {/* PWA Install Button - Show on all devices */}
                <PWAInstallButton />
              </div>
            </div>
          </div>

          {/* Product and Company - Side by side on mobile, separate columns on desktop */}
          <div className="grid grid-cols-2 md:contents gap-8">
            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/render" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Render
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Images className="h-3.5 w-3.5" />
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Use Cases
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Newspaper className="h-3.5 w-3.5" />
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Docs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          {/* Legal Links */}
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/refund" className="text-muted-foreground hover:text-primary transition-colors">
                Refund Policy
              </Link>
              <Link href="/support" className="text-muted-foreground hover:text-primary transition-colors">
                Support Policy
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </Link>
              <Link href="/dpa" className="text-muted-foreground hover:text-primary transition-colors">
                Data Processing Agreement
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t">
            <p className="text-muted-foreground text-sm">
              © 2025 Renderiq. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/refund" className="hover:text-primary transition-colors">
                Refunds
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Cookies
              </Link>
              <Link href="/dpa" className="hover:text-primary transition-colors">
                DPA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
