import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Code, ArrowLeft, ExternalLink, Zap, Shield, Users, Download } from 'lucide-react';
import type { Metadata } from 'next';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
}

export const metadata: Metadata = {
  title: 'AutoCAD AI Rendering Plugin | CAD AI Render Plugin for Autodesk AutoCAD | Renderiq',
  description: 'Export drawings and layouts with drawing context awareness. Perfect for traditional CAD workflows. AI rendering plugin for AutoCAD.',
  keywords: [
    'AutoCAD plugin',
    'AutoCAD AI rendering',
    'CAD rendering plugin',
    'Autodesk AutoCAD plugin',
    'AutoCAD render plugin',
    'CAD AI render',
    'AutoCAD extension',
    'CAD visualization',
    'AutoCAD rendering software',
    'CAD AI rendering',
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/plugins/autocad-ai-rendering-plugin`,
  },
  openGraph: {
    title: 'AutoCAD AI Rendering Plugin | CAD AI Render Plugin for Autodesk AutoCAD | Renderiq',
    description: 'Export drawings and layouts with drawing context awareness. Perfect for traditional CAD workflows.',
    type: 'website',
    url: `${getSiteUrl()}/plugins/autocad-ai-rendering-plugin`,
    siteName: 'Renderiq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoCAD AI Rendering Plugin | CAD AI Render Plugin for Autodesk AutoCAD | Renderiq',
    description: 'Export drawings and layouts with drawing context awareness. Perfect for traditional CAD workflows.',
  },
};

const plugin = {
  name: 'AutoCAD AI Rendering Plugin',
  description: 'Export drawings and layouts with drawing context awareness. Perfect for traditional CAD workflows.',
  longDescription: 'The Renderiq AutoCAD plugin integrates seamlessly with AutoCAD\'s drawing and layout system. Export your CAD drawings with full context awareness and generate professional visualizations. Ideal for architects and engineers working with traditional CAD workflows who want to add AI-powered rendering capabilities.',
  status: 'documented' as const,
  language: 'C#',
  icon: '📏',
  features: [
    'Layout viewport support',
    'Drawing context awareness',
    'Toolbar + command line interface',
    'Traditional CAD workflows',
    'Drawing export and management',
    'Command line integration',
    'Multiple layout support',
    'DWG file compatibility',
  ],
  benefits: [
    'Render directly from AutoCAD drawings',
    'Maintain CAD workflow efficiency',
    'Command line support for automation',
    'Full layout and viewport support',
  ],
  useCases: [
    'Rendering AutoCAD floor plans',
    'CAD drawing visualization',
    'Technical drawing enhancement',
    'Client presentation from CAD files',
  ],
  docsUrl: '/docs/plugins/autocad',
  installGuide: [
    'Download the Renderiq AutoCAD plugin installer',
    'Run the installer',
    'Open AutoCAD',
    'Go to Add-Ins tab → Renderiq toolbar',
    'Sign in with your Renderiq account',
    'Select drawings and render',
  ],
  faq: [
    {
      question: 'What AutoCAD versions are supported?',
      answer: 'The plugin supports AutoCAD 2018 and later versions, including AutoCAD LT.',
    },
    {
      question: 'Can I render from AutoCAD layouts?',
      answer: 'Yes, the plugin fully supports AutoCAD layouts and viewports, allowing you to render from any layout view.',
    },
    {
      question: 'Does it work with AutoCAD LT?',
      answer: 'Yes, the plugin is compatible with both AutoCAD and AutoCAD LT.',
    },
  ],
};

export default function AutoCADPluginPage() {
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
