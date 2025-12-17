import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Code, Download, ArrowLeft, ExternalLink, Zap, Shield, Clock, Users } from 'lucide-react';
import type { Metadata } from 'next';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
}

export const metadata: Metadata = {
  title: 'SketchUp AI Rendering Plugin | Free AI Render Plugin for SketchUp | Renderiq',
  description: 'Transform your SketchUp models into photorealistic renders directly from the Extensions menu. Camera management and screenshot capture. Free SketchUp AI rendering plugin.',
  keywords: [
    'SketchUp plugin',
    'SketchUp AI rendering',
    'SketchUp render plugin',
    'AI rendering for SketchUp',
    'SketchUp extension',
    'SketchUp visualization plugin',
    'free SketchUp plugin',
    'SketchUp AI render',
    'SketchUp rendering software',
    'AI render plugin SketchUp',
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/plugins/sketchup-ai-rendering-plugin`,
  },
  openGraph: {
    title: 'SketchUp AI Rendering Plugin | Free AI Render Plugin for SketchUp | Renderiq',
    description: 'Transform your SketchUp models into photorealistic renders directly from the Extensions menu. Camera management and screenshot capture.',
    type: 'website',
    url: `${getSiteUrl()}/plugins/sketchup-ai-rendering-plugin`,
    siteName: 'Renderiq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SketchUp AI Rendering Plugin | Free AI Render Plugin for SketchUp | Renderiq',
    description: 'Transform your SketchUp models into photorealistic renders directly from the Extensions menu.',
  },
};

const plugin = {
  name: 'SketchUp AI Rendering Plugin',
  description: 'Transform your SketchUp models into photorealistic renders directly from the Extensions menu. Camera management and screenshot capture.',
  longDescription: 'The Renderiq SketchUp plugin brings AI-powered rendering directly into your SketchUp workflow. Capture your models, manage camera positions, and generate stunning visualizations without leaving SketchUp. Perfect for architects and designers who want to quickly visualize their 3D models with professional-quality AI renders.',
  status: 'complete' as const,
  language: 'Ruby',
  icon: '📐',
  features: [
    'Camera position management',
    'Screenshot capture',
    'Extension Warehouse ready',
    'Real-time credit balance display',
    'Background render processing',
    'Result download and sharing',
    'Multiple quality settings',
    'Style presets for architectural visualization',
  ],
  benefits: [
    'Render directly from SketchUp without exporting',
    'Maintain your workflow without switching applications',
    'Generate multiple render variations quickly',
    'Professional results without 3D rendering expertise',
  ],
  useCases: [
    'Architectural visualization from SketchUp models',
    'Quick client presentations and design reviews',
    'Material and lighting testing',
    'Concept development and iteration',
  ],
  downloadUrl: 'https://extensions.sketchup.com',
  docsUrl: '/docs/plugins/sketchup',
  installGuide: [
    'Open SketchUp',
    'Go to Extensions → Extension Manager',
    'Search for "Renderiq"',
    'Click Install',
    'Sign in with your Renderiq account',
    'Start rendering!',
  ],
  faq: [
    {
      question: 'Is the SketchUp plugin free?',
      answer: 'Yes, the SketchUp plugin is free to install. You only pay for renders using Renderiq credits, with free credits available to get started.',
    },
    {
      question: 'What versions of SketchUp are supported?',
      answer: 'The Renderiq SketchUp plugin supports SketchUp 2018 and later versions, including SketchUp Pro and SketchUp Free.',
    },
    {
      question: 'Can I render multiple views at once?',
      answer: 'Yes, you can queue multiple renders from different camera positions. The plugin processes them in the background.',
    },
  ],
};

export default function SketchUpPluginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link
          href="/plugins"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plugins
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-6xl">{plugin.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    {plugin.name}
                  </h1>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                </div>
                <p className="text-xl text-muted-foreground mb-4">
                  {plugin.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>{plugin.language}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {plugin.downloadUrl && (
                <Button asChild>
                  <Link href={plugin.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              )}
              {plugin.docsUrl && (
                <Button variant="outline" asChild>
                  <Link href={plugin.docsUrl}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentation
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About This Plugin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {plugin.longDescription}
              </p>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plugin.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plugin.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-foreground pt-0.5">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Use Cases */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plugin.useCases.map((useCase, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-foreground">{useCase}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Installation Guide */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Installation Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {plugin.installGuide.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plugin.faq.map((item, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
