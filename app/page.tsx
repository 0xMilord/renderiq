import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicGallery } from '@/lib/actions/gallery.actions';
import { TwitterTestimonialsGrid } from '@/components/home/twitter-testimonials-grid';
import { UseCasesSection } from '@/components/home/use-cases-section';
import { HowItWorksSection } from '@/components/home/how-it-works';
import { FAQSection } from '@/components/home/faq-section';
import { ComparisonSection } from '@/components/home/comparison-section';
import { TrustBadges } from '@/components/home/trust-badges';
import { HomepagePricing } from '@/components/home/homepage-pricing';
import { PinterestGallery } from '@/components/home/pinterest-gallery';
import { UsersDAL } from '@/lib/dal/users';
import GradualBlur from '@/components/ui/gradual-blur';
import { SmoothCursorWrapper } from '@/components/home/smooth-cursor-wrapper';
import HeroSection from '@/components/home/hero-section';
import OptimizedBackground from '@/components/home/optimized-background';
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
  Network
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

export default async function Home() {
  // Fetch actual gallery items for the homepage - fetch more for Pinterest-style scrolling
  const galleryResult = await getPublicGallery(1, 60);
  const galleryItems = galleryResult.success ? galleryResult.data || [] : [];

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
      ? `/${user.name.toLowerCase().replace(/\s+/g, '-')}` 
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
      <HeroSection avatarData={avatarData} totalUsers={totalUsers} />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Use Cases Section - AEC Professionals */}
      <UseCasesSection />

      {/* Features Section - Enhanced */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Everything you need for professional
              <span className="block text-muted-foreground">architecture visualization</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive architecture render software combining cutting-edge AI with intuitive design tools for AEC professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Rendering */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wand2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">AI-Powered Rendering</h3>
              <p className="text-muted-foreground mb-4">
                Transform basic sketches into photorealistic architectural visualizations using Google Gemini 3 Pro and Veo 3.1 AI technology.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multiple AI models</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Style presets</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Custom prompts</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Material library</li>
              </ul>
            </div>

            {/* Fast Processing */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Lightning Fast Processing</h3>
              <p className="text-muted-foreground mb-4">
                Get your renders in minutes, not hours. Our optimized pipeline delivers results quickly for time-sensitive AEC projects.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Under 30 second renders</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Queue management</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Real-time updates</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Batch processing</li>
              </ul>
            </div>

            {/* Video Generation */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Video Generation</h3>
              <p className="text-muted-foreground mb-4">
                Create both images and videos from your sketches with cinematic quality. Perfect for AEC presentations, client meetings, and design reviews.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />4K video output</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Camera movements</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multiple formats</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Keyframe animation</li>
              </ul>
            </div>

            {/* AEC-Specific Features */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">AEC-Optimized</h3>
              <p className="text-muted-foreground mb-4">
                Built specifically for Architecture, Engineering, and Construction professionals with industry-standard features.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Technical accuracy</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Scale precision</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Material specifications</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Construction documentation</li>
              </ul>
            </div>

            {/* Commercial Architecture Features */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Commercial Architecture</h3>
              <p className="text-muted-foreground mb-4">
                Specialized tools for commercial buildings, office spaces, and large-scale architectural projects.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Office complexes</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Commercial spaces</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Mixed-use developments</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Large-scale projects</li>
              </ul>
            </div>

            {/* Security & Privacy */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Secure & Private</h3>
              <p className="text-muted-foreground mb-4">
                Enterprise-grade security and privacy protection for sensitive architectural and commercial projects.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />End-to-end encryption</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />GDPR compliant</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Private projects</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />SOC 2 compliant</li>
              </ul>
            </div>

            {/* API & Integrations */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Code className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">API & Integrations</h3>
              <p className="text-muted-foreground mb-4">
                Integrate Renderiq into your existing AEC workflow with our comprehensive API and third-party integrations.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />RESTful API</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Webhook support</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />CAD integrations</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />BIM compatibility</li>
              </ul>
            </div>

            {/* Render Chains */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Render Chains</h3>
              <p className="text-muted-foreground mb-4">
                Organize renders into sequential chains for iteration tracking and version management. Reference previous renders with <code className="text-xs bg-muted px-1 py-0.5 rounded">@v1</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">@v2</code>, or <code className="text-xs bg-muted px-1 py-0.5 rounded">@latest</code>.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Automatic chain creation</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Version references (@v1, @v2, @latest)</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Iteration tracking</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Context preservation</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Chain branching & organization</li>
              </ul>
            </div>

            {/* Version Control */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileCode className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Version Control</h3>
              <p className="text-muted-foreground mb-4">
                Built-in version control system tracks every render iteration, prompt changes, and settings modifications. Never lose your work.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Complete render history</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Prompt & settings tracking</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Version comparison</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Rollback to any version</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Parent-child relationships</li>
              </ul>
            </div>

            {/* Node-Based Canvas Editor */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Network className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Node-Based Canvas Editor</h3>
              <p className="text-muted-foreground mb-4">
                Blender-style visual workflow editor. Create complex render workflows by connecting nodes visually. Perfect for advanced users.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Visual node editor</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Text, Image, and Variants nodes</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Drag-and-drop workflow building</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Real-time data flow</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Auto-save & export</li>
              </ul>
            </div>

            {/* AEC-Specific Features */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">AEC-Optimized</h3>
              <p className="text-muted-foreground mb-4">
                Built specifically for Architecture, Engineering, and Construction professionals with <strong>AEC finetunes</strong> and industry-standard features.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /><strong>AEC finetunes</strong> - Architecture-aware AI</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Technically correct renders</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Scale precision & proportions</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Material specifications</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Construction documentation ready</li>
              </ul>
            </div>

            {/* Team Collaboration */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground mb-4">
                Work seamlessly with your AEC team and design partners. Share projects, collaborate in real-time.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Team projects</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Shared render chains</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Comments & feedback</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Client sharing</li>
              </ul>
            </div>

            {/* Analytics & Insights */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Analytics & Insights</h3>
              <p className="text-muted-foreground mb-4">
                Track your rendering usage, optimize workflows, and gain insights into your AEC design process.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Usage analytics</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Performance metrics</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cost tracking</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Export reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview - Full Width */}
      <section id="gallery" className="w-full overflow-x-hidden relative bg-[hsl(72,87%,62%)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] border-secondary">
          <div className="w-full relative">
            <div className="text-left relative pt-8">
              <Badge className="mb-4 bg-background text-foreground px-4 py-2">
                Gallery
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(0,0%,7%)]">
                See what&apos;s possible with Renderiq
              </h2>
              <p className="text-xl max-w-3xl pb-6 text-[hsl(0,0%,20%)]">
                Explore stunning renders created by architects, engineers, and visualizers using our architecture render software
              </p>
              <Link href="/gallery">
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold mb-8">
                  View Full Gallery
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full relative border-l-[5px] border-b-[5px] border-secondary">
          {/* Black container behind gallery */}
          <div className="absolute inset-0 bg-black -z-10"></div>
          
          <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
            {/* Left Column - 40% - Gallery Illustration - Extended to extreme left edge */}
            <div className="w-full lg:w-[40%] flex items-center justify-start order-2 lg:order-1 lg:mr-auto lg:ml-0 lg:pl-0 lg:relative border-r-[5px] lg:border-r-[5px] border-secondary bg-[hsl(72,87%,62%)]" style={{ marginLeft: 'calc((100vw - 100%) / -2)' }}>
              <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px]">
                <Image
                  src="/home/gallery-section.svg"
                  alt="Gallery Illustration"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* Right Column - 100% on mobile, 60% on desktop - Gallery Content */}
            <div className="w-full lg:w-[60%] order-1 lg:order-2 px-2 sm:px-4 lg:px-4 py-4 relative flex flex-col bg-[hsl(72,87%,62%)]">
              <div className="w-full relative px-2 sm:px-4 lg:px-4 py-2 rounded-2xl bg-background flex-1 border-[5px] border-secondary">
                {/* Pinterest-style Vertical Marquee Gallery */}
                <PinterestGallery items={galleryItems} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - With Twitter - Full Width */}
      <section id="testimonials" className="w-full overflow-x-hidden relative bg-[hsl(72,87%,62%)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] border-secondary">
          <div className="w-full relative">
            <div className="text-left relative pt-8">
              <Badge className="mb-4 bg-background text-foreground px-4 py-2">
                Testimonials
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[hsl(0,0%,7%)]">
                Trusted by AEC Professionals
              </h2>
              <p className="text-xl max-w-3xl pb-6 text-[hsl(0,0%,20%)]">
                Join thousands of architects, engineers, and designers who trust Renderiq for their visualization needs
              </p>
            </div>
          </div>
        </div>

        <div className="w-full relative border-l-[5px] border-b-[5px] border-secondary">
          {/* Black container behind testimonials */}
          <div className="absolute inset-0 bg-black -z-10"></div>
          
          <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
            {/* Left Column - 100% on mobile, 60% on desktop - Testimonials Content */}
            <div className="w-full lg:w-[60%] order-1 lg:order-1 px-4 sm:px-6 lg:px-8 py-8 relative flex flex-col border-r-[5px] border-secondary bg-[hsl(72,87%,62%)]">
              <div className="w-full relative px-4 sm:px-6 lg:px-8 py-6 rounded-2xl bg-background flex-1 border-[5px] border-secondary">
                {/* Twitter Testimonials - Masonry Layout */}
                <div>
                  <TwitterTestimonialsGrid testimonials={twitterTestimonials} />
                </div>
              </div>
            </div>

            {/* Right Column - 40% - Testimonials Image - Extended to extreme right edge */}
            <div className="w-full lg:w-[40%] flex items-center justify-end order-2 lg:order-2 lg:ml-auto lg:mr-0 lg:pr-0 lg:relative border-r-[5px] border-secondary bg-[hsl(72,87%,62%)]" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}>
              <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px]">
                <Image
                  src="/home/testimonials-section.svg"
                  alt="Testimonials Illustration"
                  fill
                  className="object-contain object-right"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Fetched from Database */}
      <HomepagePricing />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Trust Badges */}
      <TrustBadges />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section - Conversion Optimized */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[hsl(72,87%,62%)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative border-[5px] border-[hsl(0,0%,7%)] p-8">
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
      />

      {/* Smooth Cursor */}
      <SmoothCursorWrapper />
      </div>
    </div>
  );
}
