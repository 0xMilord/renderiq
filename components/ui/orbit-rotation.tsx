"use client"

import type React from "react"
import {
  FaApple,
  FaAws,
  FaDocker,
  FaGithub,
  FaGoogle,
  FaInstagram,
  FaLinkedin,
  FaNodeJs,
  FaReact,
  FaTwitter,
} from "react-icons/fa"
import {
  SiFacebook,
  SiNextdotjs,
  SiRedux,
  SiTypescript,
  SiVercel,
} from "react-icons/si"

import { cn } from "@/lib/utils"

interface OrbitIcon {
  Icon: React.ComponentType<{ className?: string }>
  name?: string
}

interface OrbitRotationProps {
  icons?: OrbitIcon[]
  orbitCount?: number
  orbitGap?: number
  centerIcon?: OrbitIcon
  className?: string
  size?: "sm" | "md" | "lg"
}

const defaultIcons: OrbitIcon[] = [
  { Icon: FaReact, name: "React" },
  { Icon: FaAws, name: "AWS" },
  { Icon: FaDocker, name: "Docker" },
  { Icon: FaNodeJs, name: "Node.js" },
  { Icon: SiNextdotjs, name: "Next.js" },
  { Icon: SiVercel, name: "Vercel" },
  { Icon: SiRedux, name: "Redux" },
  { Icon: SiTypescript, name: "TypeScript" },
  { Icon: FaGithub, name: "GitHub" },
  { Icon: FaTwitter, name: "Twitter" },
  { Icon: FaLinkedin, name: "LinkedIn" },
  { Icon: FaInstagram, name: "Instagram" },
  { Icon: FaGoogle, name: "Google" },
  { Icon: FaApple, name: "Apple" },
  { Icon: SiFacebook, name: "Facebook" },
]

const defaultCenterIcon: OrbitIcon = {
  Icon: FaReact,
  name: "React",
}

export function OrbitRotation({
  icons = defaultIcons,
  orbitCount = 3,
  orbitGap = 6,
  centerIcon = defaultCenterIcon,
  className,
  size = "md",
  ...props
}: OrbitRotationProps) {
  const iconsPerOrbit = Math.ceil(icons.length / orbitCount)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  const iconSizeClasses = {
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Center Icon */}
        <div
          className={cn(
            "bg-background/90 border-border/50 flex items-center justify-center rounded-full border shadow-xl backdrop-blur-sm",
            sizeClasses[size]
          )}
        >
          <centerIcon.Icon className={cn(iconSizeClasses[size])} />
        </div>

        {/* Generate Orbits */}
        {[...Array(orbitCount)].map((_, orbitIdx) => {
          // Inner orbit starts closer to center, outer orbits have more gap
          const baseSize = orbitIdx === 0 ? 7 : 8
          const gapMultiplier = orbitIdx === 0 ? orbitGap * 0.6 : orbitGap
          const orbitSize = `${baseSize + gapMultiplier * (orbitIdx + 1)}rem`
          const angleStep = (2 * Math.PI) / iconsPerOrbit
          const animationDuration = `${12 + orbitIdx * 6}s`
          // Alternate direction: even orbits clockwise, odd counter-clockwise
          const direction = orbitIdx % 2 === 0 ? 'normal' : 'reverse'

          return (
            <div
              key={orbitIdx}
              className="border-muted-foreground/30 absolute rounded-full border-2 border-dotted"
              style={{
                width: orbitSize,
                height: orbitSize,
                animation: `orbit-spin ${animationDuration} linear infinite ${direction}`,
              }}
            >
              {icons
                .slice(
                  orbitIdx * iconsPerOrbit,
                  orbitIdx * iconsPerOrbit + iconsPerOrbit
                )
                .map((iconConfig, iconIdx) => {
                  const angle = iconIdx * angleStep
                  const x = 50 + 50 * Math.cos(angle)
                  const y = 50 + 50 * Math.sin(angle)
                  // Outer rings get larger icons
                  const outerRingSizeClasses = {
                    sm: "w-10 h-10",
                    md: "w-14 h-14",
                    lg: "w-16 h-16",
                  }
                  const sizeClass = orbitIdx > 0 ? outerRingSizeClasses[size] : iconSizeClasses[size]

                  return (
                    <div
                      key={iconIdx}
                      className={cn("bg-background/80 border-border/50 absolute rounded-full border shadow-lg backdrop-blur-sm flex items-center justify-center ring-1 ring-primary/20 ring-offset-1 ring-offset-background/50", sizeClass)}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 0 12px 2px rgba(209, 242, 74, 0.15), inset 0 0 8px rgba(209, 242, 74, 0.05)",
                      }}
                    >
                      <iconConfig.Icon className="w-3/4 h-3/4 rounded-full" />
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
