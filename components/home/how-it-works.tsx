import { Upload, Wand2, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Sketch',
    description: 'Upload your architectural sketch, 3D model snapshot, or design concept. We support multiple formats including PNG, JPG, and more.',
    details: ['Drag & drop interface', 'Multiple file formats', 'Batch upload support', 'Cloud storage integration'],
  },
  {
    number: '02',
    icon: Wand2,
    title: 'AI Transforms Your Design',
    description: 'Our advanced AI analyzes your design and transforms it into a photorealistic render. Customize styles, materials, and lighting.',
    details: ['Multiple AI models', 'Style presets', 'Material library', 'Lighting controls'],
  },
  {
    number: '03',
    icon: Download,
    title: 'Download & Share',
    description: 'Get your high-quality render in minutes. Download in multiple formats, share with clients, or publish to your gallery.',
    details: ['HD & 4K quality', 'Multiple formats', 'Instant sharing', 'Public gallery'],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
            From Sketch to Stunning Render
            <span className="block text-muted-foreground">in 3 Simple Steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined process makes it easy to create professional architectural visualizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 left-full w-full h-0.5 bg-primary/20 -z-10">
                    <ArrowRight className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                  </div>
                )}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                          <Icon className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <div className="text-6xl font-bold text-primary/20">{step.number}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-card-foreground mb-3">{step.title}</h3>
                        <p className="text-muted-foreground mb-6 leading-relaxed">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/render">
            <Button size="lg" className="px-8 py-4 text-lg font-semibold">
              Start Creating Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}



