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
  Store,
  School,
  Hotel,
  Warehouse,
  TreePine,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "AI Architecture Use Cases | Real-Time Visualization & Design | arqihive",
  description: "Discover how AI transforms architectural design: real-time visualization, rapid prototyping, material testing, and more. See how architects, designers, and developers use AI for architectural rendering, interior design, and building visualization.",
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
  openGraph: {
    title: "AI Architecture Use Cases - Transform Your Design Workflow",
    description: "Real-time visualization, rapid prototyping, and intelligent material testing for modern architecture.",
    type: "website",
  },
};

const primaryUseCases = [
  {
    icon: Sparkles,
    title: "Real-Time Visualization",
    slug: "real-time-visualization",
    description: "Instantly transform sketches and CAD drawings into photorealistic renders. See design changes in seconds, not hours.",
    benefits: [
      "Instant client presentations",
      "Live design iterations",
      "Immediate feedback loops",
      "Faster decision making"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Zap,
    title: "Initial Prototyping",
    slug: "initial-prototyping",
    description: "Generate multiple design concepts rapidly. Explore variations and alternatives in minutes instead of days.",
    benefits: [
      "Quick concept generation",
      "Multiple design options",
      "Early stakeholder feedback",
      "Reduced design time by 80%"
    ],
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    icon: PaintBucket,
    title: "Rapid Material Testing",
    slug: "material-testing",
    description: "Test thousands of material combinations instantly. See how different finishes, textures, and colors work together.",
    benefits: [
      "Instant material swaps",
      "Unlimited combinations",
      "Realistic lighting simulation",
      "Cost-effective exploration"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: Layers,
    title: "Design Iteration",
    slug: "design-iteration",
    description: "Iterate designs with unprecedented speed. Make changes and see results instantly across all views.",
    benefits: [
      "Version control built-in",
      "A/B testing designs",
      "Client comparison tools",
      "Change tracking"
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  }
];

const industryUseCases = [
  {
    icon: Home,
    title: "Residential Architecture",
    slug: "residential",
    description: "Design dream homes with AI-powered visualization",
    applications: ["Single-family homes", "Apartments", "Custom homes", "Renovations"]
  },
  {
    icon: Building2,
    title: "Commercial Projects",
    slug: "commercial",
    description: "Visualize office spaces and commercial buildings",
    applications: ["Office buildings", "Mixed-use", "Retail spaces", "Coworking"]
  },
  {
    icon: Hotel,
    title: "Hospitality Design",
    slug: "hospitality",
    description: "Create stunning hotels and resort visualizations",
    applications: ["Hotels", "Resorts", "Restaurants", "Event venues"]
  },
  {
    icon: Store,
    title: "Retail Spaces",
    slug: "retail",
    description: "Design engaging retail environments",
    applications: ["Boutiques", "Showrooms", "Shopping centers", "Pop-up stores"]
  },
  {
    icon: School,
    title: "Educational Facilities",
    slug: "educational",
    description: "Plan modern learning environments",
    applications: ["Schools", "Universities", "Libraries", "Training centers"]
  },
  {
    icon: TreePine,
    title: "Landscape & Urban",
    slug: "landscape",
    description: "Design outdoor spaces and urban planning",
    applications: ["Parks", "Public spaces", "Site planning", "Urban design"]
  }
];

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
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              AI Architecture Use Cases
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform architectural design workflows with AI-powered visualization, rapid prototyping, 
              and intelligent material testing. See how architects worldwide are revolutionizing their practice.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">AI Rendering</span>
              <span className="px-3 py-1 bg-muted rounded-full">Real-Time Visualization</span>
              <span className="px-3 py-1 bg-muted rounded-full">Architectural AI</span>
              <span className="px-3 py-1 bg-muted rounded-full">Design Automation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Core AI Architecture Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how AI transforms every stage of the architectural design process
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {primaryUseCases.map((useCase) => (
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
                    {useCase.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${useCase.color} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={`/use-cases/${useCase.slug}`}>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry-Specific Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
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
        <div className="container mx-auto max-w-7xl">
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
  );
}

