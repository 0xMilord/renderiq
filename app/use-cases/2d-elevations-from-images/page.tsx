import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Layers, Camera, FileText, CheckCircle2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "2D Elevations from Images | Facade to Elevation Drawing | Renderiq",
  description: "Transform photographs or sketches of building facades into clean, professional 2D elevation drawings. Perfect for documentation, analysis, and presentation purposes.",
  keywords: [
    "2D elevations",
    "elevation drawings",
    "facade to elevation",
    "architectural elevations",
    "building elevations",
    "elevation documentation",
    "AI elevation drawings",
    "photo to elevation AI"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/2d-elevations-from-images`,
  },
  openGraph: {
    title: "2D Elevations from Images | Facade to Elevation Drawing | Renderiq",
    description: "Transform photographs or sketches of building facades into clean, professional 2D elevation drawings.",
    type: "website",
    url: `${siteUrl}/use-cases/2d-elevations-from-images`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-2d-elevations-from-images.jpg`,
        width: 1200,
        height: 630,
        alt: "2D Elevations from Images - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "2D Elevations from Images | Renderiq",
    description: "Transform photographs or sketches of building facades into clean, professional 2D elevation drawings.",
    images: [`${siteUrl}/og/use-cases-2d-elevations-from-images.jpg`],
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
    title: "Photo to Drawing",
    description: "Convert photographs of building facades into clean architectural elevation drawings.",
    metric: "Instant conversion"
  },
  {
    icon: Ruler,
    title: "Maintains Proportions",
    description: "AI recognizes architectural elements and maintains accurate proportions in elevation drawings.",
    metric: "Accurate proportions"
  },
  {
    icon: FileText,
    title: "Professional Documentation",
    description: "Create clean, professional elevation drawings suitable for presentations and planning submissions.",
    metric: "Presentation ready"
  },
  {
    icon: Layers,
    title: "Multiple Facades",
    description: "Generate elevations for multiple building faces and maintain consistency across views.",
    metric: "Consistent documentation"
  }
];

const useCases = [
  {
    title: "Existing Building Documentation",
    description: "Document existing buildings by converting site photos into professional elevation drawings.",
    benefit: "Fast documentation"
  },
  {
    title: "Planning Submissions",
    description: "Create elevation drawings from conceptual sketches for planning authority submissions.",
    benefit: "Professional submissions"
  },
  {
    title: "Design Presentations",
    description: "Generate clean elevation drawings from site photos for client presentations.",
    benefit: "Clear communication"
  },
  {
    title: "Historic Preservation",
    description: "Document historic buildings by converting photographs into technical elevation drawings.",
    benefit: "Preservation documentation"
  }
];

export default function TwoDElevationsFromImagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-indigo-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full mb-6">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Elevation Drawings</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              2D Elevations from Images
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Upload photographs of building facades, architectural sketches, or existing elevation drawings and use Renderiq 
              to generate clean, professional 2D elevation visualizations. The AI recognizes architectural elements like windows, 
              doors, materials, and proportions, creating accurate elevation representations.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Creating Elevations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How 2D Elevation Generation Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Upload photographs of building facades, architectural sketches, or existing elevation drawings and use Renderiq 
                to generate clean, professional 2D elevation visualizations. The AI recognizes architectural elements like windows, 
                doors, materials, and proportions, creating accurate elevation representations.
              </p>
              <p className="text-lg text-muted-foreground">
                Use prompts like 'create a clean architectural elevation drawing' or 'convert to technical elevation view' to guide 
                the output style. This is perfect for documenting existing buildings, creating presentation materials from site photos, 
                or generating elevation studies from conceptual sketches. The platform maintains architectural accuracy while producing 
                clean, professional drawings suitable for client presentations, planning submissions, or design documentation. Use render 
                chains to refine elevation details and ensure consistency across multiple building faces.
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
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
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
            Start Creating Elevations Today
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

