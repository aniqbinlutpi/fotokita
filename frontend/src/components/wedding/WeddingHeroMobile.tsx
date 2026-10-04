import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { Shdr12 } from "@/components/ui/shdr-12";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { UploadCloud, ChevronDown } from "lucide-react";
import imgExpand from "@/assets/images/img-expand.png";
import {
  getFontFamilyCss,
  getPartnerFontSizeStyle,
  getEyebrowFontSizeStyle,
  getDateFontSizeStyle,
  getQuoteFontSizeStyle,
  getAmpersandFontSizeStyle,
  parseOrbSize,
} from "@/lib/typography";
import { DraggableHeroItem, type Position } from "./DraggableHeroItem";
import {
  calculateBringToFront,
  calculateSendToBack,
  getElementZIndex,
  DEFAULT_Z_INDEX,
} from "@/lib/layers";
import {
  CanvasAlignmentGuides,
  type AlignmentGuideState,
} from "./CanvasAlignmentGuides";
import type { WeddingHeroProps } from "./WeddingHero";

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

export const WeddingHeroMobile: React.FC<WeddingHeroProps> = ({
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
  ampersandSize = "380",
  orbSize,
  textPositions,
  isEditor = false,
  onTextPositionChange,
  showAlignmentGuides: propShowAlignmentGuides,
}) => {
  const activeTheme = useMemo(() => {
    return themePresets[themePalette] || themePresets.warmGold!;
  }, [themePalette]);

  const [guideState, setGuideState] = useState<AlignmentGuideState | null>(null);
  const effectiveShowAlignmentGuides = propShowAlignmentGuides ?? true;

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

  const handleDragMove = useCallback(
    (id: string, rawOffset: Position, _initialPos: Position, domRect?: DOMRect): Position => {
      let snappedX = rawOffset.x;
      let snappedY = rawOffset.y;
      let snapCenterX = false;
      let snapCenterY = false;

      const SNAP_THRESHOLD = 6;

      if (domRect && titleContainerRef.current) {
        const containerRect = titleContainerRef.current.getBoundingClientRect();
        const elCenterX = domRect.left + domRect.width / 2 - containerRect.left;
        const elCenterY = domRect.top + domRect.height / 2 - containerRect.top;
        const canvasCenterX = containerRect.width / 2;
        const canvasCenterY = containerRect.height / 2;

        if (Math.abs(elCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
          snappedX = rawOffset.x - (elCenterX - canvasCenterX);
          snapCenterX = true;
        }

        if (Math.abs(elCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
          snappedY = rawOffset.y - (elCenterY - canvasCenterY);
          snapCenterY = true;
        }
      }

      const labelMap: Record<string, string> = {
        partner1: "Partner 1",
        partner2: "Partner 2",
        date: "Wedding Date",
        eyebrow: "Eyebrow",
        photoCount: "Photograph Count",
        quote: "Tagline Quote",
        ampersand: "& Symbol",
        orb: "3D Orb",
      };

      setGuideState({
        isDragging: true,
        activeId: id,
        activeLabel: labelMap[id] || id,
        currentX: Math.round(snappedX),
        currentY: Math.round(snappedY),
        snapCenterX,
        snapCenterY,
        snapSiblingY: false,
        siblingLabel: "",
        snapSiblingX: false,
        isOutsideMobile: false,
        distanceToMobileEdge: 0,
      });

      return { x: Math.round(snappedX), y: Math.round(snappedY) };
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setGuideState(null);
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

  const handleLockToggle = useCallback(
    (id: string, locked: boolean) => {
      const currentPos = textPositions?.[id] || { x: 0, y: 0 };
      onTextPositionChange?.(id, {
        ...currentPos,
        locked,
      });
    },
    [textPositions, onTextPositionChange]
  );

  const handleBringToFront = useCallback(
    (id: string) => {
      const newZ = calculateBringToFront(id, textPositions);
      const currentPos = textPositions?.[id] || { x: 0, y: 0 };
      onTextPositionChange?.(id, {
        ...currentPos,
        zIndex: newZ,
      });
    },
    [textPositions, onTextPositionChange]
  );

  const handleSendToBack = useCallback(
    (id: string) => {
      const newZ = calculateSendToBack(id, textPositions);
      const currentPos = textPositions?.[id] || { x: 0, y: 0 };
      onTextPositionChange?.(id, {
        ...currentPos,
        zIndex: newZ,
      });
    },
    [textPositions, onTextPositionChange]
  );

  const ampersandZ = getElementZIndex("ampersand", textPositions);
  const orbZ = getElementZIndex("orb", textPositions);
  const titleZ = Math.max(
    getElementZIndex("partner1", textPositions),
    getElementZIndex("partner2", textPositions),
    getElementZIndex("date", textPositions),
    getElementZIndex("eyebrow", textPositions),
    getElementZIndex("photoCount", textPositions),
    DEFAULT_Z_INDEX.partner1 ?? 30
  );

  // Mobile specific dimensioning
  const mobileOrbSize = textPositions?.orb?.width || (orbSize ? Math.min(68, parseOrbSize(orbSize)) : 54);
  const mobileAmpersandSize = getAmpersandFontSizeStyle(ampersandSize, "mobile").fontSize;
  const mobilePartner1Style = getPartnerFontSizeStyle(partnerSize, "mobile");
  const mobilePartner2Style = getPartnerFontSizeStyle(partnerSize, "mobile");
  const mobileEyebrowStyle = getEyebrowFontSizeStyle(eyebrowSize, "mobile");
  const mobileDateStyle = getDateFontSizeStyle(dateSize, "mobile");

  return (
    <section className="relative w-full">
      <ScrollExpand
        src={imgExpand}
        alt={wedding?.name ? `${wedding.name} Wedding Archive` : "Wedding Archive"}
        useWindowScroll={true}
        shape="circle"
        circleSize={0.20}
        orbSize={mobileOrbSize}
        orbOffset={{ x: 28, y: -22 }}
        orbShift={textPositions?.orb}
        behindOrbZIndex={ampersandZ}
        orbZIndex={orbZ}
        titleZIndex={titleZ}
        startRadius={9999}
        endRadius={0}
        mediaZoom={1.28}
        scrollDistance={1.1}
        holdDistance={0.35}
        smoothing={0.08}
        overlayScrim={0.45}
        orb={
          <DraggableHeroItem
            id="orb"
            label="3D Orb"
            position={textPositions?.orb}
            isEditor={isEditor}
            isOutsideMobile={false}
            onPositionChange={onTextPositionChange}
            onLockToggle={handleLockToggle}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            className="size-full flex items-center justify-center pointer-events-auto"
          >
            <Shdr12
              className="size-full pointer-events-none"
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
              ariaLabel="3D Brick Orb"
            />
          </DraggableHeroItem>
        }
        behindOrb={
          <div className="flex items-center justify-center pointer-events-none select-none">
            <DraggableHeroItem
              id="ampersand"
              label="& Symbol"
              position={textPositions?.ampersand}
              isEditor={isEditor}
              isOutsideMobile={false}
              onPositionChange={onTextPositionChange}
              onLockToggle={handleLockToggle}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              className="pointer-events-auto"
            >
              <span
                style={{
                  fontSize: `var(--custom-font-size, ${
                    textPositions?.ampersand?.fontSize
                      ? `${textPositions.ampersand.fontSize}px`
                      : mobileAmpersandSize
                  })`,
                }}
                className="font-serif not-italic font-normal text-[#2F2926] dark:text-[#F5EFEB]/25 leading-none select-none block pointer-events-none"
              >
                &
              </span>
            </DraggableHeroItem>
          </div>
        }
        title={
          <div
            ref={titleContainerRef}
            className="w-full flex flex-col items-center justify-center pointer-events-none select-none px-4 relative max-w-sm mx-auto"
          >
            {/* Canva Alignment Guides */}
            <CanvasAlignmentGuides
              guideState={guideState}
              showMobileBoundary={false}
              showAlignmentGuides={effectiveShowAlignmentGuides}
              isEditor={isEditor}
              deviceView="mobile"
              containerWidth={containerWidth || undefined}
            />

            {/* Top Eyebrow */}
            <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-auto -top-16 sm:-top-20">
              <DraggableHeroItem
                id="eyebrow"
                label="Eyebrow"
                position={textPositions?.eyebrow}
                isEditor={isEditor}
                isOutsideMobile={false}
                onPositionChange={onTextPositionChange}
                onLockToggle={handleLockToggle}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                <span
                  style={{
                    fontFamily: getFontFamilyCss(eyebrowFont, "'Inter', sans-serif"),
                    fontSize: `var(--custom-font-size, ${
                      textPositions?.eyebrow?.fontSize
                        ? `${textPositions.eyebrow.fontSize}px`
                        : mobileEyebrowStyle.fontSize
                    })`,
                    textAlign: "center",
                  }}
                  className="uppercase tracking-[0.3em] text-[#2F2926]/85 dark:text-[#F5EFEB]/85 font-medium break-words whitespace-pre-wrap block"
                >
                  {eyebrow}
                </span>
              </DraggableHeroItem>
            </div>

            {/* Vertical Stacked Mobile Content */}
            <div className="w-full flex flex-col items-center justify-center gap-0 py-2">
              {/* Partner 1 Name */}
              <DraggableHeroItem
                id="partner1"
                label="Partner 1"
                position={textPositions?.partner1}
                isEditor={isEditor}
                isOutsideMobile={false}
                onPositionChange={onTextPositionChange}
                onLockToggle={handleLockToggle}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                <h1
                  style={{
                    fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
                    fontSize: `var(--custom-font-size, ${
                      textPositions?.partner1?.fontSize
                        ? `${textPositions.partner1.fontSize}px`
                        : mobilePartner1Style.fontSize
                    })`,
                    textAlign: "center",
                  }}
                  className="font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-[1.08] drop-shadow-xs break-words whitespace-pre-wrap"
                >
                  {firstName}
                </h1>
              </DraggableHeroItem>

              {/* Wedding Date */}
              <DraggableHeroItem
                id="date"
                label="Wedding Date"
                position={textPositions?.date}
                isEditor={isEditor}
                isOutsideMobile={false}
                onPositionChange={onTextPositionChange}
                onLockToggle={handleLockToggle}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                className="mt-1"
              >
                <p
                  style={{
                    fontFamily: getFontFamilyCss(dateFont, "'Inter', sans-serif"),
                    fontSize: `var(--custom-font-size, ${
                      textPositions?.date?.fontSize
                        ? `${textPositions.date.fontSize}px`
                        : mobileDateStyle.fontSize
                    })`,
                    textAlign: "center",
                  }}
                  className="text-[#2F2926]/75 dark:text-[#F5EFEB]/75 break-words whitespace-pre-wrap"
                >
                  {formattedDate}
                </p>
              </DraggableHeroItem>

              {/* Spacer matching the centerpiece & + 3D Orb area */}
              <div className="h-[105px] shrink-0 pointer-events-none" />

              {/* Partner 2 Name */}
              <DraggableHeroItem
                id="partner2"
                label="Partner 2"
                position={textPositions?.partner2}
                isEditor={isEditor}
                isOutsideMobile={false}
                onPositionChange={onTextPositionChange}
                onLockToggle={handleLockToggle}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              >
                <h1
                  style={{
                    fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
                    fontSize: `var(--custom-font-size, ${
                      textPositions?.partner2?.fontSize
                        ? `${textPositions.partner2.fontSize}px`
                        : mobilePartner2Style.fontSize
                    })`,
                    textAlign: "center",
                  }}
                  className="font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-[1.08] drop-shadow-xs break-words whitespace-pre-wrap"
                >
                  {secondName}
                </h1>
              </DraggableHeroItem>

              {/* Photo Count */}
              <DraggableHeroItem
                id="photoCount"
                label="Photo Count"
                position={textPositions?.photoCount}
                isEditor={isEditor}
                isOutsideMobile={false}
                onPositionChange={onTextPositionChange}
                onLockToggle={handleLockToggle}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                className="mt-1"
              >
                <p
                  style={{
                    fontSize: `var(--custom-font-size, ${
                      textPositions?.photoCount?.fontSize
                        ? `${textPositions.photoCount.fontSize}px`
                        : undefined
                    })`,
                    textAlign: textPositions?.photoCount?.textAlign || "center",
                  }}
                  className="font-sans text-[11px] tracking-wider text-[#2F2926]/70 dark:text-[#F5EFEB]/70 whitespace-nowrap text-center"
                >
                  {photoCount} {photoCount === 1 ? "Photograph" : "Photographs"}
                </p>
              </DraggableHeroItem>
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
          <div className="inline-flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-[#7A7069] dark:text-[#A89F97] drop-shadow-xs">
            <span>Scroll to expand</span>
            <ChevronDown className="size-3.5 animate-bounce text-[#A67C6B]" />
          </div>
        }
      >
        {/* Full-bleed expanded overlay content */}
        <div className="flex flex-col items-center justify-center text-center max-w-sm px-4 pointer-events-auto">
          <div className="flex items-center justify-center gap-2 uppercase tracking-[0.25em] text-[#E7DED5] mb-2 drop-shadow-xs text-[10px]">
            <span className="w-6 h-px bg-[#E7DED5]/70" />
            <span>
              {eyebrow.replace(/^-+|-+$/g, "").trim() || "Wedding Archive"}
            </span>
            <span className="w-6 h-px bg-[#E7DED5]/70" />
          </div>

          <h2
            style={{
              fontFamily: getFontFamilyCss(partnerFont, "'Cormorant Garamond', Georgia, serif"),
              fontSize: mobilePartner1Style.fontSize,
            }}
            className="font-normal text-white tracking-tight leading-[1.1] mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
          >
            {`${firstName} & ${secondName}`}
          </h2>

          <DraggableHeroItem
            id="quote"
            label="Invitation Quote"
            position={textPositions?.quote}
            isEditor={isEditor}
            isOutsideMobile={false}
            onPositionChange={onTextPositionChange}
            onLockToggle={handleLockToggle}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            className="mb-5"
          >
            <p
              style={{
                fontFamily: getFontFamilyCss(quoteFont, "'Cormorant Garamond', Georgia, serif"),
                fontSize: `var(--custom-font-size, ${
                  textPositions?.quote?.fontSize
                    ? `${textPositions.quote.fontSize}px`
                    : getQuoteFontSizeStyle(quoteSize, "mobile").fontSize
                })`,
                textAlign: "center",
              }}
              className="italic text-[#F8F5F0]/95 max-w-xs mx-auto drop-shadow-xs break-words whitespace-pre-wrap leading-relaxed"
            >
              {tagline}
            </p>
          </DraggableHeroItem>

          <div className="flex items-center justify-center">
            <Button
              onClick={onOpenUpload}
              className="bg-[#FFFCF8] dark:bg-[#1A1715] text-[#2F2926] dark:text-[#F5EFEB] hover:bg-[#F8F5F0] dark:hover:bg-[#25211E] border border-[#E7DED5] dark:border-[#332B25] transition-all duration-200 px-6 py-2.5 rounded-sm text-[11px] uppercase tracking-widest font-medium shadow-2xl gap-2 h-auto cursor-pointer pointer-events-auto"
            >
              <UploadCloud className="size-3.5 text-[#A67C6B]" />
              <span>Contribute Memories</span>
            </Button>
          </div>
        </div>
      </ScrollExpand>
    </section>
  );
};

export default WeddingHeroMobile;
