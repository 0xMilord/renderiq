"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Clock: React.FC<{ className?: string; children?: React.ReactNode }> = ({
  className,
  children,
}) => {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  const hourDuration = isMobile ? 30 : 20;
  const minuteDuration = isMobile ? 15 : 10;
  const secondDuration = isMobile ? 6 : 3;

  return (
    <div className={cn("w-full h-full flex items-center justify-center", className)}>
      <div className="relative w-full h-full aspect-square z-10">
        <div className="relative w-full h-full rounded-full flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full rounded-full"
          >
            <defs>
              <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#404040" />
                <stop offset="50%" stopColor="#262626" />
                <stop offset="100%" stopColor="#171717" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="url(#metalGrad)"
              stroke="url(#metalGrad)"
              strokeWidth="2"
            />
          </svg>
          <div
            className="absolute inset-[3%] rounded-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 shadow-inner"
            style={{
              boxShadow:
                "inset 0 6px 30px rgba(0,0,0,0.95), inset 0 -2px 15px rgba(255,255,255,0.05)",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: `conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  rgba(209, 242, 74, 0) 30deg,
                  rgba(209, 242, 74, 0.7) 90deg,
                  rgba(209, 242, 74, 0.8) 120deg,
                  rgba(209, 242, 74, 0) 180deg,
                  transparent 210deg,
                  rgba(209, 242, 74, 0) 240deg,
                  rgba(209, 242, 74, 0.7) 300deg,
                  rgba(209, 242, 74, 0.8) 330deg,
                  rgba(209, 242, 74, 0) 360deg
                )`,
              }}
            />

            <div
              className="absolute inset-[16%] rounded-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-center"
              style={{
                boxShadow:
                  "0 0 40px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.03)",
              }}
            >
              {children}
            </div>

            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  height: "45%",
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                }}
              >
                <div
                  className="w-[0.25rem] h-[0.75rem] bg-gradient-to-b from-[#D1F24A] to-[#84CC16] mx-auto rounded-full shadow-sm"
                  style={{
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            ))}

            {[...Array(60)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  height: "45%",
                  transform: `translate(-50%, -100%) rotate(${i * 6}deg)`,
                }}
              >
                {i % 5 !== 0 && (
                  <div className="w-px h-[0.25rem] bg-[#D1F24A] mx-auto opacity-60" />
                )}
              </div>
            ))}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                <motion.div
                  className="absolute left-1/2 bottom-1/2 origin-bottom"
                  style={{
                    width: "clamp(6px, 1.5vw, 8px)",
                    height: "28%",
                    marginLeft: "calc(clamp(6px, 1.5vw, 8px) / -2)",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: hourDuration,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-b from-[#D1F24A] via-[#B8E636] to-[#84CC16] rounded-full"
                    style={{
                      clipPath:
                        "polygon(40% 0%, 60% 0%, 55% 100%, 45% 100%)",
                      boxShadow:
                        "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                </motion.div>
                <motion.div
                  className="absolute left-1/2 bottom-1/2 origin-bottom"
                  style={{
                    width: "clamp(5px, 1.2vw, 6px)",
                    height: "38%",
                    marginLeft: "calc(clamp(5px, 1.2vw, 6px) / -2)",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: minuteDuration,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-b from-[#D1F24A] via-[#B8E636] to-[#84CC16] rounded-full"
                    style={{
                      clipPath:
                        "polygon(40% 0%, 60% 0%, 55% 100%, 45% 100%)",
                      boxShadow:
                        "inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3)",
                    }}
                  />
                </motion.div>

                <motion.div
                  className="absolute left-1/2 bottom-1/2 origin-bottom"
                  style={{
                    width: "clamp(2px, 0.6vw, 3px)",
                    height: "42%",
                    marginLeft: "calc(clamp(2px, 0.6vw, 3px) / -2)",
                    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: secondDuration,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-b from-[#D1F24A] via-[#B8E636] to-[#84CC16] rounded-full"
                    style={{
                      boxShadow:
                        "inset 0 0.5px 1px rgba(255,255,255,0.4)",
                    }}
                  />
                </motion.div>
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(1rem,4vw,1.25rem)] h-[clamp(1rem,4vw,1.25rem)] bg-gradient-to-br from-[#D1F24A] via-[#B8E636] to-[#84CC16] rounded-full shadow-lg"
                  style={{
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clock;