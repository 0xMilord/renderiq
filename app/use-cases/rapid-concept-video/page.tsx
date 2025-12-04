import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Video, Play, Zap, Film, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Rapid Concept Video Generation | AI Architectural Video | Renderiq",
  description: "Transform static renders into dynamic concept videos in minutes. Generate walkthrough animations, time-lapse sequences, or style transitions using Renderiq's video generation powered by Veo3.",
  keywords: [
    "architectural video",
    "concept video generation",
    "walkthrough animation",
    "architectural animation",
    "Veo3 video",
    "AI video generation",
    "architectural motion graphics",
    "AI architectural video",
    "architectural walkthrough AI"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/rapid-concept-video`,
  },
  openGraph: {
    title: "Rapid Concept Video Generation | AI Architectural Video | Renderiq",
    description: "Transform static renders into dynamic concept videos in minutes. Generate walkthrough animations, time-lapse sequences, or style transitions.",
    type: "website",
    url: `${siteUrl}/use-cases/rapid-concept-video`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-rapid-concept-video.jpg`,
        width: 1200,
        height: 630,
        alt: "Rapid Concept Video Generation - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rapid Concept Video Generation | Renderiq",
    description: "Transform static renders into dynamic concept videos in minutes. Generate walkthrough animations and time-lapse sequences.",
    images: [`${siteUrl}/og/use-cases-rapid-concept-video.jpg`],
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
    icon: Play,
    title: "30s to 5min Videos",
    description: "Generate videos ranging from 30 seconds to 5 minutes, perfect for presentations and social media.",
    metric: "Multiple durations"
  },
  {
    icon: Zap,
    title: "Multiple Models",
    description: "Choose between Veo3 (higher quality) or Veo3 Fast (faster generation) depending on your timeline.",
    metric: "Flexible quality"
  },
  {
    icon: Film,
    title: "Multiple Types",
    description: "Support for text-to-video, image-to-video, and keyframe-sequence generation types.",
    metric: "Versatile creation"
  },
  {
    icon: Video,
    title: "Dynamic Content",
    description: "Transform static architectural visualization into engaging, dynamic content.",
    metric: "Better engagement"
  }
];

const useCases = [
  {
    title: "Client Presentations",
    description: "Create dynamic walkthrough videos that better communicate spatial experience and design intent.",
    benefit: "Enhanced presentations"
  },
  {
    title: "Social Media Content",
    description: "Generate engaging video content for Instagram, LinkedIn, and other platforms.",
    benefit: "Higher engagement"
  },
  {
    title: "Marketing Materials",
    description: "Create promotional videos for real estate, architecture firms, and design studios.",
    benefit: "Professional marketing"
  },
  {
    title: "Design Documentation",
    description: "Document design evolution through time-lapse sequences and style transitions.",
    benefit: "Visual storytelling"
  }
];

export default function RapidConceptVideoPage() {
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

      <section className="py-20 px-4 bg-gradient-to-b from-red-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full mb-6">
              <Video className="w-4 h-4" />
              <span className="text-sm font-medium">Video Generation</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rapid Concept Video Generation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Create dynamic architectural visualizations by generating videos from your renders or sketches. Upload a render 
              and use Renderiq's video generation (powered by Google Veo3) to create walkthrough animations, time-lapse sequences, 
              or style transitions.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Creating Videos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Rapid Concept Video Generation Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Create dynamic architectural visualizations by generating videos from your renders or sketches. Upload a render 
                and use Renderiq's video generation (powered by Google Veo3) to create walkthrough animations, time-lapse sequences, 
                or style transitions. Choose between Veo3 (higher quality) or Veo3 Fast (faster generation) models depending on your timeline.
              </p>
              <p className="text-lg text-muted-foreground">
                Videos can range from 30 seconds to 5 minutes, perfect for client presentations, social media content, or marketing 
                materials. The platform supports text-to-video, image-to-video, and keyframe-sequence generation types, giving you 
                flexibility in how you create motion. Use render chains to track video iterations and maintain consistency across 
                sequences. This capability transforms static architectural visualization into engaging, dynamic content that better 
                communicates spatial experience and design intent.
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
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-red-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
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
            Start Creating Videos Today
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

