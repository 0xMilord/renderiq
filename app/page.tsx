import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicGallery } from '@/lib/actions/gallery.actions';
import { UseCasesSection } from '@/components/home/use-cases-section';
import { HowItWorksSection } from '@/components/home/how-it-works';
import { FAQSection } from '@/components/home/faq-section';
import { ComparisonSection } from '@/components/home/comparison-section';
import { TrustBadges } from '@/components/home/trust-badges';
import { HomepagePricing } from '@/components/home/homepage-pricing';
import { GallerySection } from '@/components/home/gallery-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { ArchitectureAppsSection } from '@/components/home/architecture-apps-section';
import { UsersDAL } from '@/lib/dal/users';
import { getAllTools } from '@/lib/tools/registry';
import GradualBlur from '@/components/ui/gradual-blur';
import { SmoothCursorWrapper } from '@/components/home/smooth-cursor-wrapper';
import HeroSection from '@/components/home/hero-section';
import OptimizedBackground from '@/components/home/optimized-background';
import { CanvasPipelinePreview } from '@/components/home/canvas-pipeline-preview';
import { 
  Wand2, 
  GalleryVertical, 
  Zap, 
  Shield, 
  Globe, 
  Video, 
  Building2, 
  ArrowRight,
  CheckCircle,
  Code,
  Users,
  TrendingUp,
  Award,
  Clock,
  FileCheck,
  GitBranch,
  FileCode,
  Network,
  MessageSquare,
  Grid3x3,
  Brain,
  Puzzle,
  Key,
  Layers
} from 'lucide-react';
import type { Metadata } from 'next';

