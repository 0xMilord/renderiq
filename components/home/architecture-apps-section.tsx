'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ShineBorder } from '@/components/ui/shine-border';
import { VercelCard } from '@/components/ui/vercel-card';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { getAllTools } from '@/lib/tools/registry';
import { getEffectiveToolStatus } from '@/lib/tools/feature-flags';
import { 
  FaArrowRight,
  FaVideo
} from 'react-icons/fa';

// Icon mapping for each specific app (matching navbar mapping)
// Get custom SVG icon path for apps (uses app ID, not slug, since icon files use IDs)
const getAppIconPath = (tool: { id: string; outputType: string }): string | null => {
  // For video apps, use a special icon or return null to use default
  if (tool.outputType === 'video') {
    return null; // Will use FaVideo fallback
  }
  return `/apps/icons/${tool.id}.svg`;
};

export function ArchitectureAppsSection() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  // Theme-aware neutral border color
  const borderClass = 'border-border';

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
    <section id="architecture-apps" className="w-full overflow-x-hidden relative border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
      <div className="w-full relative">
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <DecoratedText className="text-sm font-medium px-3 py-1.5 mb-4">
              Architecture Apps
            </DecoratedText>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              New Architecture Apps
              <span className="block text-muted-foreground mt-2">Powerful tools for AEC professionals</span>
            </h2>
            <p className="text-xl max-w-3xl text-muted-foreground">
              Explore our comprehensive suite of{" "}
              <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                AI-powered tools
              </Highlighter>{" "}
              designed specifically for architecture, engineering, and construction workflows
            </p>
          </div>
        </div>
      </div>

      <div className={`w-full relative border-l-[2px] border-b-[2px] ${borderClass}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background">
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-0">
            {/* Left Column - 70% - App Cards Grid */}
            <div className={`pr-4 lg:pr-6 border-r-0 lg:border-r-[2px] ${borderClass} pb-8 lg:pb-0`}>
              <VercelCard className="overflow-visible" showIcons={true} bordered>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedTools.map((tool) => {
                  const effectiveStatus = getEffectiveToolStatus(tool.id, tool.status);
                  const isOffline = effectiveStatus === 'offline';
                  const iconPath = getAppIconPath(tool);

                  return (
                    <Link key={tool.id} href={`/${tool.slug}`} className="block">
                      <div className={`hover:bg-muted/50 transition-all duration-300 group cursor-pointer flex flex-col h-full border-r border-b border-border bg-card ${isOffline ? 'opacity-75' : ''}`}>
                        <div className="p-4 flex flex-col items-center justify-center h-full">
                          {/* Icon on Top, Name on Bottom - Vertical Stack */}
                          <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-3 ${tool.color ? `${tool.color}/10` : 'bg-primary/10'} overflow-hidden`}>
                            {iconPath ? (
                              <img 
                                src={iconPath} 
                                alt={tool.name}
                                className="w-full h-full object-contain rounded-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <FaVideo className={`h-6 w-6 ${tool.color || 'text-primary'}`} />
                            )}
                          </div>
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight text-center line-clamp-2">
                            {tool.name}
                          </span>
                          
                          {/* Badge Below */}
                          {isOffline && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 mt-2">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {/* Explore All Apps Card */}
                <Link href="/apps" className="block">
                  <div className="hover:bg-muted/50 transition-all duration-300 group cursor-pointer flex flex-col h-full border-r border-b border-border bg-card">
                    <div className="p-4 flex flex-col items-center justify-center h-full">
                      {/* Icon on Top, Name on Bottom - Vertical Stack */}
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-primary/10">
                        <FaArrowRight className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight text-center line-clamp-2">
                        Explore All Apps
                      </span>
                    </div>
                  </div>
                </Link>
                </div>
              </VercelCard>
            </div>

            {/* Right Column - 30% - Text Information in 4 Rows */}
            <div className="pl-4 lg:pl-6 pt-8 lg:pt-0">
              <div className="flex flex-col h-full">
                {/* Row 1 */}
                <div className={`pb-6 border-b-[2px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Streamline Workflows</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automate repetitive tasks and{" "}
                    <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                      transform your design
                    </Highlighter>{" "}
                    process from hours to minutes with AI-powered tools that understand architectural context.
                  </p>
                </div>

                {/* Row 2 */}
                <div className={`py-6 border-b-[2px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Enhance Presentations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create professional visualizations, technical diagrams, and presentation materials that{" "}
                    <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                      impress clients
                    </Highlighter>{" "}
                    and communicate your vision effectively.
                  </p>
                </div>

                {/* Row 3 */}
                <div className={`py-6 border-b-[2px] ${borderClass}`}>
                  <h3 className="text-lg font-bold text-foreground mb-3">Iterate Faster</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Test multiple design variations, material options, and lighting scenarios{" "}
                    <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                      instantly
                    </Highlighter>{" "}
                    without complex 3D modeling or rendering pipelines.
                  </p>
                </div>

                {/* Row 4 */}
                <div className="pt-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">Save Time & Resources</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reduce project timelines and development costs by generating professional-quality renders and technical drawings{" "}
                    <Highlighter action="highlight" color="#D1F24A" textColor="#000000">
                      in seconds
                    </Highlighter>
                    , not days.
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
