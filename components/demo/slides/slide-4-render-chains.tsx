'use client';

import { GitBranch, History, RefreshCw, Link2 } from 'lucide-react';

const versions = [
  { id: 'v1', label: 'v1', title: 'Initial Render', color: 'from-blue-500/30 to-blue-600/40', icon: '🏗️' },
  { id: 'v2', label: 'v2', title: 'Refined Render', color: 'from-primary/30 to-primary/50', icon: '✨' },
  { id: 'v3', label: 'v3', title: 'Final Render', color: 'from-primary/30 to-primary/50', icon: '🎯' },
];

export function Slide4RenderChains() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GitBranch className="h-10 w-10 text-primary" />
            <h2 className="text-4xl md:text-6xl font-extrabold text-foreground">
              Render Chains & Version Control
            </h2>
          </div>
          <p className="text-xl text-muted-foreground">
            Iterate with Context - Reference Any Version
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mb-12">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/80 w-full" />
          </div>

          {/* Version Cards */}
          <div className="relative flex items-center justify-between gap-6">
            {versions.map((version) => (
              <div key={version.id} className="flex-1">
                <div className={`bg-gradient-to-br ${version.color} rounded-xl p-6 border-2 border-primary/30 relative overflow-hidden`}>
                  {/* Version Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {version.label}
                  </div>

                  {/* Render Preview */}
                  <div className="aspect-video bg-background/60 rounded-lg mb-4 flex items-center justify-center border-2 border-border relative overflow-hidden">
                    <div className="text-5xl">
                      {version.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground text-center mb-3">
                    {version.title}
                  </h3>

                  {/* Reference Example */}
                  <div className="bg-background/40 rounded-lg px-4 py-2 text-center border border-border">
                    <code className="text-xs font-mono text-foreground font-semibold">
                      @{version.label.toLowerCase()}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: History, title: 'Complete History', desc: 'Every render saved automatically', color: 'text-blue-500' },
            { icon: RefreshCw, title: 'Easy Iteration', desc: 'Build on previous versions', color: 'text-primary' },
            { icon: Link2, title: 'Version References', desc: 'Use @v1, @v2, @latest', color: 'text-primary' },
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

        {/* Example Usage */}
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-muted/80 to-muted/60 rounded-xl px-8 py-4 border-2 border-primary/30 shadow-xl">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Example:</p>
            <code className="text-foreground font-mono text-lg font-semibold block text-primary">
              "Make @v2 more modern with glass windows"
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
