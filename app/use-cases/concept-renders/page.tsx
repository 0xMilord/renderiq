import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Eye, Sparkles, Zap, Clock, CheckCircle2, Upload, MessageSquare, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';
import { RelatedTools } from '@/components/use-cases/related-tools';
import { primaryUseCases } from '@/lib/data/use-cases';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Concept Renders for Early Visualization | AI Sketch to Render | Renderiq",
  description: "Transform rough sketches and initial design ideas into photorealistic visualizations in seconds. Perfect for early-stage design exploration and client communication before detailed development.",
  keywords: [
    "concept renders",
    "early visualization",
    "sketch to render",
    "concept visualization",
    "design exploration",
    "architectural sketches",
    "rapid prototyping",
    "early stage design",
    "client presentations",
    "design iteration",
    "AI architectural visualization",
    "sketch to photorealistic render"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/concept-renders`,
  },
  openGraph: {
    title: "Concept Renders for Early Visualization | AI Sketch to Render | Renderiq",
    description: "Transform rough sketches and initial design ideas into photorealistic visualizations in seconds. Perfect for early-stage design exploration and client communication.",
    type: "website",
    url: `${siteUrl}/use-cases/concept-renders`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-concept-renders.jpg`,
        width: 1200,
        height: 630,
        alt: "Concept Renders for Early Visualization - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Concept Renders for Early Visualization | Renderiq",
    description: "Transform rough sketches into photorealistic visualizations in seconds. Perfect for early-stage design exploration.",
    images: [`${siteUrl}/og/use-cases-concept-renders.jpg`],
    creator: "@Renderiq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Architecture',
};

const benefits = [
  {
    icon: Zap,
    title: "Instant Visualization",
    description: "Transform sketches into photorealistic renders in 30-60 seconds using our advanced AI image generation models.",
    metric: "30-60 second generation"
  },
  {
    icon: Eye,
    title: "Early Client Feedback",
    description: "Show clients realistic visualizations before investing in detailed modeling and development.",
    metric: "Save weeks of development"
  },
  {
    icon: Sparkles,
    title: "Multiple Concepts",
    description: "Explore multiple design directions rapidly using render chains to track iterations.",
    metric: "Test 10+ concepts/hour"
  },
  {
    icon: Clock,
    title: "Faster Decisions",
    description: "Make design decisions faster with immediate visual feedback on your concepts.",
    metric: "80% faster workflow"
  }
];

const workflow = [
  {
    step: 1,
    title: "Upload Sketch",
    description: "Drag and drop your sketch, hand drawing, or rough CAD export into the unified chat interface"
  },
  {
    step: 2,
    title: "Describe Vision",
    description: "Use natural language to describe your design concept and desired style"
  },
  {
    step: 3,
    title: "Generate Render",
    description: "AI creates photorealistic visualization maintaining your design proportions"
  },
  {
    step: 4,
    title: "Iterate & Refine",
    description: "Use render chains to build on successful elements with @v1, @v2, or @latest references"
  }
];

const useCases = [
  {
    title: "Initial Client Meetings",
    description: "Present multiple design concepts visually before committing to detailed development. Get client buy-in early.",
    benefit: "95% client approval rate"
  },
  {
    title: "Design Charrettes",
    description: "Generate rapid concept variations during collaborative design sessions. Explore ideas in real-time.",
    benefit: "10x more concepts explored"
  },
  {
    title: "Competition Entries",
    description: "Quickly visualize competition entries from sketches. Test multiple approaches before finalizing.",
    benefit: "Faster competition prep"
  },
  {
    title: "Feasibility Studies",
    description: "Visualize design feasibility early in the process. Identify potential issues before detailed work.",
    benefit: "Early problem detection"
  }
];

export default function ConceptRendersPage() {
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Create Concept Renders for Early Visualization',
    description: 'Learn how to transform architectural sketches into photorealistic concept renders using AI. Perfect for early-stage design exploration and client communication.',
    image: `${siteUrl}/og/use-cases-concept-renders.jpg`,
    totalTime: 'PT5M',
    estimatedCost: {
      currency: 'USD',
      value: '0'
    },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Architectural Sketch or Drawing' }
    ],
    step: workflow.map((w, index) => ({
      '@type': 'HowToStep',
      name: w.title,
      text: w.description,
      url: `${siteUrl}/use-cases/concept-renders#step-${index + 1}`
    }))
  });

  return (
    <>
      <JsonLd data={howToSchema} />
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-blue-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-6">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Concept Visualization</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Concept Renders for Early Visualization
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform rough sketches and initial design ideas into photorealistic visualizations in seconds. 
              Perfect for early-stage design exploration and client communication before committing to detailed development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Creating Concepts
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Concept Examples
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Concept Rendering Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload your initial sketches, hand drawings, or rough CAD exports directly into Renderiq's unified chat interface. 
                The platform uses advanced AI image generation models to understand architectural context, maintaining your design 
                proportions while adding realistic materials, lighting, and spatial depth.
              </p>
              <p className="text-lg text-muted-foreground">
                Generate multiple concept variations in minutes using render chains—simply reference previous versions with 
                @v1 or @latest to build on successful elements. This workflow lets you explore design directions before investing 
                in detailed modeling, making it perfect for initial client meetings, design charrettes, and early-stage decision making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Concept Rendering Matters
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Make better design decisions faster with instant visual feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {benefit.metric}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-lg text-muted-foreground">
              From sketch to photorealistic concept in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {workflow.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {idx < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect For
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {useCase.benefit}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Upload className="w-8 h-8 text-blue-500 mb-4" />
                <CardTitle>Multiple Input Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload sketches, hand drawings, CAD exports, or photos. Renderiq understands architectural context from any input.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
                <CardTitle>Natural Language Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Describe your vision in plain English. No technical jargon needed—just tell the AI what you want to see.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Layers className="w-8 h-8 text-blue-500 mb-4" />
                <CardTitle>Render Chains</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track all concept iterations automatically. Reference previous versions to build on successful elements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      {(() => {
        const useCase = primaryUseCases.find(uc => uc.slug === 'concept-renders');
        if (useCase && useCase.relatedTools) {
          return (
            <RelatedTools 
              toolSlugs={useCase.relatedTools}
              title="Tools for Concept Rendering"
              description="Use these powerful AI tools to transform your sketches and ideas into photorealistic concept renders"
            />
          );
        }
        return null;
      })()}

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Creating Concept Renders Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Transform your sketches into photorealistic visualizations in seconds
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Try It Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

