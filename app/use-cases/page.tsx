import { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  Zap, 
  Layers, 
  PaintBucket, 
  Building2, 
  Users, 
  Home, 
  School,
  Hotel,
  Warehouse,
  TreePine,
  ArrowRight,
  CheckCircle2,
  Eye,
  LayoutGrid,
  Palette,
  Video,
  Boxes,
  FileImage,
  Share2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "AI Architecture Use Cases | Concept Renders, Floor Plans, Videos & More | Renderiq",
  description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, video generation, massing studies, elevations, presentation graphics, social media content, and mood matching. Transform your architectural workflow with Renderiq.",
  keywords: [
    "AI architecture",
    "architectural visualization AI",
    "AI rendering architecture",
    "real-time architectural visualization",
    "AI interior design",
    "architectural design AI",
    "building design AI",
    "AI architectural rendering",
    "rapid prototyping architecture",
    "material testing AI",
    "architectural AI software",
    "AI exterior design",
    "AI site planning",
    "generative design architecture",
    "3D architectural rendering AI",
    "architectural visualization software",
    "AI for architects",
    "machine learning architecture",
    "automated design architecture",
    "computational design"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/use-cases`,
  },
  openGraph: {
    title: "AI Architecture Use Cases - Transform Your Design Workflow",
    description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, video generation, massing studies, elevations, presentation graphics, social media content, and mood matching.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/use-cases`,
    siteName: "Renderiq",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/og/use-cases.jpg`,
        width: 1200,
        height: 630,
        alt: "AI Architecture Use Cases - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Architecture Use Cases - Transform Your Design Workflow",
    description: "Discover 10 powerful AI architecture use cases: concept renders, material testing, floor plan visualization, and more.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/og/use-cases.jpg`],
    creator: "@Renderiq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Architecture',
};

