"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AnimationDirection = 'loop' | 'vloop';

interface LogoItem {
  icon: React.ReactNode;
  label: string;
}

interface LogoStepperProps {
  logos: LogoItem[];
  animationDuration?: number;
  animationDelay?: number;
  direction?: AnimationDirection;
  visibleCount?: number;
}

export const LogoStepper: React.FC<LogoStepperProps> = ({
  logos,
  animationDuration = 0.6,
  animationDelay = 1.2,
  direction = 'loop',
  visibleCount = 5
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logos.length);
    }, animationDelay * 1000);
    return () => clearInterval(interval);
  }, [logos.length, animationDelay]);

  const getVisibleLogos = () => {
    const visible = [];
    const offset = Math.floor(visibleCount / 2);
    
    for (let i = -offset; i <= offset; i++) {
      const index = (currentIndex + i + logos.length) % logos.length;
      visible.push({
        logo: logos[index],
        originalIndex: index,
        position: i
      });
    }
    
    return visible;
  };

  const visibleLogos = getVisibleLogos();

  return (
    <div className="relative w-full flex items-start justify-center overflow-visible py-4">
      <div className="flex items-start justify-center gap-6" style={{ width: 'fit-content' }}>
        <AnimatePresence initial={false} mode="popLayout">
          {visibleLogos.map(({ logo, originalIndex, position }) => {
            let lineOpacity = 0;
            if (position === 0) lineOpacity = 1;
            else if (position === -1) lineOpacity = 0.3;
            else if (position === 1) lineOpacity = 0.3;
            
            return (
              <motion.div
                key={originalIndex}
                layout="position"
                initial={{ 
                  x: direction === 'loop' ? 120 : -120,
                  opacity: 0,
                  scale: 0.7
                }}
                animate={{ 
                  x: 0,
                  opacity: position === 0 ? 1 : 0.3,
                  scale: position === 0 ? 1 : 0.75
                }}
                exit={{ 
                  x: direction === 'loop' ? -120 : 120,
                  opacity: 0,
                  scale: 0.7
                }}
                transition={{ 
                  duration: animationDuration,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="flex flex-col items-center flex-shrink-0 w-[100px]"
              >
                <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-[5px]">
                  <div className="rounded-lg bg-neutral-200 dark:bg-neutral-700 p-[5px]">
                    <motion.div
                      className="rounded-md border border-border bg-white dark:bg-card hover:border-primary transition-colors w-14 h-14 flex items-center justify-center overflow-hidden"
                    >
                      {logo.icon}
                    </motion.div>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: lineOpacity }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: animationDuration,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="flex flex-col items-center mt-4"
                >
                  <div className="w-0.5 h-16 mb-4 bg-border" />
                  <span className="text-muted-foreground uppercase text-xs font-medium tracking-wider whitespace-nowrap">
                    {logo.label}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
