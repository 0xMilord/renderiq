import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublicGallery } from '@/lib/actions/gallery.actions';
import { 
  Wand2, 
  Upload, 
  GalleryVertical, 
  Zap, 
  Shield, 
  Globe, 
  Play, 
  Smartphone, 
  Video, 
  Building2, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  Quote,
  Star as StarIcon,
  Heart,
  Eye
} from 'lucide-react';

export default async function Home() {
  // Fetch actual gallery items for the homepage
  const galleryResult = await getPublicGallery(1, 6);
  const galleryItems = galleryResult.success ? galleryResult.data || [] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <Badge className="mb-6 bg-primary text-primary-foreground border-0 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Architectural Visualization
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Transform Sketches into
              <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Hyperrealistic Renders
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Upload your architectural sketches or 3D model snapshots and watch them transform 
              into stunning, photorealistic AI-generated images and videos in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/chat">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  <Upload className="h-6 w-6 mr-2" />
                  Start Creating Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                  <Play className="h-6 w-6 mr-2" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">50K+</div>
                <div className="text-muted-foreground">Renders Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">2.5M</div>
                <div className="text-muted-foreground">Minutes Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">10K+</div>
                <div className="text-muted-foreground">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              Everything you need to create
              <span className="block text-muted-foreground">stunning visualizations</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform combines cutting-edge AI technology with intuitive design tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Rendering */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wand2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">AI-Powered Rendering</h3>
              <p className="text-muted-foreground mb-4">
                Transform basic sketches into photorealistic architectural visualizations using cutting-edge AI technology.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multiple AI models</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Style presets</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Custom prompts</li>
              </ul>
            </div>

            {/* Fast Processing */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground mb-4">
                Get your renders in minutes, not hours. Our optimized pipeline delivers results quickly.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />2-5 minute renders</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Queue management</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Real-time updates</li>
              </ul>
            </div>

            {/* Video Generation */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Video Generation</h3>
              <p className="text-muted-foreground mb-4">
                Create both images and videos from your sketches with cinematic quality and smooth animations.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />4K video output</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Camera movements</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multiple formats</li>
              </ul>
            </div>

            {/* Responsive Design */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Responsive Design</h3>
              <p className="text-muted-foreground mb-4">
                Works seamlessly on desktop, tablet, and mobile devices with optimized interfaces for each platform.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Mobile-first design</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Touch gestures</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Offline support</li>
              </ul>
            </div>

            {/* Security & Privacy */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Secure & Private</h3>
              <p className="text-muted-foreground mb-4">
                Enterprise-grade security and privacy protection for your sensitive architectural projects.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />End-to-end encryption</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />GDPR compliant</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Private projects</li>
              </ul>
            </div>

            {/* Public Gallery */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GalleryVertical className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">Public Gallery</h3>
              <p className="text-muted-foreground mb-4">
                Share and discover amazing renders from the community. Get inspired by other architects&apos; work.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Community showcase</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Like &amp; share</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Inspiration feed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section id="gallery" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Gallery
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              See what&apos;s possible
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore stunning renders created by our community of architects and designers
            </p>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold">
                View Full Gallery
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Actual Gallery Items */}
          {galleryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {galleryItems.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="transition-transform duration-200 group-hover:scale-[1.02]">
                    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <div className="relative">
                        {item.render.status === 'completed' && item.render.outputUrl ? (
                          item.render.type === 'video' ? (
                            <video
                              src={item.render.outputUrl}
                              className="w-full h-64 object-cover"
                              controls
                              loop
                            />
                          ) : (
                            <Image
                              src={item.render.outputUrl}
                              alt={item.render.prompt}
                              width={400}
                              height={256}
                              className="w-full h-64 object-cover"
                            />
                          )
                        ) : (
                          <div className="h-64 flex items-center justify-center bg-muted/50">
                            <div className="text-center">
                              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground font-medium">Render in progress...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                          {item.render.prompt}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span className="font-medium">{item.likes}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span className="font-medium">{item.views}</span>
                            </span>
                          </div>
                          <span className="text-xs truncate max-w-[120px]">
                            by {item.user.name || 'Anonymous'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg bg-card border border-border aspect-square hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Sample Render {i}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6">
              What our users say
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of architects and designers who trust renderiq for their visualization needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                &ldquo;renderiq has revolutionized how we present our designs to clients. The AI renders are so realistic that clients can immediately visualize the final result. It&apos;s saved us countless hours of manual rendering work.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-foreground font-semibold">SM</span>
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Sarah Mitchell</h4>
                  <p className="text-sm text-muted-foreground">Senior Architect, Design Studio</p>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                &ldquo;The video generation feature is incredible. We can now create stunning walkthroughs of our projects in minutes instead of days. Our clients are absolutely amazed by the quality.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-foreground font-semibold">JC</span>
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">James Chen</h4>
                  <p className="text-sm text-muted-foreground">Principal, Urban Architects</p>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                &ldquo;As a freelance architect, renderiq has given me the tools to compete with larger firms. The quality of renders I can produce now is professional-grade, and it&apos;s helped me win more projects.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-foreground font-semibold">AR</span>
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">Anna Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">Freelance Architect</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-card-foreground mb-2">Free</h3>
                <div className="text-4xl font-bold text-card-foreground mb-2">$0</div>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />10 credits per month</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />3 projects maximum</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />5 renders per project</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Basic support</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Standard quality renders</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant="outline">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl bg-primary text-primary-foreground relative hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute top-4 right-4">
                <Badge className="bg-background text-primary font-semibold">Most Popular</Badge>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-2">$15</div>
                <p className="text-primary-foreground/80">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />100 credits per month</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />25 projects maximum</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />20 renders per project</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />Priority support</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />High quality renders</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />Video rendering</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />API access</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" />Custom styles</li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-background text-primary hover:bg-background/90 font-semibold">
                  Start Pro Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-card-foreground mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-card-foreground mb-2">$99</div>
                <p className="text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />1000 credits per month</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Unlimited projects</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Unlimited renders per project</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />24/7 priority support</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Ultra quality renders</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Video rendering</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Full API access</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Custom styles</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Team management</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />SSO integration</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Custom integrations</li>
              </ul>
              <Link href="/billing/plans">
                <Button className="w-full" variant="outline">
                  View All Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Ready to transform your ideas?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-12 max-w-4xl mx-auto">
            Join thousands of architects and designers creating stunning visualizations with renderiq
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold">
                <Globe className="h-6 w-6 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg font-semibold">
                <GalleryVertical className="h-6 w-6 mr-2" />
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
