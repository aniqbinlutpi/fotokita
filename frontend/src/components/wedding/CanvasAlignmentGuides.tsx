import { AlertTriangle, Crosshair, Smartphone } from "lucide-react";

export interface AlignmentGuideState {
  isDragging: boolean;
  activeId: string | null;
  activeLabel: string | null;
  currentX: number;
  currentY: number;
  snapCenterX: boolean;
  snapCenterY: boolean;
  snapSiblingY: boolean;
  siblingLabel?: string;
  snapSiblingX: boolean;
  isOutsideMobile: boolean;
  distanceToMobileEdge: number;
}

export interface CanvasAlignmentGuidesProps {
  guideState: AlignmentGuideState | null;
  showMobileBoundary?: boolean;
  showAlignmentGuides?: boolean;
  isEditor?: boolean;
  deviceView?: "full" | "mobile" | "tablet";
  /** Measured pixel width of the canvas container */
  containerWidth?: number;
}

export const MOBILE_RESOLUTION_WIDTH = 390;
export const DESKTOP_MOBILE_GUIDE_WIDTH = 630;

export const CanvasAlignmentGuides: React.FC<CanvasAlignmentGuidesProps> = ({
  guideState,
  showMobileBoundary = true,
  showAlignmentGuides = true,
  isEditor = false,
  deviceView = "full",
  containerWidth,
}) => {
  if (!isEditor) return null;

  const isDragging = guideState?.isDragging ?? false;
  const isLargeOffset = guideState?.isOutsideMobile ?? false;

  const cw = containerWidth ?? 0;
  const isMobileView = deviceView === "mobile" || (cw > 0 && cw <= MOBILE_RESOLUTION_WIDTH);
  // Expanded width on desktop to accommodate wider desktop spacing, capped at container width
  const mobileZoneWidth = cw > 0 ? Math.min(cw, DESKTOP_MOBILE_GUIDE_WIDTH) : DESKTOP_MOBILE_GUIDE_WIDTH;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">

      {/* ── 1. Desktop mobile safe zone boundary (only shown in desktop view) ──── */}
      {showMobileBoundary && !isMobileView && (
        <>
          {/* Subtle vertical center line — always shown as alignment reference on desktop */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-sky-400/30 dark:bg-sky-400/20 z-10 pointer-events-none"
          />

          {/* Shaded mobile-width zone centered on the page — expanded visual guide on desktop */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 border-x border-dashed border-sky-400/50 dark:border-sky-400/35 bg-sky-500/[0.025] dark:bg-sky-500/[0.02]"
            style={{ width: `${mobileZoneWidth}px` }}
          >
            {/* Top badge — keeps standard 390px mobile resolution label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/80 text-[9px] font-mono text-muted-foreground whitespace-nowrap shadow-sm">
              <Smartphone className="size-2.5 text-sky-500 shrink-0" />
              <span>~390px approx. mobile</span>
            </div>

            {/* Overflow warning — shown during drag when element is outside zone */}
            {isDragging && isLargeOffset && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500 text-white text-[9px] font-sans font-semibold whitespace-nowrap shadow-md animate-in fade-in-50 ring-2 ring-rose-300/60">
                <AlertTriangle className="size-3" />
                <span>Will overflow on mobile!</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 2. Canva-style snap lines (dynamic during drag) ─────────────────── */}
      {showAlignmentGuides && isDragging && guideState && (
        <>
          {/* Center Vertical — pink snap line at left:50% */}
          {guideState.snapCenterX && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-[#E11D48] dark:bg-[#FB7185] shadow-[0_0_10px_rgba(225,29,72,0.85)] z-40 animate-in fade-in-50 duration-75">
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] font-sans font-semibold tracking-wider uppercase shadow-md flex items-center gap-1 whitespace-nowrap">
                <Crosshair className="size-2.5" />
                <span>Center X</span>
              </div>
            </div>
          )}

          {/* Center Horizontal — pink snap line at top:50% */}
          {guideState.snapCenterY && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#E11D48] dark:bg-[#FB7185] shadow-[0_0_10px_rgba(225,29,72,0.85)] z-40 animate-in fade-in-50 duration-75">
              <div className="absolute left-6 -top-5 px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] font-sans font-semibold tracking-wider uppercase shadow-md flex items-center gap-1 whitespace-nowrap">
                <Crosshair className="size-2.5" />
                <span>Center Y</span>
              </div>
            </div>
          )}

          {/* Sibling Horizontal alignment */}
          {guideState.snapSiblingY && (
            <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-[1.5px] border-t-2 border-dashed border-[#8B5CF6] dark:border-[#A78BFA] shadow-[0_0_8px_rgba(139,92,246,0.6)] z-40 animate-in fade-in-50">
              <div className="absolute right-0 -top-5 px-2 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[9px] font-sans font-semibold shadow-md whitespace-nowrap">
                Aligned with {guideState.siblingLabel || "Counterpart"}
              </div>
            </div>
          )}

          {/* Sibling Vertical alignment */}
          {guideState.snapSiblingX && (
            <div className="absolute top-1/3 bottom-1/3 left-1/2 -translate-x-1/2 w-[1.5px] border-l-2 border-dashed border-[#8B5CF6] dark:border-[#A78BFA] shadow-[0_0_8px_rgba(139,92,246,0.6)] z-40 animate-in fade-in-50">
              <div className="absolute top-0 -left-12 px-2 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[9px] font-sans font-semibold shadow-md whitespace-nowrap">
                Aligned with {guideState.siblingLabel || "Partner"}
              </div>
            </div>
          )}

          {/* Live coordinate HUD */}
          <div className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/95 backdrop-blur-md border border-border shadow-xl text-xs font-mono">
            <span className="font-semibold text-primary">{guideState.activeLabel}:</span>
            <span className="text-foreground">
              X: {guideState.currentX > 0 ? `+${guideState.currentX}` : guideState.currentX}px
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-foreground">
              Y: {guideState.currentY > 0 ? `+${guideState.currentY}` : guideState.currentY}px
            </span>
            {guideState.snapCenterX && (
              <span className="px-1.5 py-0.5 rounded bg-[#E11D48]/15 text-[#E11D48] text-[10px] font-sans font-semibold">
                Snap: Center
              </span>
            )}
            {isLargeOffset && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-sans font-semibold flex items-center gap-1">
                <AlertTriangle className="size-3" /> Mobile overflow
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
