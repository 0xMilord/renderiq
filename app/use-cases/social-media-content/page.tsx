import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Share2, Instagram, Linkedin, Twitter, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Social Media Content | Architectural Social Media Graphics | Renderiq",
  description: "Create engaging architectural content for social media platforms. Generate square, portrait, or landscape formats optimized for Instagram, LinkedIn, Twitter, and other platforms.",
  keywords: [
    "social media content",
    "architectural social media",
    "Instagram architecture",
    "LinkedIn architecture",
    "social media graphics",
    "architectural content creation",
    "architecture social media",
    "architectural Instagram content"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/social-media-content`,
  },
  openGraph: {
    title: "Social Media Content | Architectural Social Media Graphics | Renderiq",
    description: "Create engaging architectural content for social media platforms. Generate formats optimized for Instagram, LinkedIn, Twitter, and more.",
    type: "website",
    url: `${siteUrl}/use-cases/social-media-content`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Social Media Content - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Media Content | Renderiq",
    description: "Create engaging architectural content for social media platforms. Optimized for Instagram, LinkedIn, Twitter, and more.",
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
    icon: Instagram,
    title: "Platform Optimized",
    description: "Generate content in formats optimized for Instagram (1:1), Stories (9:16), LinkedIn (16:9), and more.",
    metric: "All platforms supported"
  },
  {
    icon: Zap,
    title: "Quick Generation",
    description: "Create engaging visual content in 30-60 seconds without traditional rendering overhead.",
    metric: "30-60 second creation"
  },
  {
    icon: Share2,
    title: "Consistent Brand",
    description: "Maintain consistent visual style across your social media feed using render chains.",
    metric: "Cohesive branding"
  },
  {
    icon: Twitter,
    title: "High Engagement",
    description: "Create compelling visuals that tell your design story effectively and engage audiences.",
    metric: "Better engagement"
  }
];

const useCases = [
  {
    title: "Architecture Firms",
    description: "Showcase firm projects and design work on social media to attract clients and talent.",
    benefit: "Brand visibility"
  },
  {
    title: "Individual Architects",
    description: "Build personal brand and portfolio presence through consistent social media content.",
    benefit: "Professional presence"
  },
  {
    title: "Real Estate Marketing",
    description: "Create engaging property visualizations for social media marketing campaigns.",
    benefit: "Higher engagement"
  },
  {
    title: "Design Studios",
    description: "Share design process, concepts, and completed projects with your audience.",
    benefit: "Audience growth"
  }
];

export default function SocialMediaContentPage() {
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

      <section className="py-20 px-4 bg-gradient-to-b from-pink-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full mb-6">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Social Media</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Social Media Content
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate social media-ready architectural content by selecting aspect ratios optimized for different platforms—1:1 
              for Instagram posts, 9:16 for Stories and Reels, 16:9 for LinkedIn and Twitter.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Creating Content
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              How Social Media Content Creation Works
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Generate social media-ready architectural content by selecting aspect ratios optimized for different platforms—1:1 
                for Instagram posts, 9:16 for Stories and Reels, 16:9 for LinkedIn and Twitter. Upload sketches, renders, or photos 
                and create engaging visual content that showcases your work.
              </p>
              <p className="text-lg text-muted-foreground">
                Use descriptive prompts to create compelling visuals that tell your design story effectively. Render chains help you 
                maintain consistent visual style across your social media feed, building a cohesive brand presence. Generate multiple 
                variations quickly to test what resonates with your audience. The platform's fast generation times (30-60 seconds) 
                make it perfect for creating regular content without the overhead of traditional rendering workflows. Share directly 
                from the gallery or export optimized images for your social media management tools.
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
                  <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-pink-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-pink-600 dark:text-pink-400">
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full text-sm font-medium">
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
            Start Creating Social Media Content
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

