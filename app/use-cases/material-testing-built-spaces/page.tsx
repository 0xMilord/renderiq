import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, PaintBucket, Camera, Sun, CheckCircle2, Upload, Image as ImageIcon, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Material Testing in Built Spaces | AI Material Visualization | Renderiq",
  description: "Test how materials look and feel in actual built environments. Upload photos of existing spaces and experiment with different material combinations to see realistic results in context.",
  keywords: [
    "material testing built spaces",
    "material visualization",
    "renovation material testing",
    "existing space material testing",
    "material replacement AI",
    "contextual material testing",
    "real space visualization",
    "material selection built environment",
    "AI material testing",
    "architectural material selection"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/material-testing-built-spaces`,
  },
  openGraph: {
    title: "Material Testing in Built Spaces | AI Material Visualization | Renderiq",
    description: "Test how materials look and feel in actual built environments. Upload photos of existing spaces and experiment with different material combinations.",
    type: "website",
    url: `${siteUrl}/use-cases/material-testing-built-spaces`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Material Testing in Built Spaces - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Testing in Built Spaces | Renderiq",
    description: "Test how materials look in actual built environments. Upload photos and experiment with different material combinations.",
    images: [`${siteUrl}/og-image.jpg`],
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
    icon: Camera,
    title: "Real Context Testing",
    description: "Test materials in actual built spaces, not abstract renders. See how they work with existing lighting and conditions.",
    metric: "100% contextual accuracy"
  },
  {
    icon: Sun,
    title: "Lighting Interaction",
    description: "See how materials interact with natural and artificial light in your specific space.",
    metric: "Real lighting simulation"
  },
  {
    icon: ImageIcon,
    title: "Photo-Based Testing",
    description: "Upload photos of existing spaces and test material options without remodeling.",
    metric: "No construction needed"
  },
  {
    icon: Lightbulb,
    title: "Informed Decisions",
    description: "Make confident material choices by seeing options in your actual space before purchasing.",
    metric: "95% decision confidence"
  }
];

const workflow = [
  {
    step: 1,
    title: "Upload Space Photo",
    description: "Take or upload a photo of your existing built space—construction site, renovation project, or completed building"
  },
  {
    step: 2,
    title: "Describe Material Change",
    description: "Use natural language: 'replace the floor with light oak hardwood' or 'change wall to exposed brick'"
  },
  {
    step: 3,
    title: "Generate Material Test",
    description: "AI understands spatial relationships and applies materials realistically in context"
  },
  {
    step: 4,
    title: "Compare Options",
    description: "Use render chains to test multiple material combinations and compare side-by-side"
  }
];

const useCases = [
  {
    title: "Renovation Projects",
    description: "Test material options for renovations before committing. See how new materials complement existing elements.",
    benefit: "Perfect material matching"
  },
  {
    title: "Material Selection Meetings",
    description: "Present multiple material options to clients in context. Make decisions faster with realistic visualizations.",
    benefit: "Faster approvals"
  },
  {
    title: "Construction Sites",
    description: "Test material options during construction. Make adjustments before installation.",
    benefit: "Reduce change orders"
  },
  {
    title: "Historic Preservation",
    description: "Test period-appropriate materials or modern alternatives that complement historic context.",
    benefit: "Contextual harmony"
  }
];

export default function MaterialTestingBuiltSpacesPage() {
  const pageUrl = `${siteUrl}/use-cases/material-testing-built-spaces`;
  
  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Material Testing in Built Spaces',
    description: 'Test how materials look and feel in actual built environments. Upload photos of existing spaces and experiment with different material combinations.',
    url: pageUrl,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'Renderiq', url: siteUrl },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: `${siteUrl}/use-cases` },
      { '@type': 'ListItem', position: 3, name: 'Material Testing in Built Spaces', item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Script id="webpage-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }} />
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Link href="/use-cases" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Use Cases
          </Link>
        </div>
      </div>

      <section className="py-20 px-4 bg-gradient-to-b from-purple-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full mb-6">
              <PaintBucket className="w-4 h-4" />
              <span className="text-sm font-medium">Material Testing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Material Testing in Built Spaces
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload photos of existing built spaces—whether construction sites, renovation projects, or completed buildings—and use 
              Renderiq's material testing capabilities to visualize different material options in context.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Testing Materials
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
              How Material Testing in Built Spaces Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload photos of existing built spaces—whether construction sites, renovation projects, or completed buildings—and use 
                Renderiq's material testing capabilities to visualize different material options in context. The AI understands spatial 
                relationships and lighting conditions, allowing you to see how materials interact with natural and artificial light.
              </p>
              <p className="text-lg text-muted-foreground">
                Use descriptive prompts like 'replace the floor with light oak hardwood' or 'change the wall finish to exposed brick' 
                to test material combinations. Render chains automatically track your material explorations, making it easy to compare 
                options and present alternatives to clients. This is invaluable for renovation projects, material selection meetings, 
                and ensuring materials work harmoniously in the actual space.
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
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Workflow</h2>
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
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
            Test Materials in Your Spaces Today
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

