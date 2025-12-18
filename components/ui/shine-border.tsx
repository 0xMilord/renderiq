"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#000000"
   */
  shineColor?: string | string[]
  /**
   * Which sides to show the border on
   * @default "all"
   */
  sides?: "all" | "top" | "right" | "bottom" | "left" | "internal" | "external"
}

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  sides = "all",
  className,
  style,
  ...props
}: ShineBorderProps) {
  // Internal sides = inside aligned stroke (doesn't extend beyond container)
  const isInternal = sides === "internal"
  // External sides = outside aligned stroke (extends beyond container)  
  const isExternal = sides === "external"
  
  return (
    <div
      className={cn(
        "animate-shine pointer-events-none absolute will-change-[background-position]",
        className
      )}
      style={{
        ...style,
        "--border-width": `${borderWidth}px`,
        "--duration": `${duration}s`,
        backgroundImage: `radial-gradient(transparent,transparent, ${
          Array.isArray(shineColor) ? shineColor.join(",") : shineColor
        },transparent,transparent)`,
        backgroundSize: "300% 300%",
        mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        padding: "var(--border-width)",
        animation: `shine var(--duration) infinite linear`,
        zIndex: isExternal ? 10 : 1,
        // Internal: inside aligned, stays within container
        ...(isInternal && {
          inset: 0,
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
        }),
        // External: outside aligned, extends beyond container for rounded corners
        ...(isExternal && {
          width: "calc(100% + var(--border-width) * 2)",
          height: "calc(100% + var(--border-width) * 2)",
          top: "calc(-1 * var(--border-width))",
          left: "calc(-1 * var(--border-width))",
          borderRadius: "calc(var(--border-radius, 1rem) + var(--border-width))",
        }),
        // Default: center aligned
        ...(!isInternal && !isExternal && {
          inset: 0,
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
        }),
      } as React.CSSProperties}
      {...props}
    />
  )
}