const primaryUseCases = [
  {
    icon: Eye,
    title: "Concept Renders for Early Visualisation",
    slug: "concept-renders",
    description: "Transform rough sketches and initial design ideas into photorealistic visualizations in seconds. Perfect for early-stage design exploration and client communication before committing to detailed development.",
    benefits: [
      "Instant visualization from sketches",
      "Early client feedback and approval",
      "Explore multiple concepts rapidly",
      "Save weeks of development time"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    detailedExplanation: "Upload your initial sketches, hand drawings, or rough CAD exports directly into Renderiq's unified chat interface. The platform uses Google Gemini 3 Pro Image Preview to understand architectural context, maintaining your design proportions while adding realistic materials, lighting, and spatial depth. Generate multiple concept variations in minutes using render chains—simply reference previous versions with @v1 or @latest to build on successful elements. This workflow lets you explore design directions before investing in detailed modeling, making it perfect for initial client meetings, design charrettes, and early-stage decision making."
  },
  {
    icon: PaintBucket,
    title: "Material Testing in Built Spaces",
    slug: "material-testing-built-spaces",
    description: "Test how materials look and feel in actual built environments. Upload photos of existing spaces and experiment with different material combinations to see realistic results in context.",
    benefits: [
      "Test materials in real contexts",
      "See accurate lighting interactions",
      "Compare multiple options side-by-side",
      "Make confident material decisions"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    detailedExplanation: "Upload photos of existing built spaces—whether construction sites, renovation projects, or completed buildings—and use Renderiq's material testing capabilities to visualize different material options in context. The AI understands spatial relationships and lighting conditions, allowing you to see how materials interact with natural and artificial light. Use descriptive prompts like 'replace the floor with light oak hardwood' or 'change the wall finish to exposed brick' to test material combinations. Render chains automatically track your material explorations, making it easy to compare options and present alternatives to clients. This is invaluable for renovation projects, material selection meetings, and ensuring materials work harmoniously in the actual space."
  },
  {
    icon: LayoutGrid,
    title: "Instant Floor Plan Renders",
    slug: "instant-floor-plan-renders",
    description: "Convert 2D floor plans into stunning 3D visualizations instantly. Upload PDF, CAD, or image floor plans and generate photorealistic interior or exterior renders in under a minute.",
    benefits: [
      "No 3D modeling required",
      "30-60 second generation time",
      "Maintains spatial accuracy",
      "Perfect for client presentations"
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    detailedExplanation: "Upload your floor plan (PDF, PNG, JPG, or CAD exports) directly into the chat interface. Renderiq's architecture-aware AI recognizes spatial relationships, room layouts, and scale indicators from your plan. Describe your vision using natural language—for example, 'modern minimalist interior with light wood floors and white walls' or 'luxury residential space with high-end finishes.' The platform generates photorealistic renders that maintain your plan's proportions while adding realistic materials, furniture, and lighting. Use render chains to iterate on specific rooms or areas, refining details through conversation. This workflow eliminates the need for complex 3D modeling software, making professional visualizations accessible to architects, interior designers, and real estate professionals who work primarily with 2D plans."
  },
  {
    icon: Palette,
    title: "Style Testing with White Renders",
    slug: "style-testing-white-renders",
    description: "Create clean, neutral white renders to test different architectural styles, forms, and compositions without material distractions. Perfect for focusing on spatial design and massing.",
    benefits: [
      "Focus on form and composition",
      "Test architectural styles cleanly",
      "Compare design alternatives",
      "Professional presentation style"
    ],
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    detailedExplanation: "Generate white or neutral renders by specifying 'white render' or 'neutral material palette' in your prompts. This creates clean, minimalist visualizations that emphasize architectural form, spatial relationships, and composition without material distractions. Perfect for early design development, style exploration, and client presentations where you want to focus on the architecture itself rather than finishes. Upload sketches or models and request white renders to test different design approaches, compare massing options, or create professional presentation graphics. The platform's style transfer capabilities let you apply consistent white render aesthetics across multiple views, ensuring cohesive visual communication. Use render chains to explore variations while maintaining the clean aesthetic."
  },
  {
    icon: Video,
    title: "Rapid Concept Video Generation",
    slug: "rapid-concept-video",
    description: "Transform static renders into dynamic concept videos in minutes. Generate walkthrough animations, time-lapse sequences, or style transitions using Renderiq's video generation powered by Veo3.",
    benefits: [
      "30-second to 5-minute videos",
      "Multiple video models available",
      "Image-to-video conversion",
      "Perfect for presentations and social media"
    ],
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    detailedExplanation: "Create dynamic architectural visualizations by generating videos from your renders or sketches. Upload a render and use Renderiq's video generation (powered by Google Veo3) to create walkthrough animations, time-lapse sequences, or style transitions. Choose between Veo3 (higher quality) or Veo3 Fast (faster generation) models depending on your timeline. Videos can range from 30 seconds to 5 minutes, perfect for client presentations, social media content, or marketing materials. The platform supports text-to-video, image-to-video, and keyframe-sequence generation types, giving you flexibility in how you create motion. Use render chains to track video iterations and maintain consistency across sequences. This capability transforms static architectural visualization into engaging, dynamic content that better communicates spatial experience and design intent."
  },
  {
    icon: Boxes,
    title: "Massing Testing",
    slug: "massing-testing",
    description: "Test different building massing options quickly. Upload site plans or sketches and generate multiple massing studies to explore form, scale, and relationship to context.",
    benefits: [
      "Rapid massing exploration",
      "Context-aware generation",
      "Compare multiple options",
      "Early design validation"
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    detailedExplanation: "Upload site plans, aerial views, or context sketches and use Renderiq to generate multiple massing studies. The AI understands urban context, scale relationships, and architectural form, allowing you to explore different building volumes, heights, and configurations quickly. Describe massing options like 'tower with podium base' or 'low-rise courtyard building' and generate variations to compare. Use white or neutral renders to focus purely on form and massing without material distractions. Render chains help you track different massing iterations, making it easy to present options to clients or planning authorities. This workflow is essential for early-stage urban design, master planning, and architectural competitions where you need to explore multiple form options rapidly before committing to detailed design development."
  },
  {
    icon: Layers,
    title: "2D Elevations from Images",
    slug: "2d-elevations-from-images",
    description: "Transform photographs or sketches of building facades into clean, professional 2D elevation drawings. Perfect for documentation, analysis, and presentation purposes.",
    benefits: [
      "Convert photos to elevations",
      "Clean architectural linework",
      "Maintains proportions",
      "Professional documentation"
    ],
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    detailedExplanation: "Upload photographs of building facades, architectural sketches, or existing elevation drawings and use Renderiq to generate clean, professional 2D elevation visualizations. The AI recognizes architectural elements like windows, doors, materials, and proportions, creating accurate elevation representations. Use prompts like 'create a clean architectural elevation drawing' or 'convert to technical elevation view' to guide the output style. This is perfect for documenting existing buildings, creating presentation materials from site photos, or generating elevation studies from conceptual sketches. The platform maintains architectural accuracy while producing clean, professional drawings suitable for client presentations, planning submissions, or design documentation. Use render chains to refine elevation details and ensure consistency across multiple building faces."
  },
  {
    icon: FileImage,
    title: "Presentation Ready Graphics",
    slug: "presentation-ready-graphics",
    description: "Generate high-quality, presentation-ready architectural graphics suitable for client meetings, design reviews, and professional portfolios. Export in HD or 4K resolution.",
    benefits: [
      "HD and 4K export options",
      "Professional quality output",
      "Consistent visual style",
      "Ready for print and digital"
    ],
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    detailedExplanation: "Create presentation-ready graphics by leveraging Renderiq's high-quality rendering capabilities. The platform generates photorealistic outputs suitable for client presentations, design reviews, and professional portfolios. Choose from Standard (1 credit), High (2 credits), or Ultra (3 credits) quality settings depending on your needs. Export renders in HD (1920x1080) on the free tier or 4K (3840x2160) with Pro subscriptions, ensuring your graphics are ready for both digital presentations and print materials. Use consistent style prompts across multiple renders to maintain visual coherence in presentations. Render chains help you organize presentation sequences, making it easy to build narrative flows for client meetings. The platform's architecture-aware AI ensures professional quality outputs that accurately represent your design intent, suitable for the most demanding presentation contexts."
  },
  {
    icon: Share2,
    title: "Social Media Content",
    slug: "social-media-content",
    description: "Create engaging architectural content for social media platforms. Generate square, portrait, or landscape formats optimized for Instagram, LinkedIn, Twitter, and other platforms.",
    benefits: [
      "Platform-optimized formats",
      "Quick content generation",
      "Consistent brand style",
      "Engage audiences effectively"
    ],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    detailedExplanation: "Generate social media-ready architectural content by selecting aspect ratios optimized for different platforms—1:1 for Instagram posts, 9:16 for Stories and Reels, 16:9 for LinkedIn and Twitter. Upload sketches, renders, or photos and create engaging visual content that showcases your work. Use descriptive prompts to create compelling visuals that tell your design story effectively. Render chains help you maintain consistent visual style across your social media feed, building a cohesive brand presence. Generate multiple variations quickly to test what resonates with your audience. The platform's fast generation times (30-60 seconds) make it perfect for creating regular content without the overhead of traditional rendering workflows. Share directly from the gallery or export optimized images for your social media management tools."
  },
  {
    icon: ImageIcon,
    title: "Matching Render Mood to References",
    slug: "matching-render-mood",
    description: "Use reference images to match specific moods, styles, or atmospheres in your renders. Upload inspiration images and generate renders that capture the same lighting, color palette, and aesthetic.",
    benefits: [
      "Style transfer from references",
      "Match lighting and mood",
      "Consistent aesthetic across projects",
      "Learn from inspiration"
    ],
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    detailedExplanation: "Upload reference images—whether architectural photography, renderings, or mood boards—and use Renderiq's style transfer capabilities to match the mood, lighting, color palette, and aesthetic in your renders. The platform analyzes reference images to understand lighting conditions, material qualities, color schemes, and overall atmosphere, then applies these characteristics to your architectural visualizations. Use prompts like 'match the mood of this reference' or 'apply the lighting style from the uploaded image' to guide the generation. This is perfect for maintaining consistent visual language across a project, learning from successful architectural photography, or creating renders that match specific brand aesthetics. Render chains help you refine the mood matching, ensuring your renders capture the essence of your reference while maintaining architectural accuracy. This capability bridges the gap between inspiration and execution, helping you create renders that evoke the same emotional response as your reference imagery."
  }
];

const industryUseCases = [
  {
    icon: Home,
    title: "Residential Architecture",
    slug: "residential",
    description: "Design dream homes with AI-powered visualization",
    applications: ["Single-family homes", "Apartments", "Custom homes", "Renovations"]
  },
  {
    icon: Building2,
    title: "Commercial Projects",
    slug: "commercial",
    description: "Visualize office spaces and commercial buildings",
    applications: ["Office buildings", "Mixed-use", "Corporate facilities", "Coworking"]
  },
  {
    icon: Hotel,
    title: "Hospitality Design",
    slug: "hospitality",
    description: "Create stunning hotels and resort visualizations",
    applications: ["Hotels", "Resorts", "Restaurants", "Event venues"]
  },
  {
    icon: Building2,
    title: "Institutional Buildings",
    slug: "institutional",
    description: "Visualize government and institutional facilities",
    applications: ["Government buildings", "Cultural centers", "Courthouses", "Public facilities"]
  },
  {
    icon: School,
    title: "Educational Facilities",
    slug: "educational",
    description: "Plan modern learning environments",
    applications: ["Schools", "Universities", "Libraries", "Training centers"]
  },
  {
    icon: TreePine,
    title: "Landscape & Urban",
    slug: "landscape",
    description: "Design outdoor spaces and urban planning",
    applications: ["Parks", "Public spaces", "Site planning", "Urban design"]
  }
];

const features = [
  {
    title: "Interior Design AI",
    description: "Transform interior spaces with intelligent furniture placement, lighting, and material suggestions.",
    keywords: ["AI interior design", "furniture AI", "space planning"]
  },
  {
    title: "Exterior Visualization",
    description: "Create stunning building facades with realistic materials, lighting, and environmental context.",
    keywords: ["exterior rendering", "building facade AI", "architectural rendering"]
  },
  {
    title: "Site Planning",
    description: "Optimize site layouts with AI-powered analysis of terrain, orientation, and urban context.",
    keywords: ["site planning AI", "urban design", "landscape architecture"]
  },
  {
    title: "Lighting Simulation",
    description: "Accurate daylighting and artificial lighting analysis for any time and season.",
    keywords: ["lighting simulation", "daylight analysis", "architectural lighting"]
  }
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              AI Architecture Use Cases
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover 10 powerful ways to transform your architectural workflow with AI. From concept renders and floor plans 
              to video generation and presentation graphics—explore how Renderiq accelerates every stage of your design process.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-muted rounded-full">Concept Renders</span>
              <span className="px-3 py-1 bg-muted rounded-full">Floor Plans</span>
              <span className="px-3 py-1 bg-muted rounded-full">Video Generation</span>
              <span className="px-3 py-1 bg-muted rounded-full">Material Testing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              10 Essential AI Architecture Use Cases
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From early concept visualization to final presentation graphics—explore how Renderiq transforms every stage of your architectural workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {primaryUseCases.map((useCase) => (
              <Card key={useCase.slug} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${useCase.bgColor} flex items-center justify-center mb-4`}>
                    <useCase.icon className={`w-6 h-6 ${useCase.color}`} />
                  </div>
                  <CardTitle className="text-2xl mb-2">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {useCase.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${useCase.color} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  {useCase.detailedExplanation && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                      <h4 className="text-sm font-semibold mb-2 text-foreground">How It Works:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {useCase.detailedExplanation}
                      </p>
                    </div>
                  )}
                  <Link href={`/use-cases/${useCase.slug}`}>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry-Specific Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Industry-Specific Applications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored AI solutions for every architectural sector
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industryUseCases.map((industry) => (
              <Card key={industry.slug} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <industry.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{industry.title}</CardTitle>
                  <CardDescription>{industry.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {industry.applications.map((app, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {app}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/use-cases/${industry.slug}`} className="mt-4 inline-block">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                      Explore {industry.title}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete AI Design Suite
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern architectural visualization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.keywords.map((keyword, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Design Process?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of architects and designers using AI to create stunning visualizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

