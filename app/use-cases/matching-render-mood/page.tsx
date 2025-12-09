import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Palette, Sparkles, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from '@/components/seo/json-ld';
import { generateHowToSchema } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Matching Render Mood to References | Style Transfer Architecture | Renderiq",
  description: "Use reference images to match specific moods, styles, or atmospheres in your renders. Upload inspiration images and generate renders that capture the same lighting, color palette, and aesthetic.",
  keywords: [
    "style transfer",
    "mood matching",
    "reference images",
    "architectural style transfer",
    "mood rendering",
    "aesthetic matching",
    "inspiration rendering",
    "AI style transfer architecture",
    "mood-based rendering"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/matching-render-mood`,
  },
  openGraph: {
    title: "Matching Render Mood to References | Style Transfer Architecture | Renderiq",
    description: "Use reference images to match specific moods, styles, or atmospheres in your renders. Capture the same lighting, color palette, and aesthetic.",
    type: "website",
    url: `${siteUrl}/use-cases/matching-render-mood`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-matching-render-mood.jpg`,
        width: 1200,
        height: 630,
        alt: "Matching Render Mood to References - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matching Render Mood to References | Renderiq",
    description: "Use reference images to match specific moods, styles, or atmospheres in your renders.",
    images: [`${siteUrl}/og/use-cases-matching-render-mood.jpg`],
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
    icon: ImageIcon,
    title: "Style Transfer",
    description: "Upload reference images and apply their mood, lighting, and aesthetic to your architectural renders.",
    metric: "Perfect mood matching"
  },
  {
    icon: Palette,
    title: "Lighting & Color",
    description: "Match lighting conditions, color palettes, and overall atmosphere from reference imagery.",
    metric: "Accurate atmosphere"
  },
  {
    icon: Layers,
    title: "Consistent Language",
    description: "Maintain consistent visual language across a project by matching reference aesthetics.",
    metric: "Visual coherence"
  },
  {
    icon: Sparkles,
    title: "Learn from Inspiration",
    description: "Bridge the gap between inspiration and execution by matching successful architectural photography.",
    metric: "Inspiration to reality"
  }
];

const useCases = [
  {
    title: "Brand Consistency",
    description: "Maintain consistent visual language across projects by matching brand reference aesthetics.",
    benefit: "Cohesive branding"
  },
  {
    title: "Learning from Photography",
    description: "Study successful architectural photography and apply those techniques to your renders.",
    benefit: "Professional quality"
  },
  {
    title: "Mood Exploration",
    description: "Test different moods and atmospheres by matching various reference image aesthetics.",
    benefit: "Creative exploration"
  },
  {
    title: "Client References",
    description: "Match client-provided reference images to create renders that meet their aesthetic expectations.",
    benefit: "Client satisfaction"
  }
];

export default function MatchingRenderMoodPage() {
  const pageUrl = `${siteUrl}/use-cases/matching-render-mood`;
  
  // HowTo schema for featured snippet optimization
  const howToSchema = generateHowToSchema({
    name: 'How to Match Render Mood to Reference Images',
    description: 'Learn how to use reference images to match specific moods, styles, or atmospheres in your renders. Upload inspiration images and generate renders that capture the same lighting, color palette, and aesthetic.',
    image: `${siteUrl}/og/use-cases-matching-render-mood.jpg`,
    totalTime: 'PT5M',
    estimatedCost: { currency: 'USD', value: '0' },
    tool: [
      { '@type': 'HowToTool', name: 'Renderiq AI Platform' },
      { '@type': 'HowToTool', name: 'Reference Image' },
      { '@type': 'HowToTool', name: 'Architectural Design or Sketch' }
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Upload Reference Image',
        text: 'Upload a reference image that captures the mood, lighting, color palette, or aesthetic you want to match.',
        url: `${pageUrl}#step-1`
      },
      {
        '@type': 'HowToStep',
        name: 'Upload Your Design',
        text: 'Upload your architectural design or sketch that you want to render with the reference mood.',
        url: `${pageUrl}#step-2`
      },
      {
        '@type': 'HowToStep',
        name: 'Request Mood Matching',
        text: 'Use natural language to request mood matching: "match the lighting and mood of the reference image" or "apply the same aesthetic".',
        url: `${pageUrl}#step-3`
      },
      {
        '@type': 'HowToStep',
        name: 'Generate and Refine',
        text: 'AI generates a render that matches the reference mood, lighting, and color palette. Use render chains to refine and maintain consistency.',
        url: `${pageUrl}#step-4`
      }
    ]
  });
  
  return (
    <>
      <JsonLd data={howToSchema} />
      <div className="min-h-screen bg-background">
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-amber-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full mb-6">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Mood Matching</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Matching Render Mood to References
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload reference images—whether architectural photography, renderings, or mood boards—and use Renderiq's style 
              transfer capabilities to match the mood, lighting, color palette, and aesthetic in your renders.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Matching Moods
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Mood Matching Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload reference images—whether architectural photography, renderings, or mood boards—and use Renderiq's style 
                transfer capabilities to match the mood, lighting, color palette, and aesthetic in your renders. The platform 
                analyzes reference images to understand lighting conditions, material qualities, color schemes, and overall atmosphere, 
                then applies these characteristics to your architectural visualizations.
              </p>
              <p className="text-lg text-muted-foreground">
                Use prompts like 'match the mood of this reference' or 'apply the lighting style from the uploaded image' to guide 
                the generation. This is perfect for maintaining consistent visual language across a project, learning from successful 
                architectural photography, or creating renders that match specific brand aesthetics. Render chains help you refine the 
                mood matching, ensuring your renders capture the essence of your reference while maintaining architectural accuracy. 
                This capability bridges the gap between inspiration and execution, helping you create renders that evoke the same 
                emotional response as your reference imagery.
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
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
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
            Start Matching Moods Today
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

