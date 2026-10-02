import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { Shdr12 } from "@/components/ui/shdr-12";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { UploadCloud, ChevronDown } from "lucide-react";
import type { Wedding } from "@/types/wedding";
import imgExpand from "@/assets/images/img-expand.png";
import {
  getFontFamilyCss,
  getPartnerFontSizeStyle,
  getEyebrowFontSizeStyle,
  getDateFontSizeStyle,
  getQuoteFontSizeStyle,
} from "@/lib/typography";
import { DraggableHeroItem, type Position } from "./DraggableHeroItem";
import {
  CanvasAlignmentGuides,
  type AlignmentGuideState,
  DESKTOP_MOBILE_GUIDE_WIDTH,
} from "./CanvasAlignmentGuides";

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
  partnerFont?: string;
  partnerSize?: string;
  eyebrowFont?: string;
  eyebrowSize?: string;
  dateFont?: string;
  dateSize?: string;
  quoteFont?: string;
  quoteSize?: string;
  deviceView?: "full" | "mobile" | "tablet";
  textPositions?: Record<string, { x: number; y: number }> | null;
  isEditor?: boolean;
  onTextPositionChange?: (id: string, pos: { x: number; y: number }) => void;
  showAlignmentGuides?: boolean;
  showMobileBoundary?: boolean;
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
  partnerFont = "cormorant",
  partnerSize = "normal",
  eyebrowFont = "inter",
  eyebrowSize = "normal",
  dateFont = "inter",
  dateSize = "normal",
  quoteFont = "cormorant",
  quoteSize = "normal",
  deviceView,
  textPositions,
  isEditor = false,
  onTextPositionChange,
  showAlignmentGuides: propShowAlignmentGuides,
  showMobileBoundary: propShowMobileBoundary,
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1024;
  });

  const activeTheme = useMemo(() => {
    return themePresets[themePalette] || themePresets.warmGold!;
  }, [themePalette]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [guideState, setGuideState] = useState<AlignmentGuideState | null>(null);
  const effectiveShowMobileBoundary = propShowMobileBoundary ?? true;
  const effectiveShowAlignmentGuides = propShowAlignmentGuides ?? true;

  // Ref to the title container div — used to measure actual canvas width
  // so mobile boundary and center snap work relative to the canvas, not window.
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = titleContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);


  const isMobile = useMemo(() => {
    if (deviceView === "mobile") return true;
    if (deviceView === "tablet") return false;
    return windowWidth < 768;
  }, [deviceView, windowWidth]);

  const isTablet = useMemo(() => {
    if (deviceView === "tablet") return true;
    if (deviceView === "mobile") return false;
    return windowWidth >= 768 && windowWidth < 1024;
  }, [deviceView, windowWidth]);

  const handleDragMove = useCallback(
    (id: string, rawOffset: Position, _initialPos: Position, domRect?: DOMRect): Position => {
      let snappedX = rawOffset.x;
      let snappedY = rawOffset.y;
      let snapCenterX = false;
      let snapCenterY = false;
      let snapSiblingY = false;
      let snapSiblingX = false;
      let siblingLabel = "";

      const SNAP_THRESHOLD = 6;

      // 1. Canvas-center snapping (Canva pink line)
      // Compare the element's absolute center within the container against the container's own center.
      // We use the container's DOMRect as the reference frame so this works correctly inside iframes.
      if (domRect && titleContainerRef.current) {
        const containerRect = titleContainerRef.current.getBoundingClientRect();

        // Element center relative to container
        const elCenterX = domRect.left + domRect.width / 2 - containerRect.left;
        const elCenterY = domRect.top + domRect.height / 2 - containerRect.top;

        // Canvas center
        const canvasCenterX = containerRect.width / 2;
        const canvasCenterY = containerRect.height / 2;

        if (Math.abs(elCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
          // Snap: shift rawOffset.x so element center aligns to canvas center
          snappedX = rawOffset.x - (elCenterX - canvasCenterX);
          snapCenterX = true;
        }

        if (Math.abs(elCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
          snappedY = rawOffset.y - (elCenterY - canvasCenterY);
          snapCenterY = true;
        }
      }

      // 2. Canva-style sibling alignment snapping
      if (id === "partner1") {
        const p2Y = textPositions?.partner2?.y ?? 0;
        if (Math.abs(snappedY - p2Y) <= SNAP_THRESHOLD) {
          snappedY = p2Y;
          snapSiblingY = true;
          siblingLabel = "Partner 2";
        }
      } else if (id === "partner2") {
        const p1Y = textPositions?.partner1?.y ?? 0;
        if (Math.abs(snappedY - p1Y) <= SNAP_THRESHOLD) {
          snappedY = p1Y;
          snapSiblingY = true;
          siblingLabel = "Partner 1";
        }
      } else if (id === "date") {
        const p1X = textPositions?.partner1?.x ?? 0;
        if (Math.abs(snappedX - p1X) <= SNAP_THRESHOLD) {
          snappedX = p1X;
          snapSiblingX = true;
          siblingLabel = "Partner 1";
        }
      } else if (id === "photoCount") {
        const p2X = textPositions?.partner2?.x ?? 0;
        if (Math.abs(snappedX - p2X) <= SNAP_THRESHOLD) {
          snappedX = p2X;
          snapSiblingX = true;
          siblingLabel = "Partner 2";
        }
      }

      // 3. Mobile overflow guard — absolute position vs mobile zone.
      // Only active in desktop view; on mobile the screen itself is the mobile viewport.
      let isOutsideMobile = false;
      let distanceToMobileEdge = 0;

      if (!isMobile && deviceView !== "mobile" && domRect && titleContainerRef.current) {
        const containerRect = titleContainerRef.current.getBoundingClientRect();
        const w = containerRect.width;
        const mobileHalf = Math.min(w, DESKTOP_MOBILE_GUIDE_WIDTH) / 2;
        const mobileSafeLeft = containerRect.left + w / 2 - mobileHalf;
        const mobileSafeRight = containerRect.left + w / 2 + mobileHalf;

        if (domRect.left < mobileSafeLeft || domRect.right > mobileSafeRight) {
          isOutsideMobile = true;
          distanceToMobileEdge = Math.round(
            domRect.left < mobileSafeLeft
              ? mobileSafeLeft - domRect.left
              : domRect.right - mobileSafeRight
          );
        }
      }

      const labelMap: Record<string, string> = {
        partner1: "Partner 1",
        partner2: "Partner 2",
        date: "Wedding Date",
        eyebrow: "Eyebrow",
        photoCount: "Photograph Count",
        quote: "Tagline Quote",
      };

      setGuideState({
        isDragging: true,
        activeId: id,
        activeLabel: labelMap[id] || id,
        currentX: Math.round(snappedX),
        currentY: Math.round(snappedY),
        snapCenterX,
        snapCenterY,
        snapSiblingY,
        siblingLabel,
        snapSiblingX,
        isOutsideMobile,
        distanceToMobileEdge,
      });

      return { x: snappedX, y: snappedY };
    },
    [textPositions, isMobile, deviceView]
  );

  /** IDs of elements whose current drop position falls outside the mobile safe zone */
  const [outsideMobileIds, setOutsideMobileIds] = useState<Set<string>>(new Set());

  // Clear outside mobile warning badges when in mobile view
  useEffect(() => {
    if (isMobile || deviceView === "mobile") {
      setOutsideMobileIds(new Set());
    }
  }, [isMobile, deviceView]);

  const handleDragEnd = useCallback(
    (id: string, _finalPos: { x: number; y: number }, finalRect?: DOMRect) => {
      setGuideState(null);

      // In mobile view, no outside-mobile warning is needed as the user directly sees the mobile screen
      let isOutside = false;

      if (!isMobile && deviceView !== "mobile" && finalRect && titleContainerRef.current) {
        const containerRect = titleContainerRef.current.getBoundingClientRect();
        const w = containerRect.width;
        const mobileHalf = Math.min(w, DESKTOP_MOBILE_GUIDE_WIDTH) / 2;
        const mobileSafeLeft = containerRect.left + w / 2 - mobileHalf;
        const mobileSafeRight = containerRect.left + w / 2 + mobileHalf;
        isOutside = finalRect.left < mobileSafeLeft || finalRect.right > mobileSafeRight;
      }

      setOutsideMobileIds((prev) => {
        const next = new Set(prev);
        if (isOutside) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [isMobile, deviceView]
  );

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
        circleSize={isMobile ? 0.20 : isTablet ? 0.18 : 0.16}
        orbSize={isMobile ? 54 : isTablet ? 90 : 130}
        orbOffset={isMobile ? { x: 40, y: -38 } : isTablet ? { x: 70, y: -65 } : { x: 112, y: -98 }}
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
            <span
              className={`font-serif not-italic font-normal text-[#2F2926] dark:text-[#F5EFEB]/25 leading-none translate-y-[-2%] select-none ${
                deviceView === "mobile"
                  ? "text-[200px]"
                  : deviceView === "tablet"
                  ? "text-[380px]"
                  : "text-[200px] sm:text-[380px] md:text-[480px] lg:text-[560px]"
              }`}
            >
              &
            </span>
          </div>
        }
        title={
          <div
            ref={titleContainerRef}
            className={`w-full flex flex-col items-center justify-center pointer-events-none select-none max-w-7xl mx-auto relative ${
              deviceView === "mobile"
                ? "px-2"
                : deviceView === "tablet"
                ? "px-6"
                : "px-2 sm:px-8 md:px-16"
            }`}
          >
            {/* Canva Alignment Guides & Mobile View Safe Zone Boundary */}
            <CanvasAlignmentGuides
              guideState={guideState}
              showMobileBoundary={effectiveShowMobileBoundary}
              showAlignmentGuides={effectiveShowAlignmentGuides}
              isEditor={isEditor}
              deviceView={isMobile ? "mobile" : deviceView}
              containerWidth={containerWidth || undefined}
            />

            {/* Top Eyebrow: customizable */}
            <div
              className={`absolute left-0 right-0 flex items-center justify-center pointer-events-auto ${
                deviceView === "mobile"
                  ? "-top-20"
                  : deviceView === "tablet"
                  ? "-top-32"
                  : "-top-20 sm:-top-32 md:-top-40 lg:-top-44"
              }`}
            >
              <DraggableHeroItem
                id="eyebrow"
                label="Eyebrow"
                position={textPositions?.eyebrow}
                isEditor={isEditor}
                isOutsideMobile={outsideMobileIds.has("eyebrow")}
                onPositionChange={onTextPositionChange}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                <span
                  style={{
                    fontFamily: getFontFamilyCss(eyebrowFont, "'Inter', sans-serif"),
                    ...getEyebrowFontSizeStyle(eyebrowSize, deviceView),
                  }}
                  className="uppercase tracking-[0.35em] text-[#2F2926]/85 dark:text-[#F5EFEB]/85 font-medium whitespace-nowrap block"
                >
                  {eyebrow}
                </span>
              </DraggableHeroItem>
            </div>

            {/* Middle Row: Partner 1 on Left, Orb in Center, Partner 2 on Right */}
            <div className="w-full flex items-center justify-between">
              {/* Left Column: Partner 1 + Date */}
              <div
                className={`flex-1 flex flex-col items-end text-right min-w-0 ${
                  deviceView === "mobile"
                    ? "pr-5"
                    : deviceView === "tablet"
                    ? "pr-14"
                    : "pr-5 sm:pr-16 md:pr-28 lg:pr-36"
                }`}
              >
                <DraggableHeroItem
                  id="partner1"
                  label="Partner 1"
                  position={textPositions?.partner1}
                  isEditor={isEditor}
                  isOutsideMobile={outsideMobileIds.has("partner1")}
                  onPositionChange={onTextPositionChange}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  <h1
                    style={{
                      fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
                      ...getPartnerFontSizeStyle(partnerSize, deviceView),
                    }}
                    className="font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap"
                  >
                    {firstName}
                  </h1>
                </DraggableHeroItem>

                <DraggableHeroItem
                  id="date"
                  label="Wedding Date"
                  position={textPositions?.date}
                  isEditor={isEditor}
                  isOutsideMobile={outsideMobileIds.has("date")}
                  onPositionChange={onTextPositionChange}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  className="mt-1.5 sm:mt-2.5"
                >
                  <p
                    style={{
                      fontFamily: getFontFamilyCss(dateFont, "'Inter', sans-serif"),
                      ...getDateFontSizeStyle(dateSize, deviceView),
                    }}
                    className="text-[#2F2926]/75 dark:text-[#F5EFEB]/75 whitespace-nowrap"
                  >
                    {formattedDate}
                  </p>
                </DraggableHeroItem>
              </div>

              {/* Center Spacer accommodating the 3D Orb and & */}
              <div
                className={`shrink-0 pointer-events-none ${
                  deviceView === "mobile"
                    ? "w-[96px]"
                    : deviceView === "tablet"
                    ? "w-[125px]"
                    : "w-[96px] sm:w-[125px] md:w-[145px] lg:w-[165px]"
                }`}
              />

              {/* Right Column: Partner 2 + Photo Count */}
              <div
                className={`flex-1 flex flex-col items-start text-left min-w-0 ${
                  deviceView === "mobile"
                    ? "pl-9"
                    : deviceView === "tablet"
                    ? "pl-14"
                    : "pl-9 sm:pl-16 md:pl-24 lg:pl-32"
                }`}
              >
                <DraggableHeroItem
                  id="partner2"
                  label="Partner 2"
                  position={textPositions?.partner2}
                  isEditor={isEditor}
                  isOutsideMobile={outsideMobileIds.has("partner2")}
                  onPositionChange={onTextPositionChange}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  <h1
                    style={{
                      fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
                      ...getPartnerFontSizeStyle(partnerSize, deviceView),
                    }}
                    className="font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap"
                  >
                    {secondName}
                  </h1>
                </DraggableHeroItem>

                <DraggableHeroItem
                  id="photoCount"
                  label="Photo Count"
                  position={textPositions?.photoCount}
                  isEditor={isEditor}
                  isOutsideMobile={outsideMobileIds.has("photoCount")}
                  onPositionChange={onTextPositionChange}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  className={
                    deviceView === "mobile"
                      ? "mt-1.5"
                      : deviceView === "tablet"
                      ? "mt-2.5"
                      : "mt-1.5 sm:mt-3"
                  }
                >
                  <p
                    className={`font-sans text-[#2F2926]/75 dark:text-[#F5EFEB]/75 whitespace-nowrap ${
                      deviceView === "mobile"
                        ? "text-[10.5px] tracking-wide"
                        : deviceView === "tablet"
                        ? "text-xs tracking-wider"
                        : "text-[10.5px] sm:text-xs md:text-sm tracking-wide sm:tracking-wider"
                    }`}
                  >
                    {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
                  </p>
                </DraggableHeroItem>
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
          <div className="flex items-center justify-center gap-3 uppercase tracking-[0.3em] text-[#E7DED5] mb-3 drop-shadow">
            <span className="w-8 h-px bg-[#E7DED5]/70" />
            <span
              style={{
                fontFamily: getFontFamilyCss(eyebrowFont, "'Inter', sans-serif"),
                ...getEyebrowFontSizeStyle(eyebrowSize, deviceView),
              }}
            >
              {eyebrow.replace(/^-+|-+$/g, "").trim() || "Wedding Archive"}
            </span>
            <span className="w-8 h-px bg-[#E7DED5]/70" />
          </div>

          <h2
            style={{
              fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
              ...getPartnerFontSizeStyle(partnerSize, deviceView),
            }}
            className="font-normal text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
          >
            {`${firstName} & ${secondName}`}
          </h2>

          <DraggableHeroItem
            id="quote"
            label="Invitation Quote"
            position={textPositions?.quote}
            isEditor={isEditor}
            isOutsideMobile={outsideMobileIds.has("quote")}
            onPositionChange={onTextPositionChange}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            className="mb-6"
          >
            <p
              style={{
                fontFamily: getFontFamilyCss(quoteFont, "'Cormorant Garamond', Georgia, serif"),
                ...getQuoteFontSizeStyle(quoteSize, deviceView),
              }}
              className="italic text-[#F8F5F0]/95 max-w-lg mx-auto drop-shadow"
            >
              {tagline}
            </p>
          </DraggableHeroItem>

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
