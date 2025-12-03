import { Shield, Award, Users, Clock, CheckCircle } from 'lucide-react';

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
    title: 'AEC & Retail Focused',
    description: 'Built for Your Industry',
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
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



