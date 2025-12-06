import {
  Eye,
  LayoutGrid,
  PaintBucket,
  Palette,
  Video,
  Boxes,
  Layers,
  FileImage,
  Share2,
  Image as ImageIcon,
  Home,
  Building2,
  Hotel,
  School,
  TreePine,
} from 'lucide-react';

export const primaryUseCases = [
  {
    icon: Eye,
    title: "Concept Renders for Early Visualisation",
    slug: "concept-renders",
    description: "Transform rough sketches and initial design ideas into photorealistic visualizations in seconds. Perfect for early-stage design exploration and client communication before committing to detailed development.",
    features: [
      "Instant visualization from sketches",
      "Early client feedback and approval",
      "Explore multiple concepts rapidly",
      "Save weeks of development time"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: PaintBucket,
    title: "Material Testing in Built Spaces",
    slug: "material-testing-built-spaces",
    description: "Test how materials look and feel in actual built environments. Upload photos of existing spaces and experiment with different material combinations to see realistic results in context.",
    features: [
      "Test materials in real contexts",
      "See accurate lighting interactions",
      "Compare multiple options side-by-side",
      "Make confident material decisions"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: LayoutGrid,
    title: "Instant Floor Plan Renders",
    slug: "instant-floor-plan-renders",
    description: "Convert 2D floor plans into stunning 3D visualizations instantly. Upload PDF, CAD, or image floor plans and generate photorealistic interior or exterior renders in under a minute.",
    features: [
      "No 3D modeling required",
      "30-60 second generation time",
      "Maintains spatial accuracy",
      "Perfect for client presentations"
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Palette,
    title: "Style Testing with White Renders",
    slug: "style-testing-white-renders",
    description: "Create clean, neutral white renders to test different architectural styles, forms, and compositions without material distractions. Perfect for focusing on spatial design and massing.",
    features: [
      "Focus on form and composition",
      "Test architectural styles cleanly",
      "Compare design alternatives",
      "Professional presentation style"
    ],
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
  {
    icon: Video,
    title: "Rapid Concept Video Generation",
    slug: "rapid-concept-video",
    description: "Transform static renders into dynamic concept videos in minutes. Generate walkthrough animations, time-lapse sequences, or style transitions using Renderiq's video generation powered by Veo3.",
    features: [
      "30-second to 5-minute videos",
      "Multiple video models available",
      "Image-to-video conversion",
      "Perfect for presentations and social media"
    ],
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Boxes,
    title: "Massing Testing",
    slug: "massing-testing",
    description: "Test different building massing options quickly. Upload site plans or sketches and generate multiple massing studies to explore form, scale, and relationship to context.",
    features: [
      "Rapid massing exploration",
      "Context-aware generation",
      "Compare multiple options",
      "Early design validation"
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Layers,
    title: "2D Elevations from Images",
    slug: "2d-elevations-from-images",
    description: "Transform photographs or sketches of building facades into clean, professional 2D elevation drawings. Perfect for documentation, analysis, and presentation purposes.",
    features: [
      "Convert photos to elevations",
      "Clean architectural linework",
      "Maintains proportions",
      "Professional documentation"
    ],
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    icon: FileImage,
    title: "Presentation Ready Graphics",
    slug: "presentation-ready-graphics",
    description: "Generate high-quality, presentation-ready architectural graphics suitable for client meetings, design reviews, and professional portfolios. Export in HD or 4K resolution.",
    features: [
      "HD and 4K export options",
      "Professional quality output",
      "Consistent visual style",
      "Ready for print and digital"
    ],
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    icon: Share2,
    title: "Social Media Content",
    slug: "social-media-content",
    description: "Create engaging architectural content for social media platforms. Generate square, portrait, or landscape formats optimized for Instagram, LinkedIn, Twitter, and other platforms.",
    features: [
      "Platform-optimized formats",
      "Quick content generation",
      "Consistent brand style",
      "Engage audiences effectively"
    ],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: ImageIcon,
    title: "Matching Render Mood to References",
    slug: "matching-render-mood",
    description: "Use reference images to match specific moods, styles, or atmospheres in your renders. Upload inspiration images and generate renders that capture the same lighting, color palette, and aesthetic.",
    features: [
      "Style transfer from references",
      "Match lighting and mood",
      "Consistent aesthetic across projects",
      "Learn from inspiration"
    ],
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
] as const;

export const industryUseCases = [
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
  },
] as const;

