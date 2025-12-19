"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number; // Current value
  max?: number; // Maximum value for percentage calculation
  size?: number; // Size in pixels
  strokeWidth?: number; // Stroke width
  className?: string;
  children?: React.ReactNode; // Content in center
  showValue?: boolean; // Show value text
  color?: string; // Progress color (defaults to neon green)
  trackColor?: string; // Track color (defaults to theme-aware)
}

export function RadialProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  children,
  showValue = false,
  color = "hsl(72, 87%, 62%)", // Neon green accent
  trackColor,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  // Default track color based on theme
  const defaultTrackColor = trackColor || "hsl(var(--muted-foreground))";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={defaultTrackColor}
          strokeWidth={strokeWidth}
          className="opacity-20 dark:opacity-30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className="text-xs font-semibold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
}

