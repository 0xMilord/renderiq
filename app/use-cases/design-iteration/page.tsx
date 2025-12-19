import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Layers, GitBranch, Users2, History, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
}

export const metadata: Metadata = {
  title: "AI Design Iteration for Architecture | Version Control & A/B Testing | Renderiq",
  description: "Iterate architectural designs with unprecedented speed. AI-powered version control, A/B testing, and real-time design comparisons for architects. Track changes and explore alternatives effortlessly.",
  keywords: [
    "design iteration AI",
    "architectural version control",
    "design A/B testing",
    "architectural design comparison",
    "iterative design AI",
    "design exploration AI",
    "architectural alternatives",
    "design change tracking",
    "version comparison architecture",
    "rapid design iteration"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/use-cases/design-iteration`,
  },
  openGraph: {
    title: "AI Design Iteration for Architecture | Version Control & A/B Testing | Renderiq",
    description: "Iterate architectural designs with unprecedented speed. AI-powered version control, A/B testing, and real-time design comparisons.",
    type: "website",
    url: `${getSiteUrl()}/use-cases/design-iteration`,
    siteName: "Renderiq",
    images: [
      {
        url: `${getSiteUrl()}/og/use-cases-design-iteration.jpg`,
        width: 1200,
        height: 630,
        alt: "AI Design Iteration for Architecture - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Design Iteration for Architecture | Renderiq",
    description: "Iterate architectural designs with unprecedented speed. AI-powered version control and A/B testing.",
    images: [`${getSiteUrl()}/og/use-cases-design-iteration.jpg`],
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
    icon: GitBranch,
    title: "Version Control Built-In",
    description: "Automatically track every design iteration with full history and rollback capability.",
    metric: "Never lose a design version"
  },
  {
    icon: Layers,
    title: "A/B Testing for Designs",
    description: "Compare design alternatives side-by-side with objective visual analysis.",
    metric: "Test 10+ variants simultaneously"
  },
  {
    icon: Users2,
    title: "Client Comparison Tools",
    description: "Present multiple options with interactive comparison sliders and annotations.",
    metric: "3x faster client decisions"
  },
  {
    icon: History,
    title: "Change Tracking",
    description: "See exactly what changed between versions with visual diff tools.",
    metric: "100% transparent evolution"
  }
];

const features = [
  {
    title: "Design Branching",
    description: "Create multiple design branches from any point. Explore different directions without losing your original work.",
    icon: "🌳"
  },
  {
    title: "Visual Diff",
    description: "Instantly see differences between versions with highlighted changes and overlay comparisons.",
    icon: "🔍"
  },
  {
    title: "Collaborative Iterations",
    description: "Team members can create and compare iterations simultaneously with real-time sync.",
    icon: "👥"
  },
  {
    title: "Smart Suggestions",
    description: "AI suggests potential improvements and alternative approaches based on design goals.",
    icon: "💡"
  },
  {
    title: "Annotation System",
    description: "Add notes, comments, and decisions to each iteration for complete documentation.",
    icon: "📝"
  },
  {
    title: "Export All Versions",
    description: "Download complete iteration history for presentations, documentation, or portfolio.",
    icon: "📦"
  }
];

const workflow = [
  {
    step: 1,
    title: "Create Base Design",
    description: "Start with your initial concept or import existing work"
  },
  {
    step: 2,
    title: "Generate Variations",
    description: "AI creates multiple iterations based on your parameters"
  },
  {
    step: 3,
    title: "Compare & Refine",
    description: "View side-by-side comparisons and choose favorites"
  },
  {
    step: 4,
    title: "Iterate Further",
    description: "Branch from any version to explore new directions"
  }
];

const useCases = [
  {
    title: "Design Reviews",
    description: "Present comprehensive design evolution to review boards. Show how you arrived at the final solution with clear decision points.",
    stat: "90% approval rate"
  },
  {
    title: "Client Approvals",
    description: "Give clients confidence by showing multiple refined options. Let them compare and choose with full context.",
    stat: "50% fewer revision rounds"
  },
  {
    title: "Team Collaboration",
    description: "Multiple designers can work on alternatives simultaneously. Merge the best ideas into a final design.",
    stat: "3x more productive teams"
  },
  {
    title: "Design Documentation",
    description: "Automatically document your entire design process. Perfect for case studies, awards, and portfolio work.",
    stat: "Zero extra documentation work"
  }
];

export default function DesignIterationPage() {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/use-cases/design-iteration`;
  
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Iterate Architectural Designs with AI',
    description: 'Learn how to iterate architectural designs with unprecedented speed. Use AI-powered version control, A/B testing, and real-time design comparisons to track changes and explore alternatives.',
    image: `${siteUrl}/og/use-cases-design-iteration.jpg`,
    totalTime: 'PT5M',
    estimatedCost: { currency: 'USD', value: '0' },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Architectural Design' }
    ],
    step: workflow.map((w, index) => ({
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
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-green-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full mb-6">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Design Iteration</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Iterate Designs at Lightning Speed
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Make changes and explore alternatives with unprecedented speed. Built-in version control, 
              A/B testing, and visual comparison tools help you find the perfect design faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Iterating Free
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See Iterations in Action
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Professional Version Control for Designs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Iterate confidently knowing every version is saved and comparable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {benefit.metric}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Iteration Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to explore design alternatives efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              From concept to final design with effortless iteration
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
              Real-World Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How design iteration transforms the architectural process
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {useCase.stat}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-muted-foreground">Versions tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10x</div>
              <div className="text-muted-foreground">More iterations explored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50%</div>
              <div className="text-muted-foreground">Fewer revision cycles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Design history preserved</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Iterating Smarter Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join architects who are exploring more design options in less time
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Try It Free - Start Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

