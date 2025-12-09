import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, Zap, TrendingUp, CheckCircle2, Video, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
}

export const metadata: Metadata = {
  title: "Real-Time Architectural Visualization with AI | Instant Rendering | Renderiq",
  description: "Transform architectural designs into photorealistic renders in seconds. AI-powered real-time visualization for architects enables instant client presentations, live design iterations, and immediate feedback.",
  keywords: [
    "real-time architectural visualization",
    "instant architectural rendering",
    "AI real-time rendering",
    "live architectural visualization",
    "instant design rendering",
    "real-time 3D visualization",
    "architectural visualization software",
    "fast architectural rendering",
    "immediate design feedback",
    "live client presentations"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/use-cases/real-time-visualization`,
  },
  openGraph: {
    title: "Real-Time Architectural Visualization with AI | Instant Rendering | Renderiq",
    description: "Transform architectural designs into photorealistic renders in seconds. AI-powered real-time visualization enables instant client presentations and live design iterations.",
    type: "website",
    url: `${getSiteUrl()}/use-cases/real-time-visualization`,
    siteName: "Renderiq",
    images: [
      {
        url: `${getSiteUrl()}/og/use-cases-real-time-visualization.jpg`,
        width: 1200,
        height: 630,
        alt: "Real-Time Architectural Visualization with AI - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real-Time Architectural Visualization with AI | Renderiq",
    description: "Transform architectural designs into photorealistic renders in seconds. AI-powered real-time visualization.",
    images: [`${getSiteUrl()}/og/use-cases-real-time-visualization.jpg`],
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
};

const benefits = [
  {
    icon: Clock,
    title: "Instant Results",
    description: "Generate photorealistic renders in seconds instead of hours. No more overnight rendering times.",
    metrics: "99% faster than traditional rendering"
  },
  {
    icon: Zap,
    title: "Live Iterations",
    description: "Make changes and see results immediately. Perfect for client meetings and design reviews.",
    metrics: "Real-time feedback loop"
  },
  {
    icon: TrendingUp,
    title: "Higher Win Rates",
    description: "Present multiple design options instantly, increasing project approval rates significantly.",
    metrics: "3x more design options shown"
  },
  {
    icon: Video,
    title: "Dynamic Presentations",
    description: "Create compelling presentations with real-time updates during client meetings.",
    metrics: "Interactive client engagement"
  }
];

const workflowSteps = [
  {
    step: 1,
    title: "Upload Your Design",
    description: "Upload sketches, CAD drawings, or 3D models in any format"
  },
  {
    step: 2,
    title: "AI Processing",
    description: "Our AI instantly analyzes and enhances your design with photorealistic details"
  },
  {
    step: 3,
    title: "Real-Time Editing",
    description: "Adjust materials, lighting, and elements with instant visual feedback"
  },
  {
    step: 4,
    title: "Present & Iterate",
    description: "Share with clients and make changes on the fly during presentations"
  }
];

const useCases = [
  {
    title: "Client Presentations",
    description: "Walk clients through designs interactively, making adjustments based on real-time feedback.",
    benefit: "Higher client satisfaction and faster approvals"
  },
  {
    title: "Design Meetings",
    description: "Collaborate with teams by instantly visualizing design ideas and changes.",
    benefit: "More productive meetings with actionable outcomes"
  },
  {
    title: "Concept Development",
    description: "Rapidly explore multiple design directions without waiting for renders.",
    benefit: "Find optimal solutions 10x faster"
  },
  {
    title: "Marketing Materials",
    description: "Generate stunning visuals for proposals, websites, and social media on demand.",
    benefit: "Professional marketing with minimal effort"
  }
];

export default function RealTimeVisualizationPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/use-cases/real-time-visualization`;
  
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Use Real-Time Architectural Visualization',
    description: 'Learn how to transform architectural designs into photorealistic renders in seconds. AI-powered real-time visualization enables instant client presentations, live design iterations, and immediate feedback.',
    image: `${siteUrl}/og/use-cases-real-time-visualization.jpg`,
    totalTime: 'PT5M',
    estimatedCost: { currency: 'USD', value: '0' },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Architectural Design (Sketch, CAD, or 3D Model)' }
    ],
    step: workflowSteps.map((w, index) => ({
      '@type': 'HowToStep',
      name: w.title,
      text: w.description,
      url: `${pageUrl}#step-${index + 1}`
    }))
  });
  
  return (
    <>
      <JsonLd data={howToSchema} />
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-blue-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Real-Time AI Visualization</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Instant Architectural Visualization
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform sketches and CAD drawings into photorealistic renders in seconds. 
              No more waiting hours for renders—see design changes instantly and present with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Try It Free
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See Examples
                  <ImageIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Real-Time Visualization Changes Everything
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Speed up your workflow and impress clients with instant, photorealistic results
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
                    {benefit.metrics}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From sketch to photorealistic render in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-World Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how real-time visualization transforms different aspects of architectural practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    {useCase.title}
                  </CardTitle>
                  <CardDescription className="text-base ml-9">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="ml-9">
                  <div className="text-sm font-medium text-primary">
                    ✓ {useCase.benefit}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10x</div>
              <div className="text-muted-foreground">Faster than traditional</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">90%</div>
              <div className="text-muted-foreground">Time saved on rendering</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5x</div>
              <div className="text-muted-foreground">More design iterations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">Client satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Experience Real-Time Visualization Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of architects who have transformed their workflow with AI-powered real-time rendering
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

