'use client';

import { CheckCircle2, XCircle, Ruler, Building2, Target, Award } from 'lucide-react';

const comparisons = [
  { aspect: 'Scale & Proportions', generic: false, renderiq: true },
  { aspect: 'Material Accuracy', generic: false, renderiq: true },
  { aspect: 'Structural Integrity', generic: false, renderiq: true },
  { aspect: 'AEC Standards', generic: false, renderiq: true },
];

export function Slide6AECFinetunes() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-4">
            <Award className="h-12 w-12 text-primary mx-auto" />
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4">
            AEC Finetunes & Technical Accuracy
          </h2>
          <p className="text-xl text-muted-foreground">
            Technically Correct Renders for AEC Professionals
          </p>
        </div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Generic AI */}
          <div className="text-center">
            <div className="bg-muted/50 rounded-xl p-8 mb-4 aspect-video flex items-center justify-center border-2 border-dashed border-destructive/50 relative overflow-hidden">
              <div className="text-center z-10">
                <div className="text-5xl mb-3">⚠️</div>
                <p className="text-muted-foreground text-lg font-semibold">Generic AI Render</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <XCircle className="h-32 w-32 text-destructive/60" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-muted-foreground mb-4">Generic AI</h3>
            <div className="space-y-3">
              {comparisons.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-3 bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20"
                >
                  <XCircle className="h-6 w-6 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">{comp.aspect}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Renderiq */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-primary/30 via-green-500/30 to-primary/30 rounded-xl p-8 mb-4 aspect-video flex items-center justify-center border-2 border-primary/50 relative overflow-hidden shadow-2xl">
              <div className="text-center z-10">
                <div className="text-6xl mb-3">✅</div>
                <p className="text-foreground text-xl font-bold">Renderiq Render</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-32 w-32 text-primary/60" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Renderiq</h3>
            <div className="space-y-3">
              {comparisons.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-3 bg-primary/10 rounded-lg px-4 py-2 border-2 border-primary/30"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground">{comp.aspect}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Ruler, title: 'Proper Scale', desc: 'Maintains accurate proportions', color: 'text-blue-500' },
            { icon: Building2, title: 'Structural Integrity', desc: 'Follows building codes', color: 'text-green-500' },
            { icon: Target, title: 'Material Accuracy', desc: 'Realistic material properties', color: 'text-primary' },
          ].map((feature, index) => (
            <div key={index} className="text-center p-5 bg-card/80 backdrop-blur-sm rounded-xl border-2 border-border shadow-lg">
              <div className="mb-3">
                <feature.icon className={`h-8 w-8 ${feature.color} mx-auto`} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
