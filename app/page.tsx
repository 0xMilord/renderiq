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
import { 
  Wand2, 
  Upload, 
  GalleryVertical, 
  Zap, 
  Shield, 
  Globe, 
  Play, 
  Smartphone, 
  Video, 
  Building2, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  Heart,
  Eye,
  Code,
  Users,
  TrendingUp,
  Award,
  Clock,
  FileCheck,
  Store,
  GitBranch,
  Workflow,
  Layers,
  FileCode,
  Brain,
  Network
} from 'lucide-react';
import type { Metadata } from 'next';

// SEO-optimized metadata for homepage
export const metadata: Metadata = {
  title: 'AI Architecture Render Software | AEC Visualization Platform | Renderiq',
  description: 'Professional AI-powered architecture render software for AEC and retail industries. Transform sketches into photorealistic renders and videos. Best AI rendering tool for architects, engineers, and designers.',
  keywords: [
    'architecture render software',
    'AEC software',
    'architectural visualization',
    'AI rendering software',
    'architecture visualization tool',
    'AEC visualization platform',
    'retail design software',
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
    'retail store design software',
  ],
  openGraph: {
    title: 'AI Architecture Render Software | AEC & Retail Visualization | Renderiq',
    description: 'Transform architectural sketches into photorealistic renders with AI. Professional visualization software for AEC and retail industries.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  // Fetch actual gallery items for the homepage
  const galleryResult = await getPublicGallery(1, 6);
  const galleryItems = galleryResult.success ? galleryResult.data || [] : [];

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
    <div className="min-h-screen bg-background">
      {/* Hero Section - SEO Optimized */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <Badge className="mb-6 bg-primary text-primary-foreground border-0 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Architecture Render Software
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Professional Architecture Render Software
              <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                for AEC & Retail Industries
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Transform architectural sketches and 3D models into photorealistic renders and videos with AI. 
              The leading <strong>architecture render software</strong> trusted by architects, engineers, and retail designers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/render">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  <Upload className="h-6 w-6 mr-2" />
                  Start Creating Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                  <Play className="h-6 w-6 mr-2" />
                  View Examples
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Trusted by 10K+ Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>2-5 Minute Renders</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">50K+</div>
                <div className="text-muted-foreground">Renders Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">2.5M</div>
                <div className="text-muted-foreground">Minutes Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">10K+</div>
                <div className="text-muted-foreground">AEC & Retail Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Use Cases Section - AEC & Retail */}
      <UseCasesSection />

      {/* Features Section - Enhanced */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Everything you need for professional
              <span className="block text-muted-foreground">architecture visualization</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive architecture render software combining cutting-edge AI with intuitive design tools for AEC and retail professionals
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
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />2-5 minute renders</li>
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
                Create both images and videos from your sketches with cinematic quality. Perfect for AEC presentations and retail walkthroughs.
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

            {/* Retail Features */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Retail Design Tools</h3>
              <p className="text-muted-foreground mb-4">
                Specialized features for retail store design, product visualization, and e-commerce content creation.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Store layouts</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Product displays</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Lifestyle scenes</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Marketing materials</li>
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
                Work seamlessly with your AEC team or retail design partners. Share projects, collaborate in real-time.
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
                Track your rendering usage, optimize workflows, and gain insights into your AEC or retail design process.
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

      {/* Gallery Preview */}
      <section id="gallery" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Gallery
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              See what&apos;s possible with Renderiq
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore stunning renders created by architects, engineers, and retail designers using our architecture render software
            </p>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                View Full Gallery
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Actual Gallery Items */}
          {galleryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {galleryItems.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="transition-transform duration-200 group-hover:scale-[1.02]">
                    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <div className="relative">
                        {item.render.status === 'completed' && item.render.outputUrl ? (
                          item.render.type === 'video' ? (
                            <video
                              src={item.render.outputUrl}
                              className="w-full h-64 object-cover"
                              controls
                              loop
                            />
                          ) : (
                            <Image
                              src={item.render.outputUrl}
                              alt={item.render.prompt}
                              width={400}
                              height={256}
                              className="w-full h-64 object-cover"
                            />
                          )
                        ) : (
                          <div className="h-64 flex items-center justify-center bg-muted/50">
                            <div className="text-center">
                              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground font-medium">Render in progress...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                          {item.render.prompt}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span className="font-medium">{item.likes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">{item.views}</span>
                            </span>
                          </div>
                          <span className="text-xs truncate max-w-[120px]">
                            by {item.user.name || 'Anonymous'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg bg-card border border-border aspect-square hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Sample Render {i}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section - With Twitter */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Trusted by AEC & Retail Professionals
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of architects, engineers, and designers who trust Renderiq for their visualization needs
            </p>
          </div>

          {/* Traditional Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-background border border-border rounded-2xl p-6">
              <p className="text-muted-foreground mb-6 italic leading-relaxed">
                &ldquo;Renderiq has revolutionized how we present our designs to clients. The AI renders are so realistic that clients can immediately visualize the final result. It&apos;s saved us countless hours of manual rendering work.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-foreground">Sarah Mitchell</div>
                  <div className="text-sm text-muted-foreground">Senior Architect, Design Studio</div>
                </div>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6">
              <p className="text-muted-foreground mb-6 italic leading-relaxed">
                &ldquo;The video generation feature is incredible. We can now create stunning walkthroughs of our AEC projects in minutes instead of days. Our clients are absolutely amazed by the quality.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  JC
                </div>
                <div>
                  <div className="font-semibold text-foreground">James Chen</div>
                  <div className="text-sm text-muted-foreground">Principal, Urban Architects</div>
                </div>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6">
              <p className="text-muted-foreground mb-6 italic leading-relaxed">
                &ldquo;As a retail designer, Renderiq has given me the tools to compete with larger firms. The quality of renders I can produce now is professional-grade, and it&apos;s helped me win more projects.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  AR
                </div>
                <div>
                  <div className="font-semibold text-foreground">Anna Rodriguez</div>
                  <div className="text-sm text-muted-foreground">Retail Design Consultant</div>
                </div>
              </div>
            </div>
          </div>

          {/* Twitter Testimonials - Masonry Layout */}
          <div>
            <TwitterTestimonialsGrid testimonials={twitterTestimonials} />
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Ready to transform your architectural designs?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8 max-w-4xl mx-auto">
            Join thousands of AEC professionals and retail designers creating stunning visualizations with Renderiq
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold">
                <Globe className="h-6 w-6 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg font-semibold">
                <GalleryVertical className="h-6 w-6 mr-2" />
                View Gallery
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/80">
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
    </div>
  );
}