// SEO-optimized metadata for homepage
export const metadata: Metadata = {
  title: 'AI Architecture Render Software | AEC Visualization Platform | Renderiq',
  description: 'Professional AI-powered architecture render software for AEC professionals. Transform sketches into photorealistic renders and videos. Best AI rendering tool for architects, engineers, and visualizers.',
  keywords: [
    'architecture render software',
    'AEC software',
    'architectural visualization',
    'AI rendering software',
    'architecture visualization tool',
    'AEC visualization platform',
    'commercial architecture software',
    'industrial design visualization',
    'architectural rendering AI',
    'sketch to render AI',
    '3D architecture visualization',
    'building design software',
    'construction visualization',
    'architectural presentation software',
    'real estate visualization',
    'interior design rendering',
    'exterior rendering software',
    'architectural visualization platform',
    'AEC technology',
    'construction visualization tool',
    'architectural design software',
    'building visualization',
    'commercial rendering',
  ],
  openGraph: {
    title: 'AI Architecture Render Software | AEC Visualization Platform | Renderiq',
    description: 'Transform architectural sketches into photorealistic renders with AI. Professional visualization software for AEC professionals.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

// ✅ ISR: Enable Incremental Static Regeneration for homepage
// Revalidate every 60 seconds (1 minute) to keep content fresh
// This allows the page to be statically generated but updated periodically
export const revalidate = 60;

export default async function Home() {
  // Get dynamic tool count
  const tools = getAllTools();
  const toolCount = tools.length;
  
  // Fetch actual gallery items for the homepage - fetch more for Pinterest-style scrolling
  const galleryResult = await getPublicGallery(1, 60);
  const galleryItems = galleryResult.success ? galleryResult.data || [] : [];
  
  // Fetch top 50 gallery items for hero slideshow (sorted by likes + views)
  const heroGalleryResult = await getPublicGallery(1, 50);
  const heroGalleryItems = heroGalleryResult.success ? heroGalleryResult.data || [] : [];

  // Get latest 10 gallery items for node preview (with prompt and image)
  const nodePreviewItems = galleryItems
    .filter(item => item.render?.prompt && item.render?.outputUrl && item.render.status === 'completed')
    .slice(0, 10);

  // Fetch latest users for avatar circles - only those with avatars
  let latestUsers = [];
  let totalUsers = 0;
  try {
    const allLatestUsers = await UsersDAL.getLatestUsers(50); // Fetch more to filter
    // Filter to only users with actual avatars (not generated ones)
    latestUsers = allLatestUsers
      .filter(user => user.avatar && !user.avatar.includes('dicebear.com'))
      .slice(0, 10); // Take top 10 with real avatars
    
    const realUserCount = await UsersDAL.getActiveUserCount();
    // Multiply by 100 for display
    totalUsers = realUserCount * 100;
  } catch (error) {
    console.error('Error fetching latest users:', error);
  }

  // Prepare avatar data - only users with real avatars
  const avatarData = latestUsers.map(user => {
    // Generate profile URL from user name (slugified)
    const profileUrl = user.name 
      ? `/u/${user.name.toLowerCase().replace(/\s+/g, '-')}` 
      : undefined;
    
    return {
      imageUrl: user.avatar!,
      profileUrl,
    };
  });

  // Twitter testimonial URLs - Real verifiable tweets
  const twitterTestimonials = [
    {
      url: 'https://x.com/CasshyapSa79802/status/1995905411946611051',
      fallback: {
        text: 'Renderiq has completely transformed how we present designs to clients. The AI renders are incredibly realistic and save us hours of work.',
        author: 'CasshyapSa79802',
        username: 'CasshyapSa79802',
      },
    },
    {
      url: 'https://x.com/0xmilords/status/1995907216311025866',
      fallback: {
        text: 'Amazing AI rendering tool for architecture!',
        author: '0xmilords',
        username: '0xmilords',
      },
    },
    {
      url: 'https://x.com/titanidex/status/1995907578480787870',
      fallback: {
        text: 'Renderiq is a game-changer for architectural visualization.',
        author: 'titanidex',
        username: 'titanidex',
      },
    },
    {
      url: 'https://x.com/mogisterate/status/1995907751596490837',
      fallback: {
        text: 'Love using Renderiq for my design projects!',
        author: 'mogisterate',
        username: 'mogisterate',
      },
    },
    {
      url: 'https://x.com/retrobrah/status/1995908179365105973',
      fallback: {
        text: 'Best AI rendering tool I\'ve tried. Highly recommend!',
        author: 'retrobrah',
        username: 'retrobrah',
      },
    },
    {
      url: 'https://x.com/spymilking/status/1995908547490840802',
      fallback: {
        text: 'Renderiq makes architectural rendering so easy and fast.',
        author: 'spymilking',
        username: 'spymilking',
      },
    },
    {
      url: 'https://x.com/0xK4471L/status/1995908727111909851',
      fallback: {
        text: 'Incredible results with Renderiq! The quality is outstanding.',
        author: '0xK4471L',
        username: '0xK4471L',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Optimized Background */}
      <OptimizedBackground />
      
      {/* Content wrapper with relative positioning to ensure it's above the background */}
      <div className="relative z-10">
      
      {/* Optimized Hero Section */}
      <HeroSection avatarData={avatarData} totalUsers={totalUsers} galleryItems={heroGalleryItems} />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Gallery Preview - Full Width */}
      <GallerySection galleryItems={galleryItems} />

      {/* Architecture Apps Section */}
      <ArchitectureAppsSection />

      {/* Pricing Section - Fetched from Database */}
      <HomepagePricing />

      {/* Testimonials Section - With Twitter - Full Width */}
      <TestimonialsSection testimonials={twitterTestimonials} />

      {/* Use Cases Section - AEC Professionals */}
      <UseCasesSection />

      {/* Features Section - Full Width Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/80 backdrop-blur-sm">
        <div className="w-full">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Everything you need for professional
              <span className="block text-muted-foreground">architecture visualization</span>
            </h2>
          </div>

          {/* Bento Grid Layout - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {/* Node-Based Editor - Large Feature Card */}
            <Link href="/canvas" className="group md:col-span-2 lg:col-span-2 md:row-span-2">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Network className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">Node-Based Editor</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[300px] relative z-10">
                  <CanvasPipelinePreview />
                </div>
              </div>
            </Link>

            {/* Chat-Based Renderer - Medium Feature Card */}
            <Link href="/render" className="group md:col-span-1 lg:col-span-1 md:row-span-2">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">Chat-Based Renderer</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[300px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>

            {/* Tools - Large Feature Card */}
            <Link href="/apps" className="group md:col-span-2 lg:col-span-3 md:row-span-1">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Grid3x3 className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">{toolCount} Specialized Tools</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[200px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>

            {/* AI Models - Feature Card */}
            <Link href="/models" className="group md:col-span-1 lg:col-span-1 md:row-span-1">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">All Your Favorite Models</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[200px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>

            {/* Plugins - Feature Card */}
            <Link href="/plugins" className="group md:col-span-2 lg:col-span-2 md:row-span-1">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Puzzle className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">Native Plugins</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[200px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>

            {/* API Access - Feature Card */}
            <Link href="/api" className="group md:col-span-1 lg:col-span-1 md:row-span-1">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Key className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">API Access</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[200px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>

            {/* Technical Moat - Feature Card */}
            <Link href="/platform" className="group md:col-span-2 lg:col-span-2 md:row-span-1">
              <div className="h-full p-8 rounded-2xl bg-card border-2 border-border hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-card-foreground">Platform Built for AEC</h3>
                </div>
                <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                <div className="flex-1 min-h-[200px] relative z-10">
                  {/* Space reserved for huge animated UI */}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section - Conversion Optimized */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(72,87%,62%)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative border-[2px] border-[hsl(0,0%,7%)] p-8">
          <h2 className="text-4xl md:text-6xl font-bold text-[hsl(0,0%,7%)] mb-6">
            Ready to transform your architectural designs?
          </h2>
          <p className="text-xl md:text-2xl text-[hsl(0,0%,20%)] mb-8 max-w-4xl mx-auto">
            Join thousands of AEC professionals creating stunning visualizations with Renderiq
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold bg-[hsl(0,0%,7%)] hover:bg-[hsl(0,0%,15%)] text-[hsl(72,87%,62%)]">
                <Globe className="h-6 w-6 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="border-2 border-[hsl(0,0%,7%)] text-[hsl(0,0%,7%)] hover:bg-[hsl(0,0%,7%)] hover:text-[hsl(72,87%,62%)] px-8 py-4 text-lg font-semibold">
                <GalleryVertical className="h-6 w-6 mr-2" />
                View Gallery
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(0,0%,20%)]">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Setup in 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>10 free credits to start</span>
            </div>
          </div>
        </div>
      </section>

      {/* Smooth Cursor */}
      <SmoothCursorWrapper />
      </div>

      {/* Pinned Bottom Blur Bar - Mobile: starts above bottom nav (3.5rem), Desktop: at bottom */}
      <GradualBlur
        target="page"
        position="bottom"
        height="8rem"
        strength={3}
        divCount={8}
        curve="bezier"
        exponential={true}
        opacity={1}
        className="bottom-14 md:bottom-0"
        style={{ zIndex: 50 }}
      />
    </div>
  );
}
