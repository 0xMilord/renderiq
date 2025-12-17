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
  title: 'Blender AI Rendering Plugin | Free AI Render Add-on for Blender 3D | Renderiq',
  description: 'Capture viewport and render animation sequences. Material and lighting detection for 3D artists. Free Blender AI rendering add-on.',
  keywords: [
    'Blender plugin',
    'Blender AI rendering',
    'Blender add-on',
    'Blender render plugin',
    '3D rendering plugin',
    'Blender AI render',
    'Blender extension',
    '3D visualization add-on',
    'Blender rendering software',
    '3D AI rendering',
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${getSiteUrl()}/plugins/blender-ai-rendering-plugin`,
  },
  openGraph: {
    title: 'Blender AI Rendering Plugin | Free AI Render Add-on for Blender 3D | Renderiq',
    description: 'Capture viewport and render animation sequences. Material and lighting detection for 3D artists.',
    type: 'website',
    url: `${getSiteUrl()}/plugins/blender-ai-rendering-plugin`,
    siteName: 'Renderiq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blender AI Rendering Plugin | Free AI Render Add-on for Blender 3D | Renderiq',
    description: 'Capture viewport and render animation sequences. Material and lighting detection for 3D artists.',
  },
};

const plugin = {
  name: 'Blender AI Rendering Plugin',
  description: 'Capture viewport and render animation sequences. Material and lighting detection for 3D artists.',
  longDescription: 'The Renderiq Blender add-on brings AI rendering to 3D artists. Capture viewport scenes, render animation sequences, and leverage material and lighting detection for optimal results. Perfect for 3D artists, visualizers, and designers who want to enhance their Blender workflow with AI-powered rendering.',
  status: 'documented' as const,
  language: 'Python',
  icon: '🎨',
  features: [
    'Animation sequence rendering',
    'Material and lighting detection',
    'N-panel sidebar integration',
    '3D visualization workflows',
    'Viewport capture',
    'Python SDK integration',
    'Scene analysis',
    'Batch frame rendering',
  ],
  benefits: [
    'Render Blender scenes with AI enhancement',
    'Animation sequence support',
    'Automatic material and lighting detection',
    'Native Blender UI integration',
  ],
  useCases: [
    '3D scene visualization',
    'Animation rendering',
    'Material testing and iteration',
    'Architectural visualization from Blender',
  ],
  docsUrl: '/docs/plugins/blender',
  installGuide: [
    'Open Blender',
    'Go to Edit → Preferences → Add-ons',
    'Click Install and select the Renderiq add-on',
    'Enable the Renderiq add-on',
    'Open the N-panel sidebar',
    'Sign in and start rendering',
  ],
  faq: [
    {
      question: 'Is the Blender add-on free?',
      answer: 'Yes, the Blender add-on is free to install. You only pay for renders using Renderiq credits.',
    },
    {
      question: 'What Blender versions are supported?',
      answer: 'The add-on supports Blender 2.8 and later versions.',
    },
    {
      question: 'Can I render animations?',
      answer: 'Yes, the plugin supports rendering animation sequences frame by frame with AI enhancement.',
    },
  ],
};

export default function BlenderPluginPage() {
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
