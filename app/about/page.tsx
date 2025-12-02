import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Building2, Users, Target, Zap, Shield, Globe, Sparkles, Code, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us | Renderiq - AI Architectural Visualization Platform",
  description: "Learn about Renderiq's mission to revolutionize architectural visualization with AI. Our team, vision, and commitment to empowering architects and designers.",
  robots: "index, follow"
};

const values = [
  {
    icon: Zap,
    title: "Innovation",
    description: "We're at the forefront of AI technology, constantly pushing the boundaries of what's possible in architectural visualization."
  },
  {
    icon: Shield,
    title: "Reliability",
    description: "Built for professionals who need consistent, high-quality results they can depend on for their projects."
  },
  {
    icon: Users,
    title: "User-Centric",
    description: "Every feature we build is designed with architects and designers in mind, prioritizing ease of use and professional workflows."
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making professional-grade architectural visualization accessible to everyone, from solo designers to large firms."
  }
];

const team = [
  {
    name: "Our Team",
    role: "AI & Architecture Enthusiasts",
    description: "A diverse group of engineers, designers, and architects passionate about bridging the gap between creativity and technology."
  },
  {
    name: "Our Mission",
    role: "Democratize Design Visualization",
    description: "We believe every architect and designer should have access to powerful visualization tools, regardless of budget or technical expertise."
  },
  {
    name: "Our Vision",
    role: "Future of Architecture",
    description: "Envisioning a world where AI-powered tools enhance creativity, accelerate workflows, and unlock new possibilities in architectural design."
  }
];

const stats = [
  { label: "AI Models", value: "State-of-the-Art", description: "Powered by Google Gemini 3 Pro" },
  { label: "Renders Generated", value: "Thousands", description: "And growing every day" },
  { label: "Users", value: "Architects Worldwide", description: "From startups to enterprises" },
  { label: "Quality", value: "Professional-Grade", description: "Used in real projects" }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">About Renderiq</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transforming Architecture with AI
          </h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            Renderiq is an AI-powered platform that transforms architectural sketches and prompts into hyperrealistic renders and videos using cutting-edge technology.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              To empower architects, designers, and creative professionals with accessible, 
              powerful AI tools that transform ideas into stunning visualizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <p className="text-sm text-primary font-medium">{item.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do at Renderiq.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                Powered by Cutting-Edge Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Google Gemini 3 Pro Image Preview</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We leverage Google's most advanced AI models for image generation, ensuring 
                  the highest quality renders with photorealistic detail and architectural accuracy.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Gemini 2.5 Flash</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fast, efficient text generation powers our chat interface and prompt enhancement, 
                  making your workflow smooth and responsive.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Modern Web Stack</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Built with Next.js 15, React 19, and TypeScript for a fast, reliable, and 
                  scalable platform that grows with your needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Join the Future of Architecture</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start creating stunning architectural visualizations today. No credit card required to begin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Get Started Free
                </button>
              </Link>
              <Link href="/contact">
                <button className="px-6 py-3 bg-background border border-border rounded-lg font-medium hover:bg-muted transition-colors">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

