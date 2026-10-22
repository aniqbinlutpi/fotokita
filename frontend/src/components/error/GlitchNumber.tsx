import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

export interface GlitchNumberProps {
  number?: string | number;
  code?: string | number;
  label?: string;
  text?: string;
  className?: string;
}

export const GlitchNumber: React.FC<GlitchNumberProps> = ({
  number,
  code,
  label,
  text,
  className = "",
}) => {
  const [glitching, setGlitching] = useState(false);
  const rawCode = code !== undefined ? code : number;
  const displayText =
    text ||
    (label && rawCode !== undefined
      ? `${rawCode} ${label}`
      : String(rawCode || text || ""));

  useEffect(() => {
    // Trigger a brief authentic glitch spasm every 2.8 seconds
    const interval = setInterval(() => {
      setGlitching(true);
      const timer = setTimeout(() => {
        setGlitching(false);
      }, 450);
      return () => clearTimeout(timer);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative inline-block font-serif font-bold tracking-tight select-none cursor-default mb-4 max-w-full ${className}`}
      onMouseEnter={() => setGlitching(true)}
      onMouseLeave={() => setGlitching(false)}
    >
      {/* Cyan / Teal Chromatic Aberration Layer */}
      <motion.span
        aria-hidden="true"
        animate={
          glitching
            ? {
                x: [-4, 5, -3, 4, 0],
                y: [1, -2, 2, -1, 0],
                opacity: [0.85, 1, 0.4, 0.95, 0],
                skewX: [-4, 6, -2, 4, 0],
              }
            : { x: 0, y: 0, opacity: 0, skewX: 0 }
        }
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="absolute inset-0 text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#3B82F6] dark:text-[#60A5FA] mix-blend-screen pointer-events-none z-0 whitespace-nowrap"
        style={{ clipPath: glitching ? "inset(20% 0 35% 0)" : "none" }}
      >
        {displayText}
      </motion.span>

      {/* Red / Copper Chromatic Aberration Layer */}
      <motion.span
        aria-hidden="true"
        animate={
          glitching
            ? {
                x: [4, -5, 4, -3, 0],
                y: [-1, 2, -1, 1, 0],
                opacity: [0.85, 1, 0.5, 0.95, 0],
                skewX: [4, -5, 3, -2, 0],
              }
            : { x: 0, y: 0, opacity: 0, skewX: 0 }
        }
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="absolute inset-0 text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#E11D48] dark:text-[#F43F5E] mix-blend-screen pointer-events-none z-0 whitespace-nowrap"
        style={{ clipPath: glitching ? "inset(45% 0 15% 0)" : "none" }}
      >
        {displayText}
      </motion.span>

      {/* Main Glitch Text */}
      <motion.span
        animate={
          glitching
            ? {
                x: [0, -3, 3, -1, 2, 0],
                skewX: [0, -2, 3, -1, 0],
              }
            : { x: 0, skewX: 0 }
        }
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="relative z-10 block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-[#A67C6B] dark:text-[#DFBF8A] drop-shadow-xs whitespace-nowrap leading-none"
      >
        {displayText}
      </motion.span>

      {/* Horizontal Scanlines Slice Line on glitch */}
      {glitching && (
        <motion.div
          initial={{ opacity: 0, top: "15%" }}
          animate={{ opacity: [0, 0.9, 0], top: ["15%", "85%"] }}
          transition={{ duration: 0.3 }}
          className="absolute left-0 right-0 h-[2px] bg-[#FFFFFF] dark:bg-[#FFFFFF] opacity-70 z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.9)]"
        />
      )}
    </div>
  );
};
