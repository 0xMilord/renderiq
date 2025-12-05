import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Boxes, Map, Building2, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Massing Testing | Building Massing Studies | Renderiq",
  description: "Test different building massing options quickly. Upload site plans or sketches and generate multiple massing studies to explore form, scale, and relationship to context.",
  keywords: [
    "massing testing",
    "building massing",
    "massing studies",
    "urban design massing",
    "architectural form testing",
    "site planning massing",
    "AI massing studies",
    "building form testing"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/massing-testing`,
  },
  openGraph: {
    title: "Massing Testing | Building Massing Studies | Renderiq",
    description: "Test different building massing options quickly. Upload site plans or sketches and generate multiple massing studies.",
    type: "website",
    url: `${siteUrl}/use-cases/massing-testing`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-massing-testing.jpg`,
        width: 1200,
        height: 630,
        alt: "Massing Testing - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Massing Testing | Renderiq",
    description: "Test different building massing options quickly. Generate multiple massing studies to explore form and scale.",
    images: [`${siteUrl}/og/use-cases-massing-testing.jpg`],
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
    title: "Rapid Exploration",
    description: "Generate multiple massing studies quickly to explore different building volumes and configurations.",
    metric: "10+ options per hour"
  },
  {
    icon: Map,
    title: "Context-Aware",
    description: "AI understands urban context, scale relationships, and architectural form for realistic massing.",
    metric: "Contextual accuracy"
  },
  {
    icon: Building2,
    title: "Form Focus",
    description: "Use white or neutral renders to focus purely on form and massing without material distractions.",
    metric: "Pure form analysis"
  },
  {
    icon: Boxes,
    title: "Multiple Options",
    description: "Compare different massing iterations side-by-side to present options to clients or planning authorities.",
    metric: "Easy comparison"
  }
];

const useCases = [
  {
    title: "Urban Design",
    description: "Explore different building volumes and heights for urban design projects and master planning.",
    benefit: "Better urban integration"
  },
  {
    title: "Architectural Competitions",
    description: "Quickly visualize competition entries with different massing approaches before finalizing.",
    benefit: "Faster competition prep"
  },
  {
    title: "Planning Submissions",
    description: "Present multiple massing options to planning authorities and stakeholders.",
    benefit: "Better approvals"
  },
  {
    title: "Site Analysis",
    description: "Test how different building masses work with site constraints and opportunities.",
    benefit: "Optimal site use"
  }
];

export default function MassingTestingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full mb-6">
              <Boxes className="w-4 h-4" />
              <span className="text-sm font-medium">Massing Studies</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Massing Testing
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload site plans, aerial views, or context sketches and use Renderiq to generate multiple massing studies. 
              The AI understands urban context, scale relationships, and architectural form, allowing you to explore different 
              building volumes, heights, and configurations quickly.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Massing Studies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Massing Testing Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload site plans, aerial views, or context sketches and use Renderiq to generate multiple massing studies. 
                The AI understands urban context, scale relationships, and architectural form, allowing you to explore different 
                building volumes, heights, and configurations quickly.
              </p>
              <p className="text-lg text-muted-foreground">
                Describe massing options like 'tower with podium base' or 'low-rise courtyard building' and generate variations 
                to compare. Use white or neutral renders to focus purely on form and massing without material distractions. Render 
                chains help you track different massing iterations, making it easy to present options to clients or planning authorities. 
                This workflow is essential for early-stage urban design, master planning, and architectural competitions where you need 
                to explore multiple form options rapidly before committing to detailed design development.
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
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
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
            Start Massing Testing Today
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

