'use client';

import { useEffect, useRef, useState } from 'react';

interface TickingNumberProps {
  value: string; // e.g., "50K+", "2.5M", "10K+", "99%"
  duration?: number; // Animation duration in milliseconds
  className?: string;
}

// Parse number from string like "50K+", "2.5M", "99%"
function parseNumber(str: string): { num: number; hasPlus: boolean; hasPercent: boolean; isM: boolean; isK: boolean; originalValue: number } {
  // Extract the numeric part and suffixes
  const match = str.match(/^([0-9.]+)([KMB%+]?)([%+]?)$/);
  if (!match) return { num: 0, hasPlus: false, hasPercent: false, isM: false, isK: false, originalValue: 0 };
  
  let num = parseFloat(match[1]);
  const suffix1 = match[2] || '';
  const suffix2 = match[3] || '';
  
  const hasK = suffix1.includes('K') || suffix2.includes('K');
  const hasM = suffix1.includes('M') || suffix2.includes('M');
  const hasPercent = suffix1.includes('%') || suffix2.includes('%');
  const hasPlus = suffix1.includes('+') || suffix2.includes('+');
  
  // Store original value for formatting
  const originalValue = num;
  
  // Convert K/M suffixes to actual numbers for animation
  if (hasK) {
    num *= 1000;
  } else if (hasM) {
    num *= 1000000;
  }
  
  return { num, hasPlus, hasPercent, isM: hasM, isK: hasK, originalValue };
}

// Format number back to display format
function formatNumber(num: number, originalStr: string): string {
  const { hasPlus, hasPercent, isM, isK, originalValue } = parseNumber(originalStr);
  
  if (hasPercent) {
    const progress = Math.min(num / 99, 1); // 99% is max
    return Math.round(progress * 99) + '%';
  }
  
  if (isM) {
    const mValue = num / 1000000;
    const progress = Math.min(num / (originalValue * 1000000), 1);
    const displayValue = progress * originalValue;
    return displayValue.toFixed(1) + 'M';
  }
  
  if (isK) {
    const kValue = num / 1000;
    const progress = Math.min(num / (originalValue * 1000), 1);
    const displayValue = progress * originalValue;
    if (displayValue >= 10) {
      return Math.round(displayValue).toString() + 'K' + (hasPlus ? '+' : '');
    }
    return displayValue.toFixed(1) + 'K' + (hasPlus ? '+' : '');
  }
  
  if (hasPlus) {
    const progress = Math.min(num / originalValue, 1);
    return Math.round(progress * originalValue).toString() + '+';
  }
  
  const progress = Math.min(num / originalValue, 1);
  return Math.round(progress * originalValue).toString();
}

export function TickingNumber({ value, duration = 2000, className = '' }: TickingNumberProps) {
  const { hasPercent, hasPlus, isM, isK } = parseNumber(value);
  const initialValue = hasPercent ? '0%' : (isM ? '0M' : (isK ? '0K' + (hasPlus ? '+' : '') : '0' + (hasPlus ? '+' : '')));
  
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated) return; // Only animate once

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            const { num, hasPercent, hasPlus, isM, isK, originalValue } = parseNumber(value);
            const suffix = hasPercent ? '%' : (isM ? 'M' : (isK ? 'K' : '')) + (hasPlus ? '+' : '');
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function (ease-out)
              const easeOut = 1 - Math.pow(1 - progress, 3);
              
              const currentNum = startValue + (num - startValue) * easeOut;
              const formatted = formatNumber(currentNum, value);
              
              setDisplayValue(formatted);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setDisplayValue(value); // Ensure final value is exact
                setHasAnimated(true);
              }
            };

            animate();
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [value, duration, hasAnimated]);

  return (
    <div ref={ref} className={className}>
      {displayValue}
    </div>
  );
}

