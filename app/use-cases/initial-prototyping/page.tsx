import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Zap, Layers, Users, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "AI Rapid Prototyping for Architecture | Initial Design Concepts | arqihive",
  description: "Generate multiple architectural design concepts in minutes with AI. Rapid prototyping for architects enables faster design exploration, early stakeholder feedback, and reduces design time by 80%.",
  keywords: [
    "rapid prototyping architecture",
    "AI architectural prototyping",
    "quick design concepts",
    "architectural concept generation",
    "AI design exploration",
    "fast architectural design",
    "initial design concepts AI",
    "architectural design automation",
    "concept development AI",
    "early stage design AI"
  ]
};

const benefits = [
  {
    icon: Zap,
    title: "Generate Concepts Fast",
    description: "Create 10+ design variations in the time it takes to sketch one manually.",
    metric: "80% faster ideation"
  },
  {
    icon: Layers,
    title: "Explore Alternatives",
    description: "Test different layouts, styles, and approaches without committing resources.",
    metric: "5x more options explored"
  },
  {
    icon: Users,
    title: "Early Stakeholder Buy-In",
    description: "Present polished concepts to clients and stakeholders from day one.",
    metric: "90% approval rate increase"
  },
  {
    icon: TrendingUp,
    title: "Reduce Risk",
    description: "Identify design issues early before investing in detailed development.",
    metric: "70% fewer late changes"
  }
];

const process = [
  {
    title: "Brief Input",
    description: "Enter project requirements, style preferences, and key constraints"
  },
  {
    title: "AI Generation",
    description: "AI creates multiple design concepts based on your specifications"
  },
  {
    title: "Rapid Iteration",
    description: "Refine promising concepts with instant AI-powered variations"
  },
  {
    title: "Selection & Development",
    description: "Choose the best direction and develop it further with confidence"
  }
];

const applications = [
  {
    title: "Competition Entries",
    description: "Generate multiple compelling concepts to explore different approaches to the brief. Stand out with diverse, well-visualized proposals.",
    stat: "3x more concepts per competition"
  },
  {
    title: "Client Pitches",
    description: "Present several fully visualized options during initial meetings. Win more projects by showing range and creativity.",
    stat: "60% higher win rate"
  },
  {
    title: "Feasibility Studies",
    description: "Quickly test multiple site configurations and building orientations. Make data-driven decisions early.",
    stat: "Save 2-3 weeks of work"
  },
  {
    title: "Design Workshops",
    description: "Generate ideas in real-time during charrettes and design sessions. Keep momentum and creativity flowing.",
    stat: "10x more productive workshops"
  }
];

export default function InitialPrototypingPage() {
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
      <section className="py-20 px-4 bg-gradient-to-b from-yellow-500/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Rapid Prototyping</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Initial Design Prototyping with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate multiple design concepts in minutes, not days. Explore unlimited alternatives 
              and present polished options to stakeholders from the very first meeting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Prototyping Free
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Examples
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
              Transform Your Design Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Speed up early-stage design while maintaining quality and creativity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {benefit.metric}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From Idea to Concept in Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Our streamlined AI-powered workflow
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {process.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {idx < process.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real-World Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How architects use rapid prototyping to win projects and deliver better designs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {applications.map((app, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    {app.title}
                  </CardTitle>
                  <CardDescription className="text-base ml-9">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="ml-9">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {app.stat}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Numbers Speak</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">80%</div>
              <div className="text-muted-foreground">Faster concept development</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10+</div>
              <div className="text-muted-foreground">Concepts per hour</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5x</div>
              <div className="text-muted-foreground">More alternatives explored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">90%</div>
              <div className="text-muted-foreground">Client satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to 10x Your Design Speed?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start generating professional design concepts in minutes with AI-powered rapid prototyping
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Try It Free - No Credit Card Required
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

