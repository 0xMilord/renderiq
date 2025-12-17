import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, ArrowLeft, ExternalLink, Zap, Shield, Users } from 'lucide-react';
import { CheckCircle, Download } from 'lucide-react';
import type { Metadata } from 'next';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
}

export const metadata: Metadata = {
  title: 'Revit AI Rendering Plugin | BIM AI Render Plugin for Autodesk Revit | Renderiq',
  description: 'Batch render multiple views with deep BIM data access. Enterprise-grade integration for Revit workflows. AI rendering plugin for Autodesk Revit.',
  keywords: [
    'Revit plugin',
    'Revit AI rendering',
    'BIM rendering plugin',
    'Autodesk Revit plugin',
    'Revit render plugin',
    'Revit AI render',
    'BIM visualization',
    'Revit extension',
    'Revit rendering software',
    'BIM AI render',
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/plugins/revit-ai-rendering-plugin`,
  },
  openGraph: {
    title: 'Revit AI Rendering Plugin | BIM AI Render Plugin for Autodesk Revit | Renderiq',
    description: 'Batch render multiple views with deep BIM data access. Enterprise-grade integration for Revit workflows.',
    type: 'website',
    url: `${getSiteUrl()}/plugins/revit-ai-rendering-plugin`,
    siteName: 'Renderiq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revit AI Rendering Plugin | BIM AI Render Plugin for Autodesk Revit | Renderiq',
    description: 'Batch render multiple views with deep BIM data access. Enterprise-grade integration for Revit workflows.',
  },
};

const plugin = {
  name: 'Revit AI Rendering Plugin',
  description: 'Batch render multiple views with deep BIM data access. Enterprise-grade integration for Revit workflows.',
  longDescription: 'The Renderiq Revit plugin enables architects to render multiple views simultaneously with full access to BIM data. Perfect for enterprise workflows requiring batch processing and detailed architectural visualization. Integrate AI rendering seamlessly into your Revit projects without disrupting your BIM workflow.',
  status: 'documented' as const,
  language: 'C#',
  icon: '🏢',
  features: [
    'Batch rendering of multiple views',
    'Deep BIM data access',
    'Ribbon panel integration',
    'Status bar widget',
    'View selection and management',
    'Enterprise workflow support',
    'Project-based organization',
    'Automatic view detection',
  ],
  benefits: [
    'Render entire Revit projects in batch',
    'Leverage BIM data for better context',
    'Enterprise-ready with robust error handling',
    'Seamless integration with Revit ribbon',
  ],
  useCases: [
    'Batch rendering of Revit project views',
    'BIM-based architectural visualization',
    'Client presentations from Revit models',
    'Design documentation and marketing materials',
  ],
  docsUrl: '/docs/plugins/revit',
  installGuide: [
    'Download the Renderiq Revit plugin installer',
    'Run the installer as administrator',
    'Open Revit',
    'Go to Add-Ins tab → Renderiq panel',
    'Sign in with your Renderiq account',
    'Select views and start rendering',
  ],
  faq: [
    {
      question: 'Does the Revit plugin work with Revit LT?',
      answer: 'The plugin is designed for Revit and Revit LT. Some advanced features may require full Revit.',
    },
    {
      question: 'Can I render from Revit views?',
      answer: 'Yes, the plugin can render from any Revit view including 3D views, floor plans, elevations, and sections.',
    },
    {
      question: 'How does batch rendering work?',
      answer: 'Select multiple views in Revit and the plugin will queue them for rendering. All renders process in the background.',
    },
  ],
};

export default function RevitPluginPage() {
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
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-6xl">{plugin.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    {plugin.name}
                  </h1>
                  <Badge variant="secondary">Coming Soon</Badge>
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

            {plugin.docsUrl && (
              <Button variant="outline" asChild>
                <Link href={plugin.docsUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentation
                </Link>
              </Button>
            )}
          </div>

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
