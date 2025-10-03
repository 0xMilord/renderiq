import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, GalleryVertical, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[2400px] mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Transform Sketches into
              <span className="text-primary block">Hyperrealistic Renders</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Upload your architectural sketches or 3D model snapshots and watch them transform 
              into stunning, photorealistic AI-generated images and videos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/engine/interior-ai">
                <Button size="lg" className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Start Creating</span>
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="flex items-center space-x-2">
                  <GalleryVertical className="h-5 w-5" />
                  <span>View Gallery</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-[2400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our Nano Banana SDK integration delivers professional-grade architectural visualization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">AI-Powered Rendering</h3>
              <p className="text-muted-foreground">
                Transform basic sketches into photorealistic architectural visualizations using cutting-edge AI technology.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Fast Processing</h3>
              <p className="text-muted-foreground">
                Get your renders in minutes, not hours. Our optimized pipeline delivers results quickly.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your projects are secure with enterprise-grade encryption and privacy protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-[2400px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Ideas?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of architects and designers creating stunning visualizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Get Started Free</span>
              </Button>
            </Link>
            <Link href="/api-docs">
                <Button size="lg" variant="outline" className="flex items-center space-x-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <span>View API Docs</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
