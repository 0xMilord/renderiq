import Link from 'next/link';
import Image from 'next/image';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DecoratedText } from '@/components/ui/decorated-text';
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
import { ShineBorder } from '@/components/ui/shine-border';
import { VercelCard } from '@/components/ui/vercel-card';
import { AnimatedBeamMultipleOutputDemo } from '@/components/home/animated-beam-models-demo';
import { ChatRendererDemo } from '@/components/home/chat-renderer-demo';
import { PluginsExpandableDemo } from '@/components/home/plugins-expandable-demo';
import Clock from '@/components/ui/clock';
import { LogoStepper } from '@/components/ui/logo-stepper';
import { AECFeaturesGrid } from '@/components/home/aec-features-grid';
import { ApiOrbitDemo } from '@/components/home/api-orbit-demo';
// Paddle redirect is now handled server-side for immediate redirect
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
  Clock as ClockIcon,
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

  // Get latest 10 renders for chat demo - with uploaded image and output
  const chatDemoRenders = galleryItems
    .filter(item => 
      item.render?.outputUrl && 
      item.render.status === 'completed' &&
      (item.render as any)?.uploadedImageUrl // Only items with uploaded images
    )
    .slice(0, 10)
    .map(item => ({
      id: item.render!.id,
      outputUrl: item.render!.outputUrl,
      inputUrl: (item.render as any)?.uploadedImageUrl,
      prompt: item.render!.prompt,
    }));

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

      {/* Features Section - Full Width Grid */}
      <section id="features" className="relative py-8 px-8 overflow-hidden border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
        {/* Horizontal Separator Lines - Full Width Grid Structure */}
        {/* Top separator - shows where top padding starts */}
        <div className="absolute top-0 left-0 w-screen h-px border-t border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Line where top padding ends and main container starts */}
        <div className="absolute top-8 left-0 w-screen h-px border-t border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Line where main container ends and bottom padding starts */}
        <div className="absolute bottom-8 left-0 w-screen h-px border-t border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Bottom separator - shows where bottom padding ends */}
        <div className="absolute bottom-0 left-0 w-screen h-px border-b border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Vertical Separator Lines - Full Height Grid Structure */}
        {/* Left separator - shows where left padding starts */}
        <div className="absolute top-0 left-0 h-full w-px border-l border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Line where left padding ends and main container starts */}
        <div className="absolute top-0 left-8 h-full w-px border-l border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Line where main container ends and right padding starts */}
        <div className="absolute top-0 right-8 h-full w-px border-r border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}></div>
        
        {/* Right separator - shows where right padding ends */}
        <div className="absolute top-0 right-0 h-full w-px border-r border-dotted border-black/[0.2] dark:border-white/[0.2] z-20" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}></div>
        
        <div className="w-full relative z-10 pt-8 pb-8 px-8">
          <div className="text-center lg:text-left mb-16">
            <DecoratedText className="text-sm font-medium px-3 py-1.5 mb-4">
              Features
            </DecoratedText>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Everything you need for professional
              <span className="block text-muted-foreground">architecture visualization</span>
            </h2>
          </div>

          {/* Bento Grid Layout - Full Width */}
          <VercelCard className="w-full overflow-visible" showIcons={true} bordered={true}>
            <div className="relative w-full">
              <ShineBorder borderWidth={0.5} shineColor="white" className="z-20 opacity-60" sides="internal" />
              <div className="flex flex-col w-full">
              
              {/* Row 1: Node-Based Editor + Tools (3/4) | Chat-Based Renderer (1/4) */}
              <div className="flex flex-col lg:flex-row lg:min-h-[700px] overflow-visible">
                {/* Left Column - Node-Based Editor + Tools stacked (65% width) */}
                <div className="flex flex-col lg:w-[65%] self-stretch min-h-0">
                  {/* Node-Based Editor */}
                  <div className="relative">
                    <ShineBorder borderWidth={0.5} shineColor={["#8B5CF6", "#D1F24A"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                    <VercelCard className="bg-card transition-all duration-300 flex flex-col relative overflow-visible rounded-none" showIcons={true} bordered={true}>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                          <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                            <Network className="h-5 w-5 text-foreground" />
                            <span className="w-px h-6 bg-foreground/30 mx-2" />
                            Node-Based Editor
                          </DecoratedText>
                        </div>
                        <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                        <div className="h-[300px] md:h-[350px] lg:h-[400px] relative z-10">
                          <CanvasPipelinePreview />
                        </div>
                      </div>
                    </VercelCard>
                  </div>

                  {/* 24 Specialized Tools */}
                  <div className="relative flex-1 min-h-0">
                    <ShineBorder borderWidth={0.5} shineColor={["#D1F24A", "#8B5CF6"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                    <VercelCard className="h-full rounded-none bg-card transition-all duration-300 flex flex-col relative overflow-visible" showIcons={true} bordered={true}>
                      <div className="p-4 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                          <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                            <Grid3x3 className="h-5 w-5 text-foreground" />
                            <span className="w-px h-6 bg-foreground/30 mx-2" />
                            {toolCount} Specialized AEC Tools
                          </DecoratedText>
                        </div>
                        <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                        <div className="flex-1 relative z-10 flex items-center overflow-visible">
                          <LogoStepper
                            logos={tools.slice(0, 18).map(tool => ({
                              icon: (
                                <img
                                  src={`/apps/icons/${tool.id}.svg`}
                                  alt={tool.name}
                                  className="w-full h-full object-contain"
                                />
                              ),
                              label: tool.name,
                            }))}
                            direction="loop"
                            animationDelay={1.5}
                            animationDuration={0.5}
                            visibleCount={7}
                          />
                        </div>
                      </div>
                    </VercelCard>
                  </div>
                </div>

                {/* Right Column - Chat-Based Renderer (35% width, max 600px) */}
                <div className="lg:w-[35%] lg:max-w-[600px] self-stretch min-h-[500px] md:min-h-[600px] lg:min-h-0 relative">
                  <ShineBorder borderWidth={0.5} shineColor={["#3B82F6", "#8B5CF6"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                  <VercelCard className="h-full bg-card transition-all duration-300 flex flex-col relative overflow-visible rounded-none" showIcons={true} bordered={true}>
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex-shrink-0 flex items-center gap-2 mb-2 relative z-10">
                        <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-foreground" />
                          <span className="w-px h-6 bg-foreground/30 mx-2" />
                          Chat-Based Renderer
                        </DecoratedText>
                      </div>
                      <div className="flex-shrink-0 w-full h-px bg-border mb-2 relative z-10"></div>
                      <div className="flex-1 min-h-[400px] md:min-h-[500px] relative z-10 overflow-hidden border border-border">
                        <ChatRendererDemo className="h-full" galleryRenders={chatDemoRenders} />
                      </div>
                    </div>
                  </VercelCard>
                </div>
              </div>

              {/* Row 2: AI Models (35%) | Native Plugins (65%) */}
              <div className="flex flex-col lg:flex-row">
                {/* AI Models - 35% width */}
                <div className="lg:w-[35%] relative">
                  <ShineBorder borderWidth={0.5} shineColor={["#A855F7", "#D1F24A"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                  <VercelCard className="h-full rounded-none bg-card transition-all duration-300 flex flex-col relative overflow-visible" showIcons={true} bordered={true}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                          <Brain className="h-5 w-5 text-foreground" />
                          <span className="w-px h-6 bg-foreground/30 mx-2" />
                          All Your Favorite Models
                        </DecoratedText>
                      </div>
                      <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                      <div className="flex-1 min-h-[200px] relative z-10">
                        <AnimatedBeamMultipleOutputDemo className="h-full" />
                      </div>
                    </div>
                  </VercelCard>
                </div>

                {/* Native Plugins - 65% width */}
                <div className="lg:w-[65%] min-h-[300px] md:min-h-[350px] relative">
                  <ShineBorder borderWidth={0.5} shineColor={["#F97316", "#A855F7"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                  <VercelCard className="h-full rounded-none bg-card transition-all duration-300 flex flex-col relative overflow-visible group" showIcons={true} bordered={true}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                          <Puzzle className="h-5 w-5 text-foreground" />
                          <span className="w-px h-6 bg-foreground/30 mx-2" />
                          Native Plugins
                        </DecoratedText>
                      </div>
                      <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                      <div className="flex-1 min-h-[200px] relative z-10 flex items-stretch">
                        <PluginsExpandableDemo />
                      </div>
                    </div>
                  </VercelCard>
                </div>
              </div>

              {/* Row 3: Platform Built for AEC (3/4) | API Access (1/4) */}
              <div className="flex flex-col lg:flex-row">
                {/* Platform Built for AEC - 3/4 width */}
                <div className="lg:w-3/4 relative">
                  <ShineBorder borderWidth={0.5} shineColor={["#10B981", "#F97316"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                  <VercelCard className="h-full bg-card transition-all duration-300 flex flex-col relative overflow-visible rounded-none" showIcons={true} bordered={true}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                          <Layers className="h-5 w-5 text-foreground" />
                          <span className="w-px h-6 bg-foreground/30 mx-2" />
                          Platform Built for AEC
                        </DecoratedText>
                      </div>
                      <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                      <div className="flex-1 relative z-10 flex items-center justify-center min-h-0">
                        <AECFeaturesGrid />
                      </div>
                    </div>
                  </VercelCard>
                </div>

                {/* API Access - 1/4 width */}
                <div className="lg:w-1/4 relative">
                  <ShineBorder borderWidth={0.5} shineColor={["#6366F1", "#10B981"]} sides="external" className="z-30 opacity-60" style={{ borderRadius: 0, '--border-radius': '0px' } as React.CSSProperties} />
                  <VercelCard className="h-full bg-card transition-all duration-300 flex flex-col relative overflow-visible rounded-none" showIcons={true} bordered={true}>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <DecoratedText className="text-xl md:text-2xl font-bold text-card-foreground px-3 py-1.5 flex items-center gap-3">
                          <Key className="h-5 w-5 text-foreground" />
                          <span className="w-px h-6 bg-foreground/30 mx-2" />
                          API Access
                        </DecoratedText>
                      </div>
                      <div className="w-full h-px bg-border mb-6 relative z-10"></div>
                      <div className="flex-1 h-[250px] md:h-[280px] lg:h-[300px] relative z-10 flex items-center justify-center">
                        <ApiOrbitDemo className="w-full h-full" />
                      </div>
                    </div>
                  </VercelCard>
                </div>
              </div>

            </div>
            </div>
          </VercelCard>
        </div>
      </section>

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

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section - With Clock Component */}
      <section className="py-8 px-8 bg-[hsl(72,87%,62%)] relative overflow-hidden border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
        <div className="w-full max-w-full mx-auto relative">
          <VercelCard className="w-full bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2]" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
            <div className="py-8 px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                {/* Left Column - Text Content */}
                <div className="flex flex-col items-start text-left space-y-6 flex-1">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(0,0%,7%)]">
                    <span className="block">Render Faster</span>
                    <span className="block">Than Ever</span>
                  </h2>
                  <p className="text-lg md:text-xl text-[hsl(0,0%,20%)] max-w-lg">
                    Join thousands of AEC professionals creating stunning visualizations with Renderiq
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/signup">
                      <RainbowButton 
                        size="lg" 
                        variant="default" 
                        className="px-8 py-4 text-lg font-semibold !text-[hsl(72,87%,62%)] dark:!text-[hsl(72,87%,62%)] [&]:!bg-[hsl(0,0%,7%)] [&]:hover:!bg-[hsl(0,0%,15%)]"
                      >
                        <Globe className="h-6 w-6 mr-2" />
                        Get Started Free
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </RainbowButton>
                    </Link>
                    <Link href="/gallery">
                      <RainbowButton 
                        size="lg" 
                        variant="outline" 
                        className="px-8 py-4 text-lg font-semibold border-2 border-[hsl(0,0%,7%)] !text-[hsl(72,87%,62%)] dark:!text-[hsl(72,87%,62%)] [&]:!bg-[hsl(0,0%,7%)] [&]:hover:!bg-[hsl(0,0%,15%)]"
                      >
                        <GalleryVertical className="h-6 w-6 mr-2" />
                        View Gallery
                      </RainbowButton>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-[hsl(0,0%,20%)]">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>Setup in 2 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>25 free credits to start</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Clock */}
                <div className="w-full md:w-[320px] lg:w-[380px] aspect-square flex-shrink-0">
                  <Clock />
                </div>
              </div>
            </div>
          </VercelCard>
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
