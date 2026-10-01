import React, { useState, useEffect, useMemo } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { Shdr12 } from "@/components/ui/shdr-12";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { UploadCloud, ChevronDown } from "lucide-react";
import type { Wedding } from "@/types/wedding";
import imgExpand from "@/assets/images/img-expand.png";

const themePresets: Record<string, { orb: any; fireworks: string[] }> = {
  warmGold: {
    orb: {
      brickA: "#1F1712",
      brickB: "#4A3728",
      brickC: "#8C6D48",
      brickD: "#C9AA7C",
      brickE: "#F5EADB",
    },
    fireworks: ["#D4AF37", "#C5A880", "#A67C6B", "#E5A988", "#8C624D", "#DFBA89"],
  },
  roseRomance: {
    orb: {
      brickA: "#280D16",
      brickB: "#541C2C",
      brickC: "#9C435A",
      brickD: "#DFA4AF",
      brickE: "#FDF2F4",
    },
    fireworks: ["#E8829C", "#D25D78", "#F5BAC7", "#FFDFE6", "#B0405C", "#FCD8DE"],
  },
  emerald: {
    orb: {
      brickA: "#0D211A",
      brickB: "#1A4335",
      brickC: "#3D7A65",
      brickD: "#94C9B4",
      brickE: "#E8F5F0",
    },
    fireworks: ["#2E8B57", "#50C878", "#98FF98", "#A3D9C9", "#20B2AA", "#E0FFF4"],
  },
  midnight: {
    orb: {
      brickA: "#0A0E17",
      brickB: "#152238",
      brickC: "#4F678F",
      brickD: "#B2C4DF",
      brickE: "#F0F4FA",
    },
    fireworks: ["#4B6984", "#82A7C9", "#C5D9EB", "#FFFFFF", "#6082A3", "#D0E1F9"],
  },
};

export interface WeddingHeroProps {
  wedding: Wedding | null;
  photoCount: number;
  onOpenUpload: () => void;
  // Sub-Admin customization options
  partner1Name?: string;
  partner2Name?: string;
  customDate?: string;
  eyebrow?: string;
  tagline?: string;
  themePalette?: string;
  fireworksEnabled?: boolean;
}

