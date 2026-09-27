import React, { useState, useEffect, useMemo } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { Shdr12 } from "@/components/ui/shdr-12";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { UploadCloud, ChevronDown } from "lucide-react";
import type { Wedding } from "@/types/wedding";
import imgExpand from "@/assets/images/img-expand.png";

const monochromeBrickColors = {
  brickA: "#18181B", // Deep Obsidian Black
  brickB: "#71717A", // Neutral Mid Grey
  brickC: "#3F3F46", // Dark Graphite Grey
  brickD: "#A1A1AA", // Light Silver Grey
  brickE: "#F4F4F5", // Crisp White
};

interface WeddingHeroProps {
  wedding: Wedding | null;
  photoCount: number;
  onOpenUpload: () => void;
}

export const WeddingHero: React.FC<WeddingHeroProps> = ({
  wedding,
  photoCount,
  onOpenUpload,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [firstName, secondName] = useMemo(() => {
    if (!wedding?.name) return ["Afiq", "Wieam"];
    if (wedding.name.includes("&")) {
      const parts = wedding.name.split("&").map((s) => s.trim());
      return [parts[0] || "Afiq", parts[1] || "Wieam"];
    }
    if (wedding.name.includes("and")) {
      const parts = wedding.name.split("and").map((s) => s.trim());
      return [parts[0] || "Afiq", parts[1] || "Wieam"];
    }
    return [wedding.name, "Wieam"];
  }, [wedding]);

  const formattedDate = useMemo(() => {
    if (!wedding?.date) return "20 December 2026";
    try {
      const d = new Date(wedding.date);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "20 December 2026";
    }
  }, [wedding]);

  return (
    <section className="relative w-full">
      <ScrollExpand
        src={imgExpand}
        alt={wedding?.name ? `${wedding.name} Wedding Archive` : "Wedding Archive"}
        useWindowScroll={true}
        shape="circle"
        circleSize={isMobile ? 0.20 : 0.16}
        orbSize={isMobile ? 68 : 130}
        orbOffset={isMobile ? { x: 54, y: -50 } : { x: 112, y: -98 }}
        startRadius={9999}
        endRadius={0}
        mediaZoom={1.28}
        scrollDistance={1.1}
        holdDistance={0.35}
        smoothing={0.08}
        overlayScrim={0.45}
        orb={
          <Shdr12
            size="100%"
            className="size-full"
            state="idle"
            params={{
              spin: 0.32,
              tilt: 0.45,
              studs: 24,
              gloss: 2.0,
              gap: 0.02,
              patch: 0.4,
              gain: 1.05,
              radius: 0.94,
              contrast: 1.05,
            }}
            colors={monochromeBrickColors}
            stateColors={{
              idle: monochromeBrickColors,
              thinking: monochromeBrickColors,
              speaking: monochromeBrickColors,
            }}
            statePresets={{
              idle: { spin: 0.3, gloss: 2.0, gap: 0.02 },
              thinking: { spin: 0.1, gloss: 1.5, gap: 0.15 },
              speaking: { spin: 0.5, gloss: 2.4, gap: 0 },
            }}
            wrapper="none"
            paused={false}
            pauseOffscreen
            maxDpr={1.5}
            ariaLabel="Monochrome 3D Brick Orb"
          />
        }
        behindOrb={
          <div className="flex items-center justify-center pointer-events-none select-none">
            <span className="font-serif not-italic font-normal text-[#2F2926] leading-none text-[280px] sm:text-[380px] md:text-[480px] lg:text-[560px] translate-y-[-2%] select-none">
              &
            </span>
          </div>
        }
        title={
          <div className="w-full h-full flex flex-col justify-between items-center py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-16 pointer-events-none select-none max-w-7xl mx-auto">
            {/* Top Eyebrow: - WEDDING ARCHIVE - */}
            <div className="flex items-center justify-center text-xs sm:text-sm md:text-base uppercase tracking-[0.35em] text-[#2F2926]/85 font-sans font-medium pt-12 sm:pt-0">
              <span className="translate-y-[140px] sm:translate-y-0">- WEDDING ARCHIVE -</span>
            </div>

            {/* Middle Row: Afiq on Left, Orb in Center, Wieam on Right */}
            <div className="w-full flex items-center justify-between my-auto">
              {/* Left Column: Afiq + Date */}
              <div className="flex-1 flex flex-col items-center sm:items-end text-center sm:text-right pr-8 sm:pr-16 md:pr-28 lg:pr-36">
                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] tracking-tight leading-none drop-shadow-sm">
                  {firstName}
                </h1>
                <p className="font-sans text-[11px] sm:text-xs md:text-sm text-[#2F2926]/75 tracking-wider mt-2 sm:mt-3">
                  {formattedDate}
                </p>
              </div>

              {/* Center Spacer accommodating the 3D Orb */}
              <div className="shrink-0 w-[75px] sm:w-[125px] md:w-[145px] lg:w-[165px] pointer-events-none" />

              {/* Right Column: Wieam + Photo Count */}
              <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left pl-10 sm:pl-16 md:pl-24 lg:pl-32">
                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] tracking-tight leading-none drop-shadow-sm">
                  {secondName}
                </h1>
                <p className="font-sans text-[11px] sm:text-xs md:text-sm text-[#2F2926]/75 tracking-wider mt-2 sm:mt-3">
                  {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
                </p>
              </div>
            </div>

            {/* Bottom spacer for vertical balance */}
            <div className="h-6 sm:h-8" />
          </div>
        }
        background={
          <FireworksBackground
            className="absolute inset-0 size-full pointer-events-auto"
            population={1.2}
            color={[
              "#D4AF37",
              "#C5A880",
              "#A67C6B",
              "#E5A988",
              "#8C624D",
              "#DFBA89",
            ]}
            fireworkSpeed={{ min: 3.5, max: 6.5 }}
            particleSpeed={{ min: 1.5, max: 5 }}
            particleSize={{ min: 1.2, max: 3.5 }}
          />
        }
        scrollHint={
          <div className="inline-flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-[#7A7069] drop-shadow-sm">
            <span>Scroll to expand</span>
            <ChevronDown className="size-4 animate-bounce text-[#A67C6B]" />
          </div>
        }
      >
        {/* Full-bleed expanded overlay content */}
        <div className="flex flex-col items-center justify-center text-center max-w-2xl px-6 pointer-events-auto">
          <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[#E7DED5] mb-3 drop-shadow">
            <span className="w-8 h-px bg-[#E7DED5]/70" />
            <span>Wedding Archive</span>
            <span className="w-8 h-px bg-[#E7DED5]/70" />
          </div>

          <h2 className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            {wedding?.name ?? "Afiq & Wieam"}
          </h2>

          <p className="font-serif italic text-base sm:text-xl text-[#F8F5F0]/95 max-w-lg mx-auto mb-6 drop-shadow">
            Every candid smile, every heartfelt celebration — preserved for a lifetime.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={onOpenUpload}
              className="bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] hover:text-[#2F2926] border border-[#E7DED5] transition-all duration-200 px-7 py-3 rounded-sm text-xs uppercase tracking-widest font-medium shadow-2xl gap-2 h-auto cursor-pointer pointer-events-auto"
            >
              <UploadCloud className="size-4 text-[#A67C6B]" />
              <span>Contribute Memories</span>
            </Button>
          </div>
        </div>
      </ScrollExpand>
    </section>
  );
};
