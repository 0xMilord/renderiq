'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllTools } from '@/lib/tools/registry';
import { getEffectiveToolStatus } from '@/lib/tools/feature-flags';
import { 
  FaWrench, 
  FaHome, 
  FaLayerGroup, 
  FaPaintBrush, 
  FaCouch, 
  FaCube, 
  FaFileAlt, 
  FaVideo,
  FaArrowRight,
  FaExpand,
  FaMagic,
  FaSquare,
  FaBox,
  FaThLarge,
  FaCut,
  FaSync,
  FaPalette,
  FaBrush,
  FaSun,
  FaBoxOpen,
  FaExchangeAlt,
  FaImage,
  FaFile,
  FaFilm,
  FaTh
} from 'react-icons/fa';

// Icon mapping for each specific tool (matching navbar mapping)
const getToolIcon = (tool: { id: string; category: string; outputType: string }) => {
  if (tool.outputType === 'video') {
    return FaVideo;
  }
  
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Transformation tools
    'render-section-drawing': FaLayerGroup,
    'render-to-cad': FaSquare,
    'render-upscale': FaExpand,
    'render-effects': FaMagic,
    
    // Floorplan tools
    'floorplan-to-furnished': FaCouch,
    'floorplan-to-3d': FaBox,
    'floorplan-technical-diagrams': FaThLarge,
    
    // Diagram tools
    'exploded-diagram': FaCut,
    'multi-angle-view': FaSync,
    
    // Material tools
    'change-texture': FaPalette,
    'material-alteration': FaBrush,
    'change-lighting': FaSun,
    
    // Interior tools
    'upholstery-change': FaCouch,
    'product-placement': FaBoxOpen,
    'item-change': FaExchangeAlt,
    'moodboard-to-render': FaImage,
    
    // 3D tools
    '3d-to-render': FaBox,
    'sketch-to-render': FaFile,
    
    // Presentation tools
    'presentation-board-maker': FaTh,
    'portfolio-layout-generator': FaFile,
    'presentation-sequence-creator': FaFilm,
  };
  
  // Return specific icon or fallback to category-based icon
  if (iconMap[tool.id]) {
    return iconMap[tool.id];
  }
  
  // Fallback to category-based icons
  switch (tool.category) {
    case 'transformation':
      return FaWrench;
    case 'floorplan':
      return FaHome;
    case 'diagram':
      return FaLayerGroup;
    case 'material':
      return FaPaintBrush;
    case 'interior':
      return FaCouch;
    case '3d':
      return FaCube;
    case 'presentation':
      return FaFileAlt;
    default:
      return FaFileAlt;
  }
};

export function ArchitectureAppsSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  // Primary color (lime green) for strokes in both light and dark mode
  const borderClass = 'border-[hsl(72,87%,62%)]';

  const tools = getAllTools();
  // ✅ OPTIMIZED: Memoize sorted tools to avoid recalculating on every render
  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      // Sort by status first (online apps first), then by priority, then by name
      const aStatus = getEffectiveToolStatus(a.id, a.status);
      const bStatus = getEffectiveToolStatus(b.id, b.status);
      if (aStatus !== bStatus) {
        return aStatus === 'online' ? -1 : 1;
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [tools]);

  return (
    <section id="architecture-apps" className="w-full overflow-x-hidden relative bg-background/80 backdrop-blur-sm">
      <div className={`w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[50%_50%] gap-0 relative pt-8">
            {/* Column 1 - 50% - Text, Description, and Tag */}
            <div className="text-left relative pb-6 lg:pb-8 pr-0 lg:pr-6">
              <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
                Architecture Apps
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                New Architecture Apps
                <span className="block text-muted-foreground mt-2">Powerful tools for AEC professionals</span>
              </h2>
              <p className="text-xl max-w-3xl text-muted-foreground">
                Explore our comprehensive suite of AI-powered tools designed specifically for architecture, engineering, and construction workflows
              </p>
            </div>

            {/* Column 2 - 50% - Illustration */}
            <div className="relative flex items-center justify-center lg:justify-end pb-6 lg:pb-8 pl-0 lg:pl-6">
              <div className="relative w-full h-full min-h-[200px] lg:min-h-[300px] max-w-md">
                <Image
                  src="/home/architecture-apps-section.svg"
                  alt="Architecture Apps Illustration"
                  fill
                  className="object-contain object-center lg:object-right"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`w-full relative border-l-[5px] border-b-[5px] ${borderClass}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background">
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-0">
            {/* Left Column - 70% - App Cards Grid */}
            <div className={`pr-4 lg:pr-6 border-r-0 lg:border-r-[5px] ${borderClass} pb-8 lg:pb-0`}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedTools.map((tool) => {
                  const effectiveStatus = getEffectiveToolStatus(tool.id, tool.status);
                  const isOffline = effectiveStatus === 'offline';
                  const Icon = getToolIcon(tool);

                  return (
                    <Link key={tool.id} href={`/apps/${tool.slug}`} className="block">
                      <Card className={`hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-full ${isOffline ? 'opacity-75' : ''}`}>
                        <CardHeader className="p-4 flex flex-col h-full">
                          {/* Image and Title in Same Row - 2 Column Format */}
                          <div className="grid grid-cols-[auto_1fr] gap-3 items-start mb-2 flex-shrink-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.color || 'bg-primary'} bg-opacity-10`}>
                              <Icon className={`h-5 w-5 ${tool.color || 'text-primary'}`} />
                            </div>
                            <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
                              {tool.name}
                            </CardTitle>
                          </div>
                          
                          {/* Badge Below */}
                          <div className="mt-auto">
                            {isOffline && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
                {/* Explore All Apps Card */}
                <Link href="/apps" className="block">
                  <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col h-full">
                    <CardHeader className="p-4 flex flex-col h-full">
                      {/* Image and Title in Same Row - 2 Column Format */}
                      <div className="grid grid-cols-[auto_1fr] gap-3 items-start mb-2 flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary bg-opacity-10">
                          <FaArrowRight className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
                          Explore All Apps
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Right Column - 30% - Text Information in 4 Rows */}
            <div className="pl-4 lg:pl-6 pt-8 lg:pt-0">
              <div className="flex flex-col h-full">
                {/* Row 1 */}
                <div className={`pb-6 border-b-[5px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Streamline Workflows</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automate repetitive tasks and transform your design process from hours to minutes with AI-powered tools that understand architectural context.
                  </p>
                </div>

                {/* Row 2 */}
                <div className={`py-6 border-b-[5px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Enhance Presentations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create professional visualizations, technical diagrams, and presentation materials that impress clients and communicate your vision effectively.
                  </p>
                </div>

                {/* Row 3 */}
                <div className={`py-6 border-b-[5px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Iterate Faster</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Test multiple design variations, material options, and lighting scenarios instantly without complex 3D modeling or rendering pipelines.
                  </p>
                </div>

                {/* Row 4 */}
                <div className="pt-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">Save Time & Resources</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reduce project timelines and development costs by generating professional-quality renders and technical drawings in seconds, not days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
