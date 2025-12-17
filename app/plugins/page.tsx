import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Puzzle, CheckCircle, Code, Download } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Rendering Plugins | SketchUp, Revit, AutoCAD, Blender, Rhino | Renderiq',
  description: 'Native plugins for SketchUp, Revit, AutoCAD, Blender, and Rhino. Seamlessly integrate AI rendering into your AEC workflow.',
  keywords: [
    'SketchUp plugin',
    'Revit plugin',
    'AutoCAD plugin',
    'Blender plugin',
    'Rhino plugin',
    'AI rendering plugin',
    'architecture plugin',
    'AEC software plugin',
  ],
};

const plugins = [
  {
    slug: 'sketchup-ai-rendering-plugin',
    name: 'SketchUp AI Rendering Plugin',
    description: 'Transform your SketchUp models into photorealistic renders directly from the Extensions menu. Camera management and screenshot capture.',
    status: 'complete',
    language: 'Ruby',
    icon: '📐',
    features: [
      'Camera position management',
      'Screenshot capture',
      'Extension Warehouse ready',
      'Real-time credit balance',
    ],
  },
  {
    slug: 'revit-ai-rendering-plugin',
    name: 'Revit AI Rendering Plugin',
    description: 'Batch render multiple views with deep BIM data access. Enterprise-grade integration for Revit workflows.',
    status: 'documented',
    language: 'C#',
    icon: '🏢',
    features: [
      'Batch rendering of multiple views',
      'Deep BIM data access',
      'Ribbon panel integration',
      'Status bar widget',
    ],
  },
  {
    slug: 'autocad-ai-rendering-plugin',
    name: 'AutoCAD AI Rendering Plugin',
    description: 'Export drawings and layouts with drawing context awareness. Perfect for traditional CAD workflows.',
    status: 'documented',
    language: 'C#',
    icon: '📏',
    features: [
      'Layout viewport support',
      'Drawing context awareness',
      'Toolbar + command line interface',
      'Traditional CAD workflows',
    ],
  },
  {
    slug: 'blender-ai-rendering-plugin',
    name: 'Blender AI Rendering Plugin',
    description: 'Capture viewport and render animation sequences. Material and lighting detection for 3D artists.',
    status: 'documented',
    language: 'Python',
    icon: '🎨',
    features: [
      'Animation sequence rendering',
      'Material and lighting detection',
      'N-panel sidebar integration',
      '3D visualization workflows',
    ],
  },
  {
    slug: 'rhino-ai-rendering-plugin',
    name: 'Rhino AI Rendering Plugin',
    description: 'Grasshopper parametric integration with named views and viewport management. Perfect for computational design.',
    status: 'documented',
    language: 'C#',
    icon: '🦏',
    features: [
      'Grasshopper parametric integration',
      'Named views and viewport management',
      'Custom toolbar + Grasshopper components',
      'Computational design workflows',
    ],
  },
];

export default function PluginsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            Plugins
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Native AI Rendering Plugins
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly integrate Renderiq into your AEC workflow with native plugins for SketchUp, Revit, AutoCAD, Blender, and Rhino.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plugins.map((plugin) => (
            <Link key={plugin.slug} href={`/plugins/${plugin.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-4xl">{plugin.icon}</div>
                    <Badge
                      variant={plugin.status === 'complete' ? 'default' : 'secondary'}
                      className="ml-auto"
                    >
                      {plugin.status === 'complete' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </>
                      ) : (
                        'Coming Soon'
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-2">{plugin.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {plugin.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      <span>{plugin.language}</span>
                    </div>
                    <div className="space-y-1.5">
                      {plugin.features.slice(0, 2).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="h-5 w-5" />
                Unified Plugin API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                All plugins use our unified Renderiq Plugin API with consistent authentication, 
                credit management, and render workflows across all platforms.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Bearer Token Auth</Badge>
                <Badge variant="outline">API Key Support</Badge>
                <Badge variant="outline">Real-time Credits</Badge>
                <Badge variant="outline">Background Processing</Badge>
                <Badge variant="outline">Webhook Support</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
