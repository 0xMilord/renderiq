import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Palette, Focus, Layers, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Style Testing with White Renders | Clean Architectural Visualization | Renderiq",
  description: "Create clean, neutral white renders to test different architectural styles, forms, and compositions without material distractions. Perfect for focusing on spatial design and massing.",
  keywords: [
    "white renders",
    "neutral renders",
    "architectural style testing",
    "form visualization",
    "clean renders",
    "minimalist renders",
    "architectural composition",
    "white render architecture",
    "neutral architectural visualization"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/style-testing-white-renders`,
  },
  openGraph: {
    title: "Style Testing with White Renders | Clean Architectural Visualization | Renderiq",
    description: "Create clean, neutral white renders to test different architectural styles, forms, and compositions without material distractions.",
    type: "website",
    url: `${siteUrl}/use-cases/style-testing-white-renders`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-style-testing-white-renders.jpg`,
        width: 1200,
        height: 630,
        alt: "Style Testing with White Renders - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Style Testing with White Renders | Renderiq",
    description: "Create clean, neutral white renders to test different architectural styles and forms without material distractions.",
    images: [`${siteUrl}/og/use-cases-style-testing-white-renders.jpg`],
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
    icon: Focus,
    title: "Focus on Form",
    description: "Emphasize architectural form, spatial relationships, and composition without material distractions.",
    metric: "Pure design focus"
  },
  {
    icon: Palette,
    title: "Style Exploration",
    description: "Test different architectural styles and design approaches cleanly and professionally.",
    metric: "Unlimited style tests"
  },
  {
    icon: Layers,
    title: "Professional Presentation",
    description: "Create clean, minimalist visualizations perfect for design reviews and presentations.",
    metric: "Presentation ready"
  },
  {
    icon: Sparkles,
    title: "Consistent Aesthetic",
    description: "Apply consistent white render style across multiple views for cohesive communication.",
    metric: "Visual coherence"
  }
];

const useCases = [
  {
    title: "Early Design Development",
    description: "Focus on architectural form and composition during early design stages without material decisions.",
    benefit: "Clear design intent"
  },
  {
    title: "Style Comparison",
    description: "Compare different architectural styles and design approaches side-by-side with neutral renders.",
    benefit: "Objective comparison"
  },
  {
    title: "Design Reviews",
    description: "Present clean, professional visualizations that emphasize architecture over finishes.",
    benefit: "Professional presentation"
  },
  {
    title: "Massing Studies",
    description: "Test building massing and form relationships without material or color distractions.",
    benefit: "Pure form analysis"
  }
];

export default function StyleTestingWhiteRendersPage() {
  const pageUrl = `${siteUrl}/use-cases/style-testing-white-renders`;
  
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Create Style Testing White Renders',
    description: 'Learn how to create clean, neutral white renders to test different architectural styles, forms, and compositions without material distractions.',
    image: `${siteUrl}/og/use-cases-style-testing-white-renders.jpg`,
    totalTime: 'PT5M',
    estimatedCost: { currency: 'USD', value: '0' },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Architectural Sketch or Design' }
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Upload Your Design',
        text: 'Upload your architectural sketch, floor plan, or design to the Renderiq platform.',
        url: `${pageUrl}#step-1`
      },
      {
        '@type': 'HowToStep',
        name: 'Select White Render Style',
        text: 'Choose the white render style option to create clean, neutral visualizations without material distractions.',
        url: `${pageUrl}#step-2`
      },
      {
        '@type': 'HowToStep',
        name: 'Generate White Render',
        text: 'AI generates a clean white render that emphasizes form, spatial relationships, and composition.',
        url: `${pageUrl}#step-3`
      },
      {
        '@type': 'HowToStep',
        name: 'Test Different Styles',
        text: 'Use render chains to test multiple architectural styles and design approaches with consistent white render aesthetic.',
        url: `${pageUrl}#step-4`
      }
    ]
  });
  
  return (
    <>
      <JsonLd data={howToSchema} />
      <div className="min-h-screen bg-background">
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-gray-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full mb-6">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">White Renders</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Style Testing with White Renders
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate white or neutral renders by specifying 'white render' or 'neutral material palette' in your prompts. 
              This creates clean, minimalist visualizations that emphasize architectural form, spatial relationships, and composition.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Creating White Renders
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How White Render Style Testing Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Generate white or neutral renders by specifying 'white render' or 'neutral material palette' in your prompts. 
                This creates clean, minimalist visualizations that emphasize architectural form, spatial relationships, and 
                composition without material distractions.
              </p>
              <p className="text-lg text-muted-foreground">
                Perfect for early design development, style exploration, and client presentations where you want to focus on 
                the architecture itself rather than finishes. Upload sketches or models and request white renders to test 
                different design approaches, compare massing options, or create professional presentation graphics. The platform's 
                style transfer capabilities let you apply consistent white render aesthetics across multiple views, ensuring cohesive 
                visual communication. Use render chains to explore variations while maintaining the clean aesthetic.
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
                  <div className="w-12 h-12 rounded-lg bg-gray-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-gray-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
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
            Start Creating White Renders
          </h2>
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