export const WeddingHero: React.FC<WeddingHeroProps> = ({
  wedding,
  photoCount,
  onOpenUpload,
  partner1Name,
  partner2Name,
  customDate,
  eyebrow = "- WEDDING ARCHIVE -",
  tagline = "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
  themePalette = "warmGold",
  fireworksEnabled = true,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const activeTheme = useMemo(() => {
    return themePresets[themePalette] || themePresets.warmGold!;
  }, [themePalette]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [firstName, secondName] = useMemo(() => {
    if (partner1Name || partner2Name) {
      return [partner1Name || "Afiq", partner2Name || "Wieam"];
    }
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
  }, [wedding, partner1Name, partner2Name]);

  const formattedDate = useMemo(() => {
    const rawDate = customDate || wedding?.date;
    if (!rawDate) return "20 December 2026";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return rawDate;
    }
  }, [wedding, customDate]);

  return (
    <section className="relative w-full">
      <ScrollExpand
        src={imgExpand}
        alt={wedding?.name ? `${wedding.name} Wedding Archive` : "Wedding Archive"}
        useWindowScroll={true}
        shape="circle"
        circleSize={isMobile ? 0.20 : 0.16}
        orbSize={isMobile ? 54 : 130}
        orbOffset={isMobile ? { x: 40, y: -38 } : { x: 112, y: -98 }}
        startRadius={9999}
        endRadius={0}
        mediaZoom={1.28}
        scrollDistance={1.1}
        holdDistance={0.35}
        smoothing={0.08}
        overlayScrim={0.45}
        orb={
          <Shdr12
            className="size-full"
            state="idle"
            params={{
              spin: 0.32,
              tilt: 0.45,
              studs: 24,
              gloss: 2.2,
              gap: 0.02,
              patch: 0.65,
              gain: 1.05,
              radius: 0.94,
              contrast: 1.05,
            }}
            colors={activeTheme.orb}
            stateColors={{
              idle: activeTheme.orb,
              thinking: activeTheme.orb,
              speaking: activeTheme.orb,
            }}
            statePresets={{
              idle: { spin: 0.3, gloss: 2.2, gap: 0.02 },
              thinking: { spin: 0.1, gloss: 1.5, gap: 0.15 },
              speaking: { spin: 0.5, gloss: 2.4, gap: 0 },
            }}
            wrapper="none"
            paused={false}
            pauseOffscreen
            maxDpr={1.5}
            ariaLabel="Warm Gold and Chocolate 3D Brick Orb"
          />
        }
        behindOrb={
          <div className="flex items-center justify-center pointer-events-none select-none">
            <span className="font-serif not-italic font-normal text-[#2F2926] dark:text-[#F5EFEB]/25 leading-none text-[200px] sm:text-[380px] md:text-[480px] lg:text-[560px] translate-y-[-2%] select-none">
              &
            </span>
          </div>
        }
        title={
          <div className="w-full flex flex-col items-center justify-center pointer-events-none select-none max-w-7xl mx-auto relative px-2 sm:px-8 md:px-16">
            {/* Top Eyebrow: customizable */}
            <div className="absolute -top-20 sm:-top-32 md:-top-40 lg:-top-44 left-0 right-0 flex items-center justify-center">
              <span className="text-[11px] sm:text-xs md:text-base uppercase tracking-[0.35em] text-[#2F2926]/85 dark:text-[#F5EFEB]/85 font-sans font-medium whitespace-nowrap">
                {eyebrow}
              </span>
            </div>

            {/* Middle Row: Partner 1 on Left, Orb in Center, Partner 2 on Right */}
            <div className="w-full flex items-center justify-between">
              {/* Left Column: Partner 1 + Date */}
              <div className="flex-1 flex flex-col items-end text-right pr-5 sm:pr-16 md:pr-28 lg:pr-36 min-w-0">
                <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap">
                  {firstName}
                </h1>
                <p className="font-sans text-[10.5px] sm:text-xs md:text-sm text-[#2F2926]/75 dark:text-[#F5EFEB]/75 tracking-wide sm:tracking-wider mt-1.5 sm:mt-3 whitespace-nowrap">
                  {formattedDate}
                </p>
              </div>

              {/* Center Spacer accommodating the 3D Orb and & */}
              <div className="shrink-0 w-[96px] sm:w-[125px] md:w-[145px] lg:w-[165px] pointer-events-none" />

              {/* Right Column: Partner 2 + Photo Count */}
              <div className="flex-1 flex flex-col items-start text-left pl-9 sm:pl-16 md:pl-24 lg:pl-32 min-w-0">
                <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap">
                  {secondName}
                </h1>
                <p className="font-sans text-[10.5px] sm:text-xs md:text-sm text-[#2F2926]/75 dark:text-[#F5EFEB]/75 tracking-wide sm:tracking-wider mt-1.5 sm:mt-3 whitespace-nowrap">
                  {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
                </p>
              </div>
            </div>
          </div>
        }
        background={
          fireworksEnabled ? (
            <FireworksBackground
              className="absolute inset-0 size-full pointer-events-auto"
              population={1.2}
              color={activeTheme.fireworks}
              fireworkSpeed={{ min: 3.5, max: 6.5 }}
              particleSpeed={{ min: 1.5, max: 5 }}
              particleSize={{ min: 1.2, max: 3.5 }}
            />
          ) : undefined
        }
        scrollHint={
          <div className="inline-flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-[#7A7069] dark:text-[#A89F97] drop-shadow-sm">
            <span>Scroll to expand</span>
            <ChevronDown className="size-4 animate-bounce text-[#A67C6B]" />
          </div>
        }
      >
        {/* Full-bleed expanded overlay content */}
        <div className="flex flex-col items-center justify-center text-center max-w-2xl px-6 pointer-events-auto">
          <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[#E7DED5] mb-3 drop-shadow">
            <span className="w-8 h-px bg-[#E7DED5]/70" />
            <span>{eyebrow.replace(/^-+|-+$/g, "").trim() || "Wedding Archive"}</span>
            <span className="w-8 h-px bg-[#E7DED5]/70" />
          </div>

          <h2 className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
            {`${firstName} & ${secondName}`}
          </h2>

          <p className="font-serif italic text-base sm:text-xl text-[#F8F5F0]/95 max-w-lg mx-auto mb-6 drop-shadow">
            {tagline}
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={onOpenUpload}
              className="bg-[#FFFCF8] dark:bg-[#1A1715] text-[#2F2926] dark:text-[#F5EFEB] hover:bg-[#F8F5F0] dark:hover:bg-[#25211E] border border-[#E7DED5] dark:border-[#332B25] transition-all duration-200 px-7 py-3 rounded-sm text-xs uppercase tracking-widest font-medium shadow-2xl gap-2 h-auto cursor-pointer pointer-events-auto"
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
