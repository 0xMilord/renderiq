'use client';

import React, { useEffect, useRef } from 'react';

interface BorderTrailProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function BorderTrail({ size = 100, style, className = '' }: BorderTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      if (!ctx) return;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(209, 242, 74, 0.8)');
      gradient.addColorStop(0.5, 'rgba(209, 242, 74, 0.4)');
      gradient.addColorStop(1, 'rgba(209, 242, 74, 0.8)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(209, 242, 74, 0.6)';

      // Draw animated border trail
      const speed = 0.02;
      time += speed;

      // Top border
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * (0.5 + 0.5 * Math.sin(time)), 0);
      ctx.lineTo(width, 0);
      ctx.stroke();

      // Right border
      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(width, height * (0.5 + 0.5 * Math.cos(time)));
      ctx.lineTo(width, height);
      ctx.stroke();

      // Bottom border
      ctx.beginPath();
      ctx.moveTo(width, height);
      ctx.lineTo(width * (0.5 - 0.5 * Math.sin(time)), height);
      ctx.lineTo(0, height);
      ctx.stroke();

      // Left border
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * (0.5 - 0.5 * Math.cos(time)));
      ctx.lineTo(0, 0);
      ctx.stroke();

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden rounded-lg pointer-events-none ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

