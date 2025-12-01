'use client';
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

import './dot-grid.css';

// Try to register InertiaPlugin if available (premium feature)
let hasInertia = false;
try {
  if (InertiaPlugin) {
    gsap.registerPlugin(InertiaPlugin);
    hasInertia = true;
  }
} catch (e) {
  console.warn('GSAP InertiaPlugin not available, using fallback animations');
}

const throttle = (func: (...args: any[]) => void, limit: number) => {
  let lastCall = 0;
  return function (this: any, ...args: any[]) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _inertiaApplied: boolean;
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Convert HSL CSS variable to RGB
function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  // Get computed style value (e.g., "0 0% 45%")
  const values = hsl.trim().split(/\s+/);
  if (values.length < 3) return { r: 128, g: 128, b: 128 };
  
  const h = parseFloat(values[0]) || 0;
  const s = parseFloat(values[1]) / 100 || 0;
  const l = parseFloat(values[2]) / 100 || 0.5;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h / 360 + 1/3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Get CSS variable value as RGB
function getCssVarRgb(varName: string): { r: number; g: number; b: number } {
  if (typeof window === 'undefined') return { r: 128, g: 128, b: 128 };
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  
  if (!value) return { r: 128, g: 128, b: 128 };
  
  // Handle HSL format (e.g., "0 0% 45%")
  if (value.includes('%')) {
    return hslToRgb(value);
  }
  
  // Handle hex format
  const hexMatch = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }
  
  // Handle rgb format
  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }
  
  return { r: 128, g: 128, b: 128 };
}

const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 10,
  gap = 15,
  proximity = 120,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0
  });

  // Get colors from CSS variables - use softer neutral and create smooth transitions
  const [baseRgb, setBaseRgb] = React.useState(() => {
    if (typeof window !== 'undefined') {
      // Use a softer/lighter neutral color
      const border = getCssVarRgb('--border');
      // Lighten border by 30% for softer appearance
      return {
        r: Math.min(255, Math.round(border.r + (255 - border.r) * 0.3)),
        g: Math.min(255, Math.round(border.g + (255 - border.g) * 0.3)),
        b: Math.min(255, Math.round(border.b + (255 - border.b) * 0.3))
      };
    }
    return { r: 200, g: 200, b: 200 };
  });
  
  const [lightRgb, setLightRgb] = React.useState(() => {
    if (typeof window !== 'undefined') {
      // Light neutral for middle transition
      const border = getCssVarRgb('--border');
      // Lighten the border color by 30%
      return {
        r: Math.min(255, Math.round(border.r + (255 - border.r) * 0.3)),
        g: Math.min(255, Math.round(border.g + (255 - border.g) * 0.3)),
        b: Math.min(255, Math.round(border.b + (255 - border.b) * 0.3))
      };
    }
    return { r: 220, g: 220, b: 220 };
  });
  
  const [activeRgb, setActiveRgb] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return getCssVarRgb('--primary');
    }
    return { r: 128, g: 128, b: 128 };
  });

  // Refresh colors when theme changes or on mount
  useEffect(() => {
    const refreshColors = () => {
      const border = getCssVarRgb('--border');
      
      // Soft base neutral (lightened border by 30%)
      setBaseRgb({
        r: Math.min(255, Math.round(border.r + (255 - border.r) * 0.3)),
        g: Math.min(255, Math.round(border.g + (255 - border.g) * 0.3)),
        b: Math.min(255, Math.round(border.b + (255 - border.b) * 0.3))
      });
      
      // Light neutral (much lighter version for smooth transition)
      setLightRgb({
        r: Math.min(255, Math.round(border.r + (255 - border.r) * 0.6)),
        g: Math.min(255, Math.round(border.g + (255 - border.g) * 0.6)),
        b: Math.min(255, Math.round(border.b + (255 - border.b) * 0.6))
      });
      
      setActiveRgb(getCssVarRgb('--primary'));
    };

    refreshColors();
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      refreshColors();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Also refresh periodically as a fallback
    const interval = setInterval(refreshColors, 1000);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;

    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let style = `rgb(${baseRgb.r},${baseRgb.g},${baseRgb.b})`;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          
          // Smooth 3-stage transition: dark neutral → light → primary
          let r: number, g: number, b: number;
          
          if (t < 0.5) {
            // First half: dark neutral → light neutral (0 to 0.5)
            const stageT = t * 2; // 0 to 1
            // Smooth ease-in-out for softer transition
            const easeT = stageT < 0.5 
              ? 2 * stageT * stageT 
              : -1 + (4 - 2 * stageT) * stageT;
            r = Math.round(baseRgb.r + (lightRgb.r - baseRgb.r) * easeT);
            g = Math.round(baseRgb.g + (lightRgb.g - baseRgb.g) * easeT);
            b = Math.round(baseRgb.b + (lightRgb.b - baseRgb.b) * easeT);
          } else {
            // Second half: light neutral → primary (0.5 to 1.0)
            const stageT = (t - 0.5) * 2; // 0 to 1
            // Smooth ease-in-out for softer transition
            const easeT = stageT < 0.5 
              ? 2 * stageT * stageT 
              : -1 + (4 - 2 * stageT) * stageT;
            r = Math.round(lightRgb.r + (activeRgb.r - lightRgb.r) * easeT);
            g = Math.round(lightRgb.g + (activeRgb.g - lightRgb.g) * easeT);
            b = Math.round(lightRgb.b + (activeRgb.b - lightRgb.b) * easeT);
          }
          
          style = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = style;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseRgb, lightRgb, activeRgb, circlePath]);

  useEffect(() => {
    buildGrid();
    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      wrapperRef.current && ro.observe(wrapperRef.current);
    } else {
      (window as Window).addEventListener('resize', buildGrid);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', buildGrid);
    };
  }, [buildGrid]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvasRef.current!.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);
          const pushX = dot.cx - pr.x + vx * 0.005;
          const pushY = dot.cy - pr.y + vy * 0.005;
          if (hasInertia) {
            gsap.to(dot, {
              // @ts-ignore
              inertia: { xOffset: pushX, yOffset: pushY, resistance },
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          } else {
            // Fallback animation
            gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          }
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;
          if (hasInertia) {
            gsap.to(dot, {
              // @ts-ignore
              inertia: { xOffset: pushX, yOffset: pushY, resistance },
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          } else {
            // Fallback animation
            gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => {
                gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          }
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener('mousemove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', throttledMove);
      window.removeEventListener('click', onClick);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength]);

  return (
    <section className={`dot-grid ${className}`} style={style}>
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
};

export default DotGrid;