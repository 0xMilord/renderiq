'use client';

import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { FaCube } from 'react-icons/fa';
import { SiGooglegemini, SiOpenai } from 'react-icons/si';
import { MdImage } from 'react-icons/md';
import { Badge } from '@/components/ui/badge';
import { DecoratedText } from '@/components/ui/decorated-text';
import { Highlighter } from '@/components/ui/highlighter';
import { VercelCard } from '@/components/ui/vercel-card';

interface ComparisonRow {
  feature: string;
  renderiq: boolean | string;
  traditional3d: boolean | string;
  midjourney: boolean | string;
  gemini: boolean | string;
  openai: boolean | string;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: 'AEC-Specific Training',
    renderiq: true,
    traditional3d: false,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Speed (Generation Time)',
    renderiq: '< 10s',
    traditional3d: 'Hours/Days',
    midjourney: '1-2 min',
    gemini: '30-60s',
    openai: '30-60s',
  },
  {
    feature: 'Node-Based Canvas Editor',
    renderiq: true,
    traditional3d: true,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'AEC Tools (/apps route)',
    renderiq: true,
    traditional3d: false,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Scale & Proportions Accuracy',
    renderiq: true,
    traditional3d: true,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Material Accuracy',
    renderiq: true,
    traditional3d: true,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Ease of Use',
    renderiq: true,
    traditional3d: false,
    midjourney: true,
    gemini: true,
    openai: true,
  },
  {
    feature: 'Cost Efficiency',
    renderiq: 'Low',
    traditional3d: 'High',
    midjourney: 'Medium',
    gemini: 'Medium',
    openai: 'Medium',
  },
  {
    feature: 'Version Control',
    renderiq: true,
    traditional3d: false,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Reference Previous Renders',
    renderiq: true,
    traditional3d: false,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Video Generation',
    renderiq: true,
    traditional3d: true,
    midjourney: false,
    gemini: false,
    openai: false,
  },
];

const platforms = [
  { 
    name: 'Renderiq', 
    icon: Sparkles, 
    color: 'text-primary', 
    bgColor: 'bg-primary/20', 
    borderColor: 'border-primary', 
    textColor: 'text-primary',
    highlight: true,
  },
  { 
    name: 'Traditional 3D', 
    icon: FaCube, 
    color: 'text-foreground', 
    bgColor: 'bg-muted', 
    borderColor: 'border-border', 
    textColor: 'text-foreground',
    highlight: false,
  },
  { 
    name: 'Midjourney', 
    icon: MdImage, 
    color: 'text-foreground', 
    bgColor: 'bg-muted', 
    borderColor: 'border-border', 
    textColor: 'text-foreground',
    highlight: false,
  },
  { 
    name: 'Gemini', 
    icon: SiGooglegemini, 
    color: 'text-foreground', 
    bgColor: 'bg-muted', 
    borderColor: 'border-border', 
    textColor: 'text-foreground',
    highlight: false,
  },
  { 
    name: 'OpenAI', 
    icon: SiOpenai, 
    color: 'text-foreground', 
    bgColor: 'bg-muted', 
    borderColor: 'border-border', 
    textColor: 'text-foreground',
    highlight: false,
  },
];

export function ComparisonSection() {
  const renderCell = (value: boolean | string, isRenderiq: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle2 className={`h-5 w-5 sm:h-6 sm:w-6 ${isRenderiq ? 'text-primary' : 'text-green-500'}`} />
      ) : (
        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/40" />
      );
    }
    // Use suppressHydrationWarning to prevent errors from browser extensions or cached content
    return (
      <span 
        className={`text-base sm:text-lg font-medium ${isRenderiq ? 'text-primary' : 'text-foreground'}`}
        suppressHydrationWarning
      >
        {String(value)}
      </span>
    );
  };

  return (
    <section id="comparison" className="py-8 px-8 bg-background/80 backdrop-blur-sm w-full border border-dotted border-black/[0.2] dark:border-white/[0.2] -mt-[1px]">
      <div className="w-full max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="text-center">
            <DecoratedText className="text-xs sm:text-sm font-medium px-3 py-1.5 mb-3 sm:mb-4">
              Comparison
            </DecoratedText>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Why Choose Renderiq?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Compare Renderiq with{" "}
              <Highlighter action="underline" color="#D1F24A">
                traditional render software
              </Highlighter>{" "}
              and other AI tools
            </p>
          </div>
        </div>

        {/* Comparison Table - Full Width */}
        <div className="w-full">
          <VercelCard className="overflow-visible" showIcons={true} bordered>
            <div className="bg-card/95 backdrop-blur-md overflow-x-auto overflow-y-visible">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(120px,1.5fr)_repeat(5,1fr)] gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/60 border-b-2 border-border">
              <div className="text-xs sm:text-sm md:text-base font-bold text-foreground flex items-center">
                Feature
              </div>
              {platforms.map((platform, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg ${platform.bgColor} ${platform.borderColor} border-2 relative`}
                >
                  <platform.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${platform.color}`} />
                  <span className={`font-semibold text-[10px] sm:text-xs md:text-sm text-center ${platform.textColor}`}>
                    {platform.name}
                  </span>
                  {platform.highlight && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      Best
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border">
              {comparisonData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-[minmax(120px,1.5fr)_repeat(5,1fr)] gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="text-xs sm:text-sm md:text-base font-semibold text-foreground flex items-center">
                    {row.feature}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCell(row.renderiq, true)}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCell(row.traditional3d)}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCell(row.midjourney)}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCell(row.gemini)}
                  </div>
                  <div className="flex items-center justify-center">
                    {renderCell(row.openai)}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </VercelCard>
        </div>
      </div>
    </section>
  );
}

