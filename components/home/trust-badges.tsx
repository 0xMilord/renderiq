"use client";

import { SiSonarcloud } from 'react-icons/si';
import { HiShieldCheck } from 'react-icons/hi2';
import { BsAward, BsPeopleFill } from 'react-icons/bs';
import { TbClockCheck } from 'react-icons/tb';
import { VercelCard } from '@/components/ui/vercel-card';

const badges = [
  {
    icon: HiShieldCheck,
    title: 'Enterprise Security',
    description: 'SOC 2 Compliant',
  },
  {
    icon: BsAward,
    title: 'Industry Leader',
    description: 'Trusted by 10K+ Professionals',
  },
  {
    icon: BsPeopleFill,
    title: 'AEC Focused',
    description: 'Built for AEC Professionals',
  },
  {
    icon: TbClockCheck,
    title: '99.9% Uptime',
    description: 'Reliable & Available',
  },
  {
    icon: SiSonarcloud,
    title: 'GDPR Compliant',
    description: 'Your Data is Protected',
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30 w-full border-l-[2px] border-r-[2px] border-t-[2px] border-b-[2px] border-primary">
      <div className="w-full">
        <VercelCard className="overflow-visible" showIcons={true} bordered={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 w-full">
            {badges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div key={index} className="border-r border-b border-border bg-card/50 backdrop-blur-sm p-4 flex flex-row items-center gap-4 hover:bg-muted/50 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{badge.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </VercelCard>
      </div>
    </section>
  );
}












