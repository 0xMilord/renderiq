'use client';

import React, { useRef, useState, ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

interface GradientCardProps {
  title: string;
  description?: string | ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  isPopular?: boolean;
  className?: string;
  glowColor?: string; // Primary color for glow effect
}

export const GradientCard = ({
  title,
  description,
  children,
  onClick,
  isPopular = false,
  className = '',
  glowColor = 'rgba(209, 242, 74, 0.7)', // Default to primary neon green
}: GradientCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      // Calculate mouse position relative to card center
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Calculate rotation (limited range for subtle effect)
      const rotateX = -(y / rect.height) * 5; // Max 5 degrees rotation
      const rotateY = (x / rect.width) * 5; // Max 5 degrees rotation

      setRotation({ x: rotateX, y: rotateY });
    }
  };

  // Reset rotation when not hovering
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Extract RGB from hex/HSL color for glow
  const getGlowColor = (color: string) => {
    // If it's rgba, return as is
    if (color.includes('rgba')) return color;
    // For primary neon green: rgb(209, 242, 74)
    return 'rgba(209, 242, 74, 0.7)';
  };

  const glow = getGlowColor(glowColor);

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-[32px] overflow-hidden bg-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: isDarkMode 
          ? `0 -10px 100px 10px ${glow.replace('0.7', '0.25')}, 0 0 10px 0 rgba(0, 0, 0, 0.5)`
          : `0 -10px 100px 10px ${glow.replace('0.7', '0.15')}, 0 0 10px 0 rgba(0, 0, 0, 0.1)`,
        minHeight: '200px',
      }}
      initial={{ y: 0 }}
      animate={{
        y: isHovered ? -5 : 0,
        rotateX: rotation.x,
        rotateY: rotation.y,
        perspective: 1000,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-[hsl(72,87%,62%)] text-[hsl(0,0%,7%)] text-xs font-bold px-3 py-1 rounded-full">
            Popular
          </div>
        </div>
      )}

      {/* Subtle glass reflection overlay */}
      <motion.div
        className="absolute inset-0 z-35 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
          backdropFilter: "blur(2px)",
        }}
        animate={{
          opacity: isHovered ? 0.7 : 0.5,
          rotateX: -rotation.x * 0.2,
          rotateY: -rotation.y * 0.2,
          z: 1,
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Theme-aware background */}
      <motion.div
        className="absolute inset-0 z-0 bg-card"
        style={{
          background: isDarkMode 
            ? "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 70%)"
            : "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 70%)",
        }}
        animate={{
          z: -1
        }}
      />

      {/* Noise texture overlay */}
      <motion.div
        className="absolute inset-0 opacity-30 mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        animate={{
          z: -0.5
        }}
      />

      {/* Primary neon green glow effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
        style={{
          background: `
            radial-gradient(ellipse at bottom right, ${glow.replace('0.7', '0.7')} -10%, rgba(79, 70, 229, 0) 70%),
            radial-gradient(ellipse at bottom left, ${glow.replace('0.7', '0.7')} -10%, rgba(79, 70, 229, 0) 70%)
          `,
          filter: "blur(40px)",
        }}
        animate={{
          opacity: isHovered ? 0.9 : 0.8,
          y: isHovered ? rotation.x * 0.5 : 0,
          z: 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Central glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 z-21"
        style={{
          background: `
            radial-gradient(circle at bottom center, ${glow.replace('0.7', '0.7')} -20%, rgba(79, 70, 229, 0) 60%)
          `,
          filter: "blur(45px)",
        }}
        animate={{
          opacity: isHovered ? 0.85 : 0.75,
          y: isHovered ? `calc(10% + ${rotation.x * 0.3}px)` : "10%",
          z: 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Enhanced bottom border glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] z-25"
        style={{
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.05) 100%)",
        }}
        animate={{
          boxShadow: isHovered
            ? `0 0 20px 4px ${glow.replace('0.7', '0.9')}, 0 0 30px 6px ${glow.replace('0.7', '0.7')}, 0 0 40px 8px ${glow.replace('0.7', '0.5')}`
            : `0 0 15px 3px ${glow.replace('0.7', '0.8')}, 0 0 25px 5px ${glow.replace('0.7', '0.6')}, 0 0 35px 7px ${glow.replace('0.7', '0.4')}`,
          opacity: isHovered ? 1 : 0.9,
          z: 0.5
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      />

      {/* Card content */}
      <motion.div
        className="relative flex flex-col h-full p-5 z-40"
        animate={{
          z: 2
        }}
      >
        {/* Content positioning */}
        <motion.div
          className="mb-auto"
          animate={{
            z: isHovered ? 5 : 2,
            rotateX: isHovered ? -rotation.x * 0.3 : 0,
            rotateY: isHovered ? -rotation.y * 0.3 : 0
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          <motion.h3
            className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-[hsl(0,0%,7%)]'}`}
            style={{
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
            initial={{ filter: "blur(3px)", opacity: 0.7 }}
            animate={{
              textShadow: isHovered ? (isDarkMode ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 4px rgba(0,0,0,0.1)") : "none",
              filter: "blur(0px)",
              opacity: 1,
              transition: { duration: 1.2, delay: 0.2 }
            }}
          >
            {title}
          </motion.h3>

          {description && (
            <motion.div
              className={`text-xs mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              style={{
                lineHeight: 1.5,
                fontWeight: 350,
              }}
              initial={{ filter: "blur(3px)", opacity: 0.7 }}
              animate={{
                textShadow: isHovered ? (isDarkMode ? "0 1px 2px rgba(0,0,0,0.1)" : "0 1px 2px rgba(0,0,0,0.05)") : "none",
                filter: "blur(0px)",
                opacity: 0.85,
                transition: { duration: 1.2, delay: 0.4 }
              }}
            >
              {typeof description === 'string' ? <p>{description}</p> : description}
            </motion.div>
          )}

          {/* Custom children content */}
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

