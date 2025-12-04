import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PaintBucket, Palette, Sun, DollarSign, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "AI Material Testing for Architecture | Rapid Material Exploration | Renderiq",
  description: "Test thousands of architectural material combinations instantly with AI. Visualize different finishes, textures, and colors in realistic lighting. Cost-effective material exploration for architects and designers.",
  keywords: [
    "material testing AI",
    "architectural materials AI",
    "material visualization",
    "finish testing architecture",
    "texture visualization AI",
    "color testing architecture",
    "material selection AI",
    "architectural finishes AI",
    "surface materials AI",
    "material rendering AI"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/use-cases/material-testing`,
  },
  openGraph: {
    title: "AI Material Testing for Architecture | Rapid Material Exploration | Renderiq",
    description: "Test thousands of architectural material combinations instantly with AI. Visualize different finishes, textures, and colors in realistic lighting.",
    type: "website",
    url: `${siteUrl}/use-cases/material-testing`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/use-cases-material-testing.jpg`,
        width: 1200,
        height: 630,
        alt: "AI Material Testing for Architecture - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Material Testing for Architecture | Renderiq",
    description: "Test thousands of architectural material combinations instantly with AI. Visualize different finishes and textures.",
    images: [`${siteUrl}/og/use-cases-material-testing.jpg`],
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
};

const benefits = [
  {
    icon: PaintBucket,
    title: "Instant Material Swaps",
    description: "Change materials with a click and see photorealistic results in seconds. No re-rendering needed.",
    metric: "Test 100+ materials/hour"
  },
  {
    icon: Palette,
    title: "Unlimited Combinations",
    description: "Explore thousands of material pairings without physical samples or expensive mock-ups.",
    metric: "Save $5,000+ on samples"
  },
  {
    icon: Sun,
    title: "Real Lighting Simulation",
    description: "See how materials look under different lighting conditions and times of day.",
    metric: "24/7 lighting scenarios"
  },
  {
    icon: DollarSign,
    title: "Cost-Effective Selection",
    description: "Compare budget options visually before committing to expensive materials.",
    metric: "30% better budget decisions"
  }
];

const materialCategories = [
  {
    title: "Exterior Finishes",
    materials: [
      "Stone (granite, marble, limestone)",
      "Metal (aluminum, copper, zinc)",
      "Wood (cedar, ipe, thermally modified)",
      "Concrete (exposed, polished, textured)",
      "Brick (standard, glazed, reclaimed)",
      "Glass (clear, frosted, tinted, ceramic frit)"
    ]
  },
  {
    title: "Interior Surfaces",
    materials: [
      "Flooring (wood, tile, concrete, carpet)",
      "Wall finishes (paint, wallpaper, paneling)",
      "Countertops (quartz, granite, marble)",
      "Cabinetry (wood species and finishes)",
      "Textiles (upholstery, curtains, rugs)",
      "Decorative materials (metal, glass, acrylic)"
    ]
  },
  {
    title: "Roofing Materials",
    materials: [
      "Asphalt shingles",
      "Metal roofing",
      "Clay and concrete tiles",
      "Slate",
      "Green/living roofs",
      "Solar panels integration"
    ]
  }
];

const useCases = [
  {
    title: "Client Presentations",
    description: "Show clients exactly how different material selections will look in their project. Enable informed decision-making with realistic visualizations.",
    benefit: "95% fewer client revisions"
  },
  {
    title: "Budget Optimization",
    description: "Compare premium and value materials visually. Make strategic decisions about where to splurge and where to save.",
    benefit: "Balance aesthetics with budget"
  },
  {
    title: "Sustainability Analysis",
    description: "Visualize eco-friendly material alternatives. Compare aesthetics of sustainable options against traditional choices.",
    benefit: "Easier green building adoption"
  },
  {
    title: "Historic Renovation",
    description: "Match existing materials or test period-appropriate alternatives. Ensure new materials complement historical context.",
    benefit: "Perfect material matching"
  }
];

const workflow = [
  {
    step: 1,
    title: "Upload Design",
    description: "Start with any architectural render or photo"
  },
  {
    step: 2,
    title: "Select Areas",
    description: "Click surfaces you want to test materials on"
  },
  {
    step: 3,
    title: "Apply Materials",
    description: "Browse our library of photorealistic materials"
  },
  {
    step: 4,
    title: "Compare Options",
    description: "View side-by-side comparisons instantly"
  }
];

export default function MaterialTestingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Link href="/use-cases" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Use Cases
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full mb-6">
              <PaintBucket className="w-4 h-4" />
              <span className="text-sm font-medium">Material Testing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rapid Material Testing with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Test thousands of material combinations instantly. See how different finishes, textures, 
              and colors work together under realistic lighting—without ordering a single sample.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Testing Materials
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Material Examples
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Revolutionary Material Selection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Make confident material decisions with photorealistic AI visualization
            </p>
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

      {/* Material Categories */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Material Library
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Test any architectural material with photorealistic accuracy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {materialCategories.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.materials.map((material, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{material}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">Plus hundreds more materials and custom uploads</p>
            <Link href="/signup">
              <Button variant="outline">
                Explore Full Material Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-lg text-muted-foreground">
              From concept to comparison in seconds
            </p>
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
                {idx < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-World Applications
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
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

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Materials available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$5K+</div>
              <div className="text-muted-foreground">Saved on samples</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100x</div>
              <div className="text-muted-foreground">Faster than physical samples</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">Fewer client revisions</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Testing Materials Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join architects worldwide who are making better material decisions with AI
          </p>
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

