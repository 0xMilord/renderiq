"use client"

import { OrbitRotation } from "@/components/ui/orbit-rotation"
import { Code2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// Create icon components from app icons with explicit sizing
const createAppIcon = (iconPath: string, name: string) => {
  const IconComponent = ({ className }: { className?: string }) => (
    <img 
      src={iconPath} 
      alt={name} 
      className={cn("w-full h-full object-contain rounded-full", className)}
    />
  )
  IconComponent.displayName = name
  return IconComponent
}

// Plus icon for "more apps"
const MoreAppsIcon = ({ className }: { className?: string }) => (
  <Plus className={cn("text-primary", className)} />
)
MoreAppsIcon.displayName = "More"

// Inner ring icons (first half)
const innerIcons = [
  { Icon: createAppIcon("/apps/icons/sketch-to-render.svg", "Sketch to Render"), name: "Sketch to Render" },
  { Icon: createAppIcon("/apps/icons/3d-to-render.svg", "3D to Render"), name: "3D to Render" },
  { Icon: createAppIcon("/apps/icons/material-alteration.svg", "Material Alteration"), name: "Material Alteration" },
  { Icon: createAppIcon("/apps/icons/change-lighting.svg", "Change Lighting"), name: "Change Lighting" },
  { Icon: createAppIcon("/apps/icons/render-section-drawing.svg", "Section Drawing"), name: "Section Drawing" },
  { Icon: createAppIcon("/apps/icons/change-texture.svg", "Change Texture"), name: "Change Texture" },
  { Icon: createAppIcon("/apps/icons/exploded-diagram.svg", "Exploded Diagram"), name: "Exploded Diagram" },
  { Icon: createAppIcon("/apps/icons/floorplan-technical-diagrams.svg", "Technical Diagrams"), name: "Technical Diagrams" },
  { Icon: createAppIcon("/apps/icons/floorplan-to-3d.svg", "Floorplan to 3D"), name: "Floorplan to 3D" },
  { Icon: createAppIcon("/apps/icons/floorplan-to-furnished.svg", "Floorplan to Furnished"), name: "Floorplan to Furnished" },
]

// Outer ring icons (second half + more icon)
const outerIcons = [
  { Icon: createAppIcon("/apps/icons/item-change.svg", "Item Change"), name: "Item Change" },
  { Icon: createAppIcon("/apps/icons/moodboard-to-render.svg", "Moodboard to Render"), name: "Moodboard to Render" },
  { Icon: createAppIcon("/apps/icons/multi-angle-view.svg", "Multi Angle View"), name: "Multi Angle View" },
  { Icon: createAppIcon("/apps/icons/portfolio-layout-generator.svg", "Portfolio Layout"), name: "Portfolio Layout" },
  { Icon: createAppIcon("/apps/icons/presentation-board-maker.svg", "Presentation Board"), name: "Presentation Board" },
  { Icon: createAppIcon("/apps/icons/presentation-sequence-creator.svg", "Sequence Creator"), name: "Sequence Creator" },
  { Icon: createAppIcon("/apps/icons/product-placement.svg", "Product Placement"), name: "Product Placement" },
  { Icon: createAppIcon("/apps/icons/render-effects.svg", "Render Effects"), name: "Render Effects" },
  { Icon: createAppIcon("/apps/icons/render-to-cad.svg", "Render to CAD"), name: "Render to CAD" },
  { Icon: createAppIcon("/apps/icons/render-upscale.svg", "Render Upscale"), name: "Render Upscale" },
  { Icon: createAppIcon("/apps/icons/upholstery-change.svg", "Upholstery Change"), name: "Upholstery Change" },
  { Icon: MoreAppsIcon, name: "+More" },
]

const appIcons = [...innerIcons, ...outerIcons]

const CenterIcon = ({ className }: { className?: string }) => (
  <Code2 className={cn("text-primary", className)} />
)
CenterIcon.displayName = "API"

export function ApiOrbitDemo({ className }: { className?: string }) {
  return (
    <div className={cn("h-full w-full flex items-center justify-center overflow-hidden", className)}>
      <div className="scale-[0.5] md:scale-[0.6] lg:scale-[0.7]">
        <OrbitRotation
          icons={appIcons}
          centerIcon={{ Icon: CenterIcon, name: "API" }}
          orbitCount={2}
          orbitGap={3}
          size="sm"
        />
      </div>
    </div>
  )
}
