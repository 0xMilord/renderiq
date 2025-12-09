import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileImage, Monitor, Printer, CheckCircle2, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Presentation Ready Graphics | HD & 4K Architectural Renders | Renderiq",
  description: "Generate high-quality, presentation-ready architectural graphics suitable for client meetings, design reviews, and professional portfolios. Export in HD or 4K resolution.",
  keywords: [
    "presentation graphics",
    "HD renders",
    "4K renders",
    "professional renders",
    "client presentations",
    "architectural graphics",
    "high resolution renders",
    "presentation quality renders",
    "4K architectural visualization"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/presentation-ready-graphics`,
  },
  openGraph: {
    title: "Presentation Ready Graphics | HD & 4K Architectural Renders | Renderiq",
    description: "Generate high-quality, presentation-ready architectural graphics suitable for client meetings, design reviews, and professional portfolios.",
    type: "website",
    url: `${siteUrl}/use-cases/presentation-ready-graphics`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-presentation-ready-graphics.jpg`,
        width: 1200,
        height: 630,
        alt: "Presentation Ready Graphics - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Presentation Ready Graphics | Renderiq",
    description: "Generate high-quality, presentation-ready architectural graphics suitable for client meetings and professional portfolios.",
    images: [`${siteUrl}/og/use-cases-presentation-ready-graphics.jpg`],
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
    icon: Monitor,
    title: "HD & 4K Export",
    description: "Export renders in HD (1920x1080) on free tier or 4K (3840x2160) with Pro subscriptions.",
    metric: "Multiple resolutions"
  },
  {
    icon: Highlighter,
    title: "Professional Quality",
    description: "Generate photorealistic outputs suitable for the most demanding presentation contexts.",
    metric: "Client-ready quality"
  },
  {
    icon: FileImage,
    title: "Consistent Style",
    description: "Use consistent style prompts across multiple renders to maintain visual coherence.",
    metric: "Visual consistency"
  },
  {
    icon: Printer,
    title: "Print & Digital",
    description: "Suitable for both digital presentations and high-quality print materials.",
    metric: "Universal compatibility"
  }
];

const useCases = [
  {
    title: "Client Presentations",
    description: "Create professional graphics for client meetings that accurately represent your design intent.",
    benefit: "Impressive presentations"
  },
  {
    title: "Design Reviews",
    description: "Generate high-quality renders for internal design reviews and stakeholder presentations.",
    benefit: "Clear communication"
  },
  {
    title: "Portfolio Development",
    description: "Build professional portfolios with consistent, high-quality architectural visualizations.",
    benefit: "Standout portfolios"
  },
  {
    title: "Marketing Materials",
    description: "Create marketing graphics for architecture firms, real estate, and design studios.",
    benefit: "Professional marketing"
  }
];

export default function PresentationReadyGraphicsPage() {
  const pageUrl = `${siteUrl}/use-cases/presentation-ready-graphics`;
  
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Create Presentation Ready Graphics',
    description: 'Learn how to generate high-quality, presentation-ready architectural graphics suitable for client meetings, design reviews, and professional portfolios. Export in HD or 4K resolution.',
    image: `${siteUrl}/og/use-cases-presentation-ready-graphics.jpg`,
    totalTime: 'PT5M',
    estimatedCost: { currency: 'USD', value: '0' },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Architectural Design or Sketch' }
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Create Your Render',
        text: 'Upload your design or sketch and generate a photorealistic render using Renderiq AI.',
        url: `${pageUrl}#step-1`
      },
      {
        '@type': 'HowToStep',
        name: 'Select Resolution',
        text: 'Choose your export resolution: HD (1920x1080) on free tier or 4K (3840x2160) with Pro subscriptions.',
        url: `${pageUrl}#step-2`
      },
      {
        '@type': 'HowToStep',
        name: 'Apply Consistent Style',
        text: 'Use consistent style prompts across multiple renders to maintain visual coherence in your presentation.',
        url: `${pageUrl}#step-3`
      },
      {
        '@type': 'HowToStep',
        name: 'Export and Present',
        text: 'Export your high-quality render suitable for digital presentations, print materials, or professional portfolios.',
        url: `${pageUrl}#step-4`
      }
    ]
  });
  
  return (
    <>
      <JsonLd data={howToSchema} />
      <div className="min-h-screen bg-background">
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-teal-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full mb-6">
              <FileImage className="w-4 h-4" />
              <span className="text-sm font-medium">Presentation Graphics</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Presentation Ready Graphics
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create presentation-ready graphics by leveraging Renderiq's high-quality rendering capabilities. The platform generates 
              photorealistic outputs suitable for client presentations, design reviews, and professional portfolios.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Creating Graphics
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Presentation Graphics Work
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Create presentation-ready graphics by leveraging Renderiq's high-quality rendering capabilities. The platform generates 
                photorealistic outputs suitable for client presentations, design reviews, and professional portfolios. Choose from Standard 
                (1 credit), High (2 credits), or Ultra (3 credits) quality settings depending on your needs.
              </p>
              <p className="text-lg text-muted-foreground">
                Export renders in HD (1920x1080) on the free tier or 4K (3840x2160) with Pro subscriptions, ensuring your graphics are 
                ready for both digital presentations and print materials. Use consistent style prompts across multiple renders to maintain 
                visual coherence in presentations. Render chains help you organize presentation sequences, making it easy to build narrative 
                flows for client meetings. The platform's architecture-aware AI ensures professional quality outputs that accurately represent 
                your design intent, suitable for the most demanding presentation contexts.
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
                  <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-teal-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-teal-600 dark:text-teal-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full text-sm font-medium">
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
            Start Creating Presentation Graphics
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

