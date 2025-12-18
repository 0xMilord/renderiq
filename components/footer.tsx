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
  FaMastodon,
  FaQuora
} from 'react-icons/fa6';
import { SiBluesky, SiAutodesk, SiBlender, SiRhinoceros } from 'react-icons/si';
import { Sparkles, Images, Lightbulb, Newspaper, CreditCard, Info, FileText, Mail, Users, Puzzle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PWAInstallButton } from '@/components/pwa/install-button';
import { Button } from '@/components/ui/button';
import { getAllTools, CATEGORIES, type ToolCategory } from '@/lib/tools/registry';

export function Footer() {
  return (
    <footer className="bg-background border-t w-full relative -mt-px">
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 pt-10 pb-32 sm:pb-36 md:pb-40 lg:pb-44">
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
                <a href="https://bsky.app/profile/renderiq.bsky.social" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Bluesky" target="_blank" rel="noopener noreferrer">
                  <SiBluesky className="h-5 w-5" />
                </a>
                <a href="https://x.com/renderiq_ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="X (Twitter)" target="_blank" rel="noopener noreferrer">
                  <FaXTwitter className="h-5 w-5" />
                </a>
                <a href="https://github.com/renderiq-ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="GitHub" target="_blank" rel="noopener noreferrer">
                  <FaGithub className="h-5 w-5" />
                </a>
                <a href="https://www.linkedin.com/company/renderiq-ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <FaLinkedin className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/renderiq.ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Instagram" target="_blank" rel="noopener noreferrer">
                  <FaInstagram className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/@Renderiq_ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="YouTube" target="_blank" rel="noopener noreferrer">
                  <FaYoutube className="h-5 w-5" />
                </a>
                <a href="https://www.reddit.com/user/Renderiq-AI/" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Reddit" target="_blank" rel="noopener noreferrer">
                  <FaReddit className="h-5 w-5" />
                </a>
                <a href="https://www.threads.com/@renderiq.ai" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Threads" target="_blank" rel="noopener noreferrer">
                  <FaThreads className="h-5 w-5" />
                </a>
                <a href="https://www.quora.com/profile/Renderiq" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Quora" target="_blank" rel="noopener noreferrer">
                  <FaQuora className="h-5 w-5" />
                </a>
                <a href="https://discord.gg/KADV5pX3" className="text-muted-foreground transition-colors p-1.5 rounded hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black" title="Discord" target="_blank" rel="noopener noreferrer">
                  <FaDiscord className="h-5 w-5" />
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
                <li>
                  <Link href="/plugins" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Puzzle className="h-3.5 w-3.5" />
                    Plugins
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
                  <Link href="/ambassador" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Ambassador
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
          {/* Plugins Links */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/plugins/sketchup-ai-rendering-plugin" className="flex items-center gap-2">
                  <span className="text-lg">📐</span>
                  <span>SketchUp Plugin</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/plugins/revit-ai-rendering-plugin" className="flex items-center gap-2">
                  <SiAutodesk className="h-4 w-4" />
                  <span>Revit Plugin</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/plugins/autocad-ai-rendering-plugin" className="flex items-center gap-2">
                  <SiAutodesk className="h-4 w-4" />
                  <span>AutoCAD Plugin</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/plugins/blender-ai-rendering-plugin" className="flex items-center gap-2">
                  <SiBlender className="h-4 w-4" />
                  <span>Blender Plugin</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/plugins/rhino-ai-rendering-plugin" className="flex items-center gap-2">
                  <SiRhinoceros className="h-4 w-4" />
                  <span>Rhino Plugin</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-t mb-6 pt-6"></div>

          {/* Apps Links */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Apps</h3>
              <Link href="/apps" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-sm">
              {getAllTools().map((tool) => (
                <Link
                  key={tool.id}
                  href={`/${tool.slug}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {tool.name}
                </Link>
              ))}
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
              <Link href="/support" className="hover:text-primary transition-colors">
                Support
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
