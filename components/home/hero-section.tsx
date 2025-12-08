'use client';

import { memo, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Marquee } from '@/components/ui/marquee';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import { TickingNumber } from '@/components/ui/ticking-number';
import { HeroGallerySlideshow } from './hero-gallery-slideshow';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';

interface HeroSectionProps {
  avatarData: Array<{ imageUrl: string; profileUrl?: string }>;
  totalUsers: number;
  galleryItems?: GalleryItemWithDetails[];
}

const HeroSection = memo(function HeroSection({ avatarData, totalUsers, galleryItems = [] }: HeroSectionProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ REACT 19 OPTIMIZED: Memoize derived values
  const isDarkMode = useMemo(() => mounted && (resolvedTheme === 'dark' || theme === 'dark'), [mounted, resolvedTheme, theme]);
  
  // ✅ THEME-AWARE: Neutral colors that adapt to theme
  const borderColor = useMemo(() => isDarkMode ? 'hsl(0,0%,20%)' : 'hsl(0,0%,90%)', [isDarkMode]);
  const borderClass = useMemo(() => isDarkMode ? 'border-border' : 'border-border', [isDarkMode]);
  
  // Neutral background colors (theme-aware) - Semi-transparent to show grid background
  const heroBgColor = useMemo(() => isDarkMode ? 'bg-card/80 backdrop-blur-sm' : 'bg-background/80 backdrop-blur-sm', [isDarkMode]);
  const textColor = useMemo(() => isDarkMode ? 'text-foreground' : 'text-foreground', [isDarkMode]);
  const textMutedColor = useMemo(() => isDarkMode ? 'text-muted-foreground' : 'text-muted-foreground', [isDarkMode]);
  const buttonBgColor = useMemo(() => isDarkMode ? 'bg-foreground' : 'bg-foreground', [isDarkMode]);
  const buttonTextColor = useMemo(() => isDarkMode ? 'text-background' : 'text-background', [isDarkMode]);

  // ✅ OPTIMIZED: Memoize static firms array to prevent recreation on every render
  const firms = useMemo(() => [
    { name: 'Gensler', logo: '/logos/arch-firms/gensler.svg' },
    { name: 'AECOM', logo: '/logos/arch-firms/aecom.svg' },
    { name: 'Skidmore, Owings & Merrill', logo: '/logos/arch-firms/som.svg' },
    { name: 'HOK', logo: '/logos/arch-firms/hok.svg' },
    { name: 'Perkins&Will', logo: '/logos/arch-firms/perkins-will.svg' },
    { name: 'Foster + Partners', logo: '/logos/arch-firms/foster-partners.svg' },
    { name: 'Kohn Pedersen Fox', logo: '/logos/arch-firms/kpf.svg' },
    { name: 'BIG', logo: '/logos/arch-firms/big.svg' },
    { name: 'Snøhetta', logo: '/logos/arch-firms/snohetta.svg' },
    { name: 'Morphosis', logo: '/logos/arch-firms/morphosis.svg' },
    { name: 'BEHF Architects', logo: '/logos/arch-firms/BEHF_Architects_Logo.svg' },
    { name: 'Donald Insall Associates', logo: '/logos/arch-firms/Donald_Insall_Associates_logo.svg' },
    { name: 'Edward Williams Architects', logo: '/logos/arch-firms/Edward_Williams_Architects_logo_black.svg' },
    { name: 'Grimshaw', logo: '/logos/arch-firms/Grimshaw_Company_logo.svg' },
    { name: 'Henn Architekten', logo: '/logos/arch-firms/Henn_Architekten_Logo.svg' },
    { name: 'HKS', logo: '/logos/arch-firms/HKS,_Inc._Logo.svg' },
    { name: 'IKB', logo: '/logos/arch-firms/Ikb-logo.svg' },
    { name: 'KPMB Architects', logo: '/logos/arch-firms/KPMB_Architects_logo.svg' },
    { name: 'Nikken Sekkei', logo: '/logos/arch-firms/Nikken_Sekkei_company_logo.svg' },
    { name: 'Populous', logo: '/logos/arch-firms/Populous_logo.svg' },
    { name: 'Refuel Architecture', logo: '/logos/arch-firms/Refuel_architecture_logo.svg' },
    { name: 'RS & H', logo: '/logos/arch-firms/RS_&_H_logo.svg' },
    { name: 'SSP SchürmannSpannel', logo: '/logos/arch-firms/SSP_SchürmannSpannel_Firmenlogo.svg' },
    { name: 'WATG', logo: '/logos/arch-firms/WATG_logo.svg' },
    { name: 'Weber Thompson', logo: '/logos/arch-firms/Weber_Thompson_logo.svg' },
  ] as const, []);

  // Split firms into two rows for dual marquee effect
  const firstRow = useMemo(() => firms.slice(0, Math.ceil(firms.length / 2)), [firms]);
  const secondRow = useMemo(() => firms.slice(Math.ceil(firms.length / 2)), [firms]);

  return (
    <section className={`relative overflow-hidden w-full ${heroBgColor}`} style={{ paddingTop: 'var(--navbar-height)' }}>
      {/* Diagonal Stripe Pattern on Sides - Responsive - 2px width to match stroke */}
      <div className="absolute inset-y-0 left-0 hidden md:block md:w-16 lg:w-32 -z-0" style={{ 
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${borderColor} 8px, ${borderColor} 10px)`
      }}></div>
      <div className="absolute inset-y-0 right-0 hidden md:block md:w-16 lg:w-32 -z-0" style={{ 
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${borderColor} 8px, ${borderColor} 10px)`
      }}></div>

      {/* Main Container - Full Width with Grid */}
      <div className="w-full relative z-10">
        {/* Hero Content Section - Bordered Container */}
        <div className={`w-full border-t-[2px] border-b-[2px] border-l-[2px] border-r-[2px] ${borderClass}`}>
          <div className="pl-6 pr-6 sm:pl-[9.5rem] sm:pr-[9.5rem] md:pl-[10rem] md:pr-[10rem] lg:pl-[11rem] lg:pr-[11rem] py-12">
            {/* Main Headline Container */}
            <div className={`border-b-[2px] ${borderClass} pb-8 mb-8`}>
              <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black ${textColor} mb-6 leading-tight text-left`}>
                Idea to approval ready design in seconds
              </h1>
            </div>

            {/* Description Container */}
            <div className={`border-b-[2px] ${borderClass} pb-8 mb-8`}>
              <p className={`text-xl md:text-2xl ${textMutedColor} max-w-4xl leading-relaxed text-left`}>
                Transform architectural sketches and 3D models into photorealistic renders and videos with AI. 
                Industry-leading AI render pipelines for AEC firms. The leading <strong className={textColor}>architecture render software</strong> trusted by architects, engineers, and visualizers worldwide.
              </p>
            </div>

            {/* CTA Buttons Container */}
            <div className={`border-b-[2px] ${borderClass} pb-8 mb-8`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className={`flex flex-col sm:flex-row gap-4 sm:col-span-2 border-b-[2px] sm:border-b-0 sm:border-r-[2px] ${borderClass} pb-4 sm:pb-0 pr-0 sm:pr-4 mb-0`}>
                  <Link href="/render">
                    <Button 
                      size="lg" 
                      className={`px-8 py-6 text-lg font-bold ${buttonBgColor} hover:opacity-90 ${buttonTextColor} rounded-lg border border-border w-full sm:w-auto transition-opacity`}
                    >
                      Start Creating
                    </Button>
                  </Link>
                  <Link href="/gallery">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="px-8 py-6 text-lg font-bold rounded-lg border-2 w-full sm:w-auto"
                    >
                      View Demo
                    </Button>
                  </Link>
                </div>
                {avatarData.length > 0 && (
                  <div className="flex flex-col items-center sm:items-start gap-2 pl-0 sm:pl-4 pt-4 sm:pt-0">
                    <AvatarCircles 
                      numPeople={totalUsers}
                      avatarUrls={avatarData}
                      className="justify-center sm:justify-start"
                    />
                  </div>
                )}
              </div>
              <p className={`text-base md:text-lg ${textMutedColor} mt-4`}>
                No credit card required
              </p>
            </div>

            {/* Stats Section - Two Column Layout: Table (40%) + Hero Illustration (60%) */}
            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-0">
              {/* Left Column - Table (40% max width) */}
              <div className={`border-b-[2px] lg:border-b-0 lg:border-r-[2px] ${borderClass} pr-6 sm:pr-8 pb-6 sm:pb-8 lg:pb-0`}>
                <table className="w-full border-collapse">
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '60%' }} />
                  </colgroup>
                  <tbody>
                    <tr className={`border-b-[2px] ${borderClass}`}>
                      <td className="py-6 pr-4 align-middle">
                        <div className={`text-5xl md:text-6xl font-black ${textColor}`}>
                          <TickingNumber value="50K+" duration={2000} />
                        </div>
                      </td>
                      <td className={`py-6 pl-4 align-middle border-l-[2px] ${borderClass}`}>
                        <div className={`text-base font-semibold ${textMutedColor}`}>Renders Created</div>
                      </td>
                    </tr>
                    <tr className={`border-b-[2px] ${borderClass}`}>
                      <td className="py-6 pr-4 align-middle">
                        <div className={`text-5xl md:text-6xl font-black ${textColor}`}>
                          <TickingNumber value="2.5M" duration={2000} />
                        </div>
                      </td>
                      <td className={`py-6 pl-4 align-middle border-l-[2px] ${borderClass}`}>
                        <div className={`text-base font-semibold ${textMutedColor}`}>Minutes Saved</div>
                      </td>
                    </tr>
                    <tr className={`border-b-[2px] ${borderClass}`}>
                      <td className="py-6 pr-4 align-middle">
                        <div className={`text-5xl md:text-6xl font-black ${textColor}`}>
                          <TickingNumber value="10K+" duration={2000} />
                        </div>
                      </td>
                      <td className={`py-6 pl-4 align-middle border-l-[2px] ${borderClass}`}>
                        <div className={`text-base font-semibold ${textMutedColor}`}>AEC Professionals</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-6 pr-4 align-middle">
                        <div className={`text-5xl md:text-6xl font-black ${textColor}`}>
                          <TickingNumber value="99%" duration={2000} />
                        </div>
                      </td>
                      <td className={`py-6 pl-4 align-middle border-l-[2px] ${borderClass}`}>
                        <div className={`text-base font-semibold ${textMutedColor}`}>Platform Uptime</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column - Gallery Slideshow (60%) */}
              <div className="pl-6 sm:pl-8 lg:pl-8 pt-6 sm:pt-8 lg:pt-0 flex items-center justify-center">
                <HeroGallerySlideshow items={galleryItems} interval={4000} />
              </div>
            </div>
          </div>
        </div>

        {/* Used By Section - Full Width Marquee with Border */}
        <div className={`w-full border-b-[2px] border-l-[2px] border-r-[2px] ${borderClass} ${heroBgColor}`}>
          <div className="py-8">
            <p className={`text-xl md:text-3xl ${textMutedColor} text-center mb-6 font-semibold mx-auto`}>
              Used by top Architects, Engineers, and Visualizers at
            </p>
            <div className={`border-b-[2px] ${borderClass} mx-auto max-w-7xl`}></div>
            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden mt-6">
              <Marquee pauseOnHover className="[--duration:20s]">
                {firstRow.map((firm, index) => (
                  <div
                    key={`${firm.name}-first-${index}`}
                    className="flex items-center justify-center h-16 md:h-20 px-8 shrink-0"
                  >
                    <Image
                      src={firm.logo}
                      alt={`${firm.name} logo`}
                      width={120}
                      height={60}
                      className={cn(
                        "max-w-full max-h-full object-contain transition-opacity hover:opacity-100",
                        isDarkMode 
                          ? "opacity-70 [filter:grayscale(100%)brightness(1.5)invert(0.4)]" 
                          : "opacity-70 [filter:grayscale(100%)brightness(0.4)invert(0.1)]"
                      )}
                      loading="lazy"
                    />
                  </div>
                ))}
              </Marquee>
              <Marquee reverse pauseOnHover className="[--duration:20s]">
                {secondRow.map((firm, index) => (
                  <div
                    key={`${firm.name}-second-${index}`}
                    className="flex items-center justify-center h-16 md:h-20 px-8 shrink-0"
                  >
                    <Image
                      src={firm.logo}
                      alt={`${firm.name} logo`}
                      width={120}
                      height={60}
                      className={cn(
                        "max-w-full max-h-full object-contain transition-opacity hover:opacity-100",
                        isDarkMode 
                          ? "opacity-70 [filter:grayscale(100%)brightness(1.5)invert(0.4)]" 
                          : "opacity-70 [filter:grayscale(100%)brightness(0.4)invert(0.1)]"
                      )}
                      loading="lazy"
                    />
                  </div>
                ))}
              </Marquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;

