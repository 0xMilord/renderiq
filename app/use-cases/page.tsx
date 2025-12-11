import { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  Zap, 
  Layers, 
  PaintBucket, 
  Building2, 
  Users, 
  Home, 
  School,
  Hotel,
  Warehouse,
  TreePine,
  ArrowRight,
  CheckCircle2,
  Eye,
  LayoutGrid,
  Palette,
  Video,
  Boxes,
  FileImage,
  Share2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { primaryUseCases, industryUseCases } from "@/lib/data/use-cases";
import { JsonLd } from '@/components/seo/json-ld';
import { getToolBySlug } from '@/lib/tools/registry';

export const metadata: Metadata = {
  title: "AI Architecture Use Cases | Concept Renders, Floor Plans, Videos & More | Renderiq",
  description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, video generation, massing studies, elevations, presentation graphics, social media content, and mood matching. Transform your architectural workflow with Renderiq.",
  keywords: [
    "AI architecture",
    "architectural visualization AI",
    "AI rendering architecture",
    "real-time architectural visualization",
    "AI interior design",
    "architectural design AI",
    "building design AI",
    "AI architectural rendering",
    "rapid prototyping architecture",
    "material testing AI",
    "architectural AI software",
    "AI exterior design",
    "AI site planning",
    "generative design architecture",
    "3D architectural rendering AI",
    "architectural visualization software",
    "AI for architects",
    "machine learning architecture",
    "automated design architecture",
    "computational design"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/use-cases`,
  },
  openGraph: {
    title: "AI Architecture Use Cases - Transform Your Design Workflow",
    description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, video generation, massing studies, elevations, presentation graphics, social media content, and mood matching.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/use-cases`,
    siteName: "Renderiq",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/og/use-cases.jpg`,
        width: 1200,
        height: 630,
        alt: "AI Architecture Use Cases - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Architecture Use Cases - Transform Your Design Workflow",
    description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, and more.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/og/use-cases.jpg`],
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

const features = [
  {
    title: "Interior Design AI",
    description: "Transform interior spaces with intelligent furniture placement, lighting, and material suggestions.",
    keywords: ["AI interior design", "furniture AI", "space planning"]
  },
  {
    title: "Exterior Visualization",
    description: "Create stunning building facades with realistic materials, lighting, and environmental context.",
    keywords: ["exterior rendering", "building facade AI", "architectural rendering"]
  },
  {
    title: "Site Planning",
    description: "Optimize site layouts with AI-powered analysis of terrain, orientation, and urban context.",
    keywords: ["site planning AI", "urban design", "landscape architecture"]
  },
  {
    title: "Lighting Simulation",
    description: "Accurate daylighting and artificial lighting analysis for any time and season.",
    keywords: ["lighting simulation", "daylight analysis", "architectural lighting"]
  }
];

export default function UseCasesPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
  const allUseCases = [...primaryUseCases];
  
  // CollectionPage schema for use cases listing
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Architecture Use Cases',
    description: 'A collection of powerful AI architecture use cases including concept renders, material testing, floor plan visualization, video generation, massing studies, elevations, presentation graphics, social media content, and mood matching.',
    url: `${siteUrl}/use-cases`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: allUseCases.length,
      itemListElement: allUseCases.map((useCase, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          name: useCase.title,
          description: useCase.description,
          url: `${siteUrl}/use-cases/${useCase.slug}`,
        },
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      url: siteUrl,
    },
  };
  
  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              AI Architecture Use Cases
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover 10 powerful ways to transform your architectural workflow with AI. From concept renders and floor plans 
              to video generation and presentation graphics—explore how Renderiq accelerates every stage of your design process.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">Concept Renders</span>
              <span className="px-3 py-1 bg-muted rounded-full">Floor Plans</span>
              <span className="px-3 py-1 bg-muted rounded-full">Video Generation</span>
              <span className="px-3 py-1 bg-muted rounded-full">Material Testing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              10 Essential AI Architecture Use Cases
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From early concept visualization to final presentation graphics—explore how Renderiq transforms every stage of your architectural workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {primaryUseCases.map((useCase) => {
              const relatedTools = (useCase as any).relatedTools || [];
              const toolCount = relatedTools.length;
              
              return (
                <Card key={useCase.slug} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${useCase.bgColor} flex items-center justify-center mb-4`}>
                      <useCase.icon className={`w-6 h-6 ${useCase.color}`} />
                    </div>
                    <CardTitle className="text-2xl mb-2">{useCase.title}</CardTitle>
                    <CardDescription className="text-base">
                      {useCase.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {useCase.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-5 h-5 ${useCase.color} mt-0.5 flex-shrink-0`} />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Related Tools Preview */}
                    {toolCount > 0 && (
                      <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-foreground">Related Tools</span>
                          <Badge variant="secondary">{toolCount} {toolCount === 1 ? 'tool' : 'tools'}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {relatedTools.slice(0, 3).map((toolSlug: string) => {
                            const tool = getToolBySlug(toolSlug);
                            if (!tool || tool.status !== 'online') return null;
                            return (
                              <Link 
                                key={toolSlug}
                                href={`/apps/${toolSlug}`}
                                className="text-xs px-2 py-1 bg-background border rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {tool.name}
                              </Link>
                            );
                          })}
                          {toolCount > 3 && (
                            <span className="text-xs px-2 py-1 text-muted-foreground">
                              +{toolCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Link href={`/use-cases/${useCase.slug}`}>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Industry-Specific Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Industry-Specific Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored AI solutions for every architectural sector
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industryUseCases.map((industry) => (
              <Card key={industry.slug} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <industry.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{industry.title}</CardTitle>
                  <CardDescription>{industry.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {industry.applications.map((app, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {app}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/use-cases/${industry.slug}`} className="mt-4 inline-block">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                      Explore {industry.title}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete AI Design Suite
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern architectural visualization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.keywords.map((keyword, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Design Process?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of architects and designers using AI to create stunning visualizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

