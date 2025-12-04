'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Sparkles, Award } from 'lucide-react';
import { FaCube } from 'react-icons/fa';
import { SiGooglegemini, SiOpenai } from 'react-icons/si';
import { MdImage } from 'react-icons/md';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

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
    feature: 'Structural Integrity',
    renderiq: true,
    traditional3d: true,
    midjourney: false,
    gemini: false,
    openai: false,
  },
  {
    feature: 'Speed (Generation Time)',
    renderiq: '< 30s',
    traditional3d: 'Hours/Days',
    midjourney: '1-2 min',
    gemini: '30-60s',
    openai: '30-60s',
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
  { name: 'Renderiq', icon: Sparkles, color: 'text-primary', bgColor: 'bg-primary/20', borderColor: 'border-primary', textColor: 'text-primary' },
  { name: 'Traditional 3D', icon: FaCube, color: 'text-foreground', bgColor: 'bg-muted', borderColor: 'border-border', textColor: 'text-foreground' },
  { name: 'Midjourney', icon: MdImage, color: 'text-foreground', bgColor: 'bg-muted', borderColor: 'border-border', textColor: 'text-foreground' },
  { name: 'Gemini', icon: SiGooglegemini, color: 'text-foreground', bgColor: 'bg-muted', borderColor: 'border-border', textColor: 'text-foreground' },
  { name: 'OpenAI', icon: SiOpenai, color: 'text-foreground', bgColor: 'bg-muted', borderColor: 'border-border', textColor: 'text-foreground' },
];

export function Slide6AECFinetunes() {
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    // Calculate timing: slide duration = 10s, read time = 3s, so population time = 7s
    // With 10 rows: 7s / 10 rows = 700ms per row
    const SLIDE_DURATION = 10000; // 10 seconds
    const READ_TIME = 3000; // 3 seconds read time after all rows are shown
    const POPULATION_TIME = SLIDE_DURATION - READ_TIME; // 7 seconds
    const ROW_COUNT = comparisonData.length; // 10 rows
    const TIME_PER_ROW = POPULATION_TIME / ROW_COUNT; // 700ms per row

    // Show one row at a time with animation
    const interval = setInterval(() => {
      setVisibleRows((prev) => {
        if (prev >= comparisonData.length) {
          // Reset after showing all rows + read time
          setTimeout(() => setVisibleRows(0), READ_TIME);
          return prev;
        }
        return prev + 1;
      });
    }, TIME_PER_ROW); // Show next row every 700ms

    return () => clearInterval(interval);
  }, []);

  const renderCell = (value: boolean | string, isRenderiq: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle2 className={`h-8 w-8 sm:h-10 sm:w-10 ${isRenderiq ? 'text-primary' : 'text-green-500'}`} />
      ) : (
        <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
      );
    }
    return (
      <span className={`text-[20px] sm:text-2xl font-medium ${isRenderiq ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Renderiq vs. The Competition
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              See why Renderiq is the best choice for AEC professionals. AEC-specific training and accuracy.
            </p>
          </div>
          {/* QR Code - Right Edge */}
          <div className="flex-shrink-0 flex flex-row items-center gap-1.5">
            <div className="p-0.5 bg-primary/10 rounded border border-primary/30 flex-shrink-0">
              <QRCodeSVG
                value="https://renderiq.io/api/qr-signup"
                size={50}
                level="M"
                includeMargin={false}
                className="rounded"
                fgColor="hsl(var(--primary))"
                bgColor="transparent"
              />
            </div>
            <p className="text-[12px] text-primary font-semibold leading-tight max-w-[100px]">
              Visualize UniAcoustics products on Renderiq!
            </p>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[98vw] relative z-10 flex-1 flex flex-col min-h-0 p-2 sm:p-4">

        {/* Comparison Table */}
        <div className="bg-card/95 backdrop-blur-md rounded-xl border-2 border-border shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/60 border-b-2 border-border flex-shrink-0">
            <div className="text-xs sm:text-sm md:text-base font-bold text-foreground flex items-center">
              Feature
            </div>
            {platforms.map((platform, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center gap-1 p-1 sm:p-2 rounded-lg ${platform.bgColor} ${platform.borderColor} border-2`}
              >
                <platform.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${platform.color}`} />
                <span className={`font-semibold text-foreground text-[10px] sm:text-xs md:text-sm text-center ${platform.textColor}`}>
                  {platform.name}
                </span>
              </div>
            ))}
          </div>

          {/* Table Rows - All Visible */}
          <div className="divide-y divide-border flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {comparisonData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-3 flex-shrink-0 transition-all duration-700 ease-out ${
                    rowIndex < visibleRows
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
                  }`}
                  style={{
                    transitionDelay: `${rowIndex * 70}ms`,
                  } as React.CSSProperties}
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
        </div>
      </div>
    </div>
  );
}
