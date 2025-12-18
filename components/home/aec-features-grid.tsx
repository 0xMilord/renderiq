"use client";

import { cn } from "@/lib/utils";
import {
  Brain,
  Eye,
  Sparkles,
  Route,
  Image,
  CheckCircle,
  Database,
} from "lucide-react";

const features = [
  {
    title: "Semantic Parsing",
    description: "AI extracts design intent, materials & AEC requirements from prompts",
    icon: <Brain className="w-6 h-6" />,
  },
  {
    title: "Image Understanding",
    description: "Vision models analyze reference images for style, palette & geometry",
    icon: <Eye className="w-6 h-6" />,
  },
  {
    title: "Prompt Optimization",
    description: "Intelligent prompt enhancement for architectural accuracy",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    title: "Smart Model Routing",
    description: "Auto-selects optimal AI model based on task complexity",
    icon: <Route className="w-6 h-6" />,
  },
  {
    title: "Image Generation",
    description: "Multi-model support with up to 4K resolution outputs",
    icon: <Image className="w-6 h-6" />,
  },
  {
    title: "AI Validation",
    description: "Validates perspective, proportions & architectural elements",
    icon: <CheckCircle className="w-6 h-6" />,
  },
  {
    title: "Pipeline Memory",
    description: "Maintains style consistency across renders in a chain",
    icon: <Database className="w-6 h-6" />,
  },
];

export function AECFeaturesGrid() {
  // Duplicate for seamless loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <div className="relative w-full h-full min-h-[200px] overflow-hidden">
      <div className="flex animate-marquee-aec h-full">
        {duplicatedFeatures.map((feature, index) => (
          <div
            key={`${feature.title}-${index}`}
            className="flex-shrink-0 w-1/3 md:w-1/3 lg:w-1/4 h-full border-r border-border last:border-r-0"
          >
            <Feature {...feature} />
          </div>
        ))}
      </div>
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col justify-center h-full py-4 md:py-6 px-3 md:px-4 relative group/feature">
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      <div className="mb-2 md:mb-3 relative z-10 text-muted-foreground group-hover/feature:text-primary transition-colors">
        {icon}
      </div>
      <div className="text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-2 relative z-10">
        <div className="absolute left-0 inset-y-0 h-4 md:h-5 lg:h-6 group-hover/feature:h-5 md:group-hover/feature:h-6 lg:group-hover/feature:h-7 w-0.5 rounded-tr-full rounded-br-full bg-border group-hover/feature:bg-primary transition-all duration-200 origin-center -ml-3 md:-ml-4" />
        <span className="group-hover/feature:translate-x-1 transition duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>
      <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground leading-relaxed relative z-10 line-clamp-3">
        {description}
      </p>
    </div>
  );
};
