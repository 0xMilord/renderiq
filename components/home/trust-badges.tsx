import { Shield, Award, Users, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const badges = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 Compliant',
  },
  {
    icon: Award,
    title: 'Industry Leader',
    description: 'Trusted by 10K+ Professionals',
  },
  {
    icon: Users,
    title: 'AEC Focused',
    description: 'Built for AEC Professionals',
  },
  {
    icon: Clock,
    title: '99.9% Uptime',
    description: 'Reliable & Available',
  },
  {
    icon: CheckCircle,
    title: 'GDPR Compliant',
    description: 'Your Data is Protected',
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30 w-full border-l-[5px] border-r-[5px] border-t-[5px] border-b-[5px] border-primary">
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 border-border bg-card/50 backdrop-blur-sm w-full">
                <CardContent className="py-4 px-4 flex flex-row items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{badge.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}







