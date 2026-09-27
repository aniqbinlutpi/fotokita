import React, { useState, useEffect, useMemo } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Calendar, Camera, ChevronDown } from "lucide-react";
import type { Wedding } from "@/types/wedding";
import imgExpand from "@/assets/images/img-expand.png";

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

  const formattedDate = useMemo(() => {
    if (!wedding?.date) return "";
    try {
      const d = new Date(wedding.date);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [wedding]);

  return (
    <section className="relative w-full">
      <ScrollExpand
        src={imgExpand}
        alt={wedding?.name ? `${wedding.name} Wedding Archive` : "Wedding Archive"}
        useWindowScroll={true}
        startWidth={isMobile ? 86 : 36}
        startHeight={isMobile ? 44 : 50}
        startRadius={20}
        endRadius={0}
        mediaZoom={1.28}
        scrollDistance={1.1}
        holdDistance={0.35}
        smoothing={0.08}
        overlayScrim={0.45}
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
        title={
          <div className="flex flex-col items-center justify-center text-center w-full max-w-xl mx-auto px-2 sm:px-4 pointer-events-auto">
            {/* Frosted Editorial Card for maximum legibility */}
            <div className="bg-[#2F2926]/35 backdrop-blur-md rounded-lg p-4 sm:p-6 border border-white/20 shadow-2xl text-white w-[88%] sm:w-auto max-w-[390px] mx-auto">
              {/* Editorial eyebrow */}
              <div className="flex items-center justify-center gap-3 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/90 mb-2 sm:mb-2.5">
                <span className="w-6 h-px bg-white/60" />
                <span>Wedding Archive</span>
                <span className="w-6 h-px bg-white/60" />
              </div>

              {/* Couple Name / Title in Cormorant Garamond */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-[1.1] mb-2.5 drop-shadow-md">
                {wedding?.name ?? "Afiq & Wieam"}
              </h1>

              {/* Date & Meta Details */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-white/90 mb-4 sm:mb-5 font-sans">
                {formattedDate && (
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-[#E7DED5]" />
                    <span>{formattedDate}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5">
                  <Camera className="size-3.5 text-[#E7DED5]" />
                  <span>
                    {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center max-w-[200px] mx-auto mb-4 sm:mb-5">
                <Separator className="bg-white/30" />
              </div>

              {/* Hero CTA Button */}
              <div className="flex items-center justify-center">
                <Button
                  onClick={onOpenUpload}
                  variant="outline"
                  className="border-white/50 bg-white/10 hover:bg-white hover:text-[#2F2926] hover:border-white text-white transition-all duration-300 px-5 py-2 rounded-sm text-[11px] sm:text-xs uppercase tracking-widest font-medium shadow-md gap-2 h-auto cursor-pointer pointer-events-auto"
                >
                  <UploadCloud className="size-3.5 text-[#E7DED5]" />
                  <span>Contribute Memories</span>
                </Button>
              </div>
            </div>
          </div>
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
