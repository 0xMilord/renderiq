import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, FileText, Zap, CheckCircle2, Upload, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Instant Floor Plan Renders | 2D to 3D Floor Plan Visualization | Renderiq",
  description: "Convert 2D floor plans into stunning 3D visualizations instantly. Upload PDF, CAD, or image floor plans and generate photorealistic interior or exterior renders in under a minute.",
  keywords: [
    "floor plan renders",
    "2D to 3D floor plan",
    "floor plan visualization",
    "instant floor plan rendering",
    "CAD floor plan render",
    "PDF floor plan render",
    "architectural floor plan AI",
    "AI floor plan rendering",
    "floor plan to render AI"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/instant-floor-plan-renders`,
  },
  openGraph: {
    title: "Instant Floor Plan Renders | 2D to 3D Visualization | Renderiq",
    description: "Convert 2D floor plans into stunning 3D visualizations instantly. Upload PDF, CAD, or image floor plans and generate photorealistic renders in under a minute.",
    type: "website",
    url: `${siteUrl}/use-cases/instant-floor-plan-renders`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-instant-floor-plan-renders.jpg`,
        width: 1200,
        height: 630,
        alt: "Instant Floor Plan Renders - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instant Floor Plan Renders | Renderiq",
    description: "Convert 2D floor plans into stunning 3D visualizations instantly. Generate photorealistic renders in under a minute.",
    images: [`${siteUrl}/og/use-cases-instant-floor-plan-renders.jpg`],
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
    title: "30-60 Second Generation",
    description: "Transform floor plans into photorealistic renders in under a minute. No 3D modeling required.",
    metric: "60x faster than traditional"
  },
  {
    icon: FileText,
    title: "Multiple Formats",
    description: "Upload PDF, PNG, JPG, or CAD exports. Renderiq works with any floor plan format.",
    metric: "All formats supported"
  },
  {
    icon: Building2,
    title: "Spatial Accuracy",
    description: "Maintains your plan's proportions and spatial relationships while adding realistic materials.",
    metric: "100% proportion accuracy"
  },
  {
    icon: Clock,
    title: "Client Ready",
    description: "Generate presentation-quality renders perfect for client meetings and marketing materials.",
    metric: "Instant presentations"
  }
];

const workflow = [
  {
    step: 1,
    title: "Upload Floor Plan",
    description: "Drag and drop your floor plan (PDF, PNG, JPG, or CAD export) into the unified chat interface"
  },
  {
    step: 2,
    title: "Describe Vision",
    description: "Use natural language: 'modern minimalist interior with light wood floors and white walls'"
  },
  {
    step: 3,
    title: "Generate Render",
    description: "AI recognizes spatial relationships and generates photorealistic visualization in 30-60 seconds"
  },
  {
    step: 4,
    title: "Iterate & Refine",
    description: "Use render chains to refine specific rooms or areas through conversational iteration"
  }
];

const useCases = [
  {
    title: "Client Presentations",
    description: "Show clients how their space will look from 2D plans. Help them visualize spatial relationships and design intent.",
    benefit: "Better client understanding"
  },
  {
    title: "Real Estate Marketing",
    description: "Create stunning visualizations from floor plans for property listings and marketing materials.",
    benefit: "Higher engagement"
  },
  {
    title: "Interior Design",
    description: "Visualize furniture placement and material choices from floor plans before implementation.",
    benefit: "Perfect space planning"
  },
  {
    title: "Design Development",
    description: "Quickly explore design options from floor plans without detailed 3D modeling.",
    benefit: "Faster design iteration"
  }
];

export default function InstantFloorPlanRendersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Link href="/use-cases" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Use Cases
          </Link>
        </div>
      </div>

      <section className="py-20 px-4 bg-gradient-to-b from-green-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full mb-6">
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Floor Plan Rendering</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Instant Floor Plan Renders
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload your floor plan (PDF, PNG, JPG, or CAD exports) directly into the chat interface. Renderiq's architecture-aware 
              AI recognizes spatial relationships, room layouts, and scale indicators from your plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Rendering Floor Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Instant Floor Plan Rendering Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload your floor plan (PDF, PNG, JPG, or CAD exports) directly into the chat interface. Renderiq's architecture-aware 
                AI recognizes spatial relationships, room layouts, and scale indicators from your plan. Describe your vision using natural 
                language—for example, 'modern minimalist interior with light wood floors and white walls' or 'luxury residential space with 
                high-end finishes.'
              </p>
              <p className="text-lg text-muted-foreground">
                The platform generates photorealistic renders that maintain your plan's proportions while adding realistic materials, 
                furniture, and lighting. Use render chains to iterate on specific rooms or areas, refining details through conversation. 
                This workflow eliminates the need for complex 3D modeling software, making professional visualizations accessible to 
                architects, interior designers, and real estate professionals who work primarily with 2D plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Benefits</h2>
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

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple 4-Step Process</h2>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect For</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {useCase.benefit}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transform Your Floor Plans Today
          </h2>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Try It Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

