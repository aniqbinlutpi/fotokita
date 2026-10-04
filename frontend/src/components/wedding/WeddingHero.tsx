import React, { useState, useEffect, useMemo } from "react";
import { WeddingHeroDesktop } from "./WeddingHeroDesktop";
import { WeddingHeroMobile } from "./WeddingHeroMobile";
import type { Position } from "./DraggableHeroItem";
import type { TextPositionMap } from "@/lib/layers";
import type { Wedding } from "@/types/wedding";

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
  partnerFont?: string;
  partnerSize?: string;
  eyebrowFont?: string;
  eyebrowSize?: string;
  dateFont?: string;
  dateSize?: string;
  quoteFont?: string;
  quoteSize?: string;
  ampersandSize?: string;
  orbSize?: string;
  deviceView?: "full" | "mobile" | "tablet";
  textPositions?: TextPositionMap | null;
  isEditor?: boolean;
  onTextPositionChange?: (id: string, pos: Position) => void;
  showAlignmentGuides?: boolean;
  showMobileBoundary?: boolean;
}

export const WeddingHero: React.FC<WeddingHeroProps> = (props) => {
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = useMemo(() => {
    if (props.deviceView === "mobile") return true;
    if (props.deviceView === "tablet") return false;
    return windowWidth < 768;
  }, [props.deviceView, windowWidth]);

  if (isMobile) {
    return <WeddingHeroMobile {...props} />;
  }

  return <WeddingHeroDesktop {...props} />;
};

export default WeddingHero;
