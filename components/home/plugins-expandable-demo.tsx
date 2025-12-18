"use client";

import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { SiSketchup, SiAutodesk, SiBlender, SiRhinoceros } from "react-icons/si";
import { Download } from "lucide-react";
import Link from "next/link";

const plugins = [
  {
    id: 1,
    name: "SketchUp",
    shortDesc: "Ruby Extension",
    description: "Transform models into photorealistic renders from Extensions menu",
    icon: SiSketchup,
    color: "#38BDF8", // Light blue
    href: "/plugins/sketchup-ai-rendering-plugin",
  },
  {
    id: 2,
    name: "Revit",
    shortDesc: "C# Add-in",
    description: "Batch render multiple views with deep BIM data access",
    icon: SiAutodesk,
    color: "#1858A8", // Revit blue
    href: "/plugins/revit-ai-rendering-plugin",
  },
  {
    id: 3,
    name: "AutoCAD",
    shortDesc: "C# Plugin",
    description: "Export drawings and layouts with drawing context awareness",
    icon: SiAutodesk,
    color: "#C1272D", // AutoCAD red
    href: "/plugins/autocad-ai-rendering-plugin",
  },
  {
    id: 4,
    name: "Blender",
    shortDesc: "Python Add-on",
    description: "Capture viewport and render animation sequences with material detection",
    icon: SiBlender,
    color: "#F5792A", // Blender orange
    href: "/plugins/blender-ai-rendering-plugin",
  },
  {
    id: 5,
    name: "Rhino",
    shortDesc: "C# Plugin",
    description: "Grasshopper parametric integration with named views management",
    icon: SiRhinoceros,
    color: "#22C55E", // Green
    href: "/plugins/rhino-ai-rendering-plugin",
  },
];

export const PluginsExpandableDemo = memo(function PluginsExpandableDemo() {
  const [expandedId, setExpandedId] = useState<number>(3);

  return (
    <div className="h-full min-h-[280px] w-full select-none flex items-stretch gap-2">
      {plugins.map((plugin) => {
        const isExpanded = expandedId === plugin.id;
        const Icon = plugin.icon;

        return (
          <div
            key={plugin.id}
            className={cn(
              "relative overflow-hidden rounded-xl cursor-pointer transition-[flex] duration-300 ease-out bg-card border border-border",
              isExpanded ? "flex-[3]" : "flex-1"
            )}
            onMouseEnter={() => setExpandedId(plugin.id)}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-2">
              <div className="flex flex-col items-center gap-2">
                <Icon
                  className={cn(
                    "flex-shrink-0 transition-all duration-300",
                    isExpanded ? "w-16 h-16" : "w-10 h-10 grayscale opacity-50"
                  )}
                  style={{ color: isExpanded ? plugin.color : undefined }}
                />
                <span className={cn(
                  "font-semibold text-center transition-colors duration-300",
                  isExpanded ? "text-sm text-foreground" : "text-xs text-muted-foreground"
                )}>
                  {plugin.name}
                </span>
              </div>
              
              <div className={cn(
                "flex flex-col items-center gap-1 transition-opacity duration-300 absolute bottom-4 left-4 right-4",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                <span className="text-xs font-medium" style={{ color: plugin.color }}>
                  {plugin.shortDesc}
                </span>
                <p className="text-xs text-muted-foreground text-center leading-tight line-clamp-2">
                  {plugin.description}
                </p>
                <Link
                  href={plugin.href}
                  className="mt-1 flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium border border-border bg-transparent text-foreground hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3 h-3" />
                  Download
                </Link>
              </div>

              {/* Collapsed download icon only */}
              <div className={cn(
                "transition-opacity duration-300",
                isExpanded ? "opacity-0" : "opacity-100"
              )}>
                <div className="p-2 rounded-md border border-border text-muted-foreground">
                  <Download className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

