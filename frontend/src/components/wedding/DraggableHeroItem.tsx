import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GripVertical,
  RotateCcw,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

export interface Position {
  x: number;
  y: number;
  zIndex?: number;
  locked?: boolean;
  width?: number;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

export interface DraggableHeroItemProps {
  id: string;
  label: string;
  position?: Position;
  isEditor?: boolean;
  /** When true, shows a persistent amber warning ring — element is outside mobile safe zone */
  isOutsideMobile?: boolean;
  onPositionChange?: (id: string, pos: Position) => void;
  onLockToggle?: (id: string, locked: boolean) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  onDragStart?: (id: string, initialPos: Position, rect?: DOMRect) => void;
  onDragMove?: (id: string, rawOffset: Position, initialPos: Position, rect?: DOMRect) => Position | void;
  /** finalRect is the element's DOMRect at the moment of pointer-up */
  onDragEnd?: (id: string, finalPos: Position, finalRect?: DOMRect) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ItemSizeLimits {
  min: number;
  max: number;
  default: number;
  scaleFactor: number;
}

const ITEM_CONFIGS: Record<string, ItemSizeLimits> = {
  ampersand: { min: 40, max: 800, default: 380, scaleFactor: 0.6 },
  partner1: { min: 10, max: 240, default: 72, scaleFactor: 0.45 },
  partner2: { min: 10, max: 240, default: 72, scaleFactor: 0.45 },
  eyebrow: { min: 6, max: 80, default: 12, scaleFactor: 0.25 },
  date: { min: 6, max: 80, default: 13, scaleFactor: 0.25 },
  photoCount: { min: 6, max: 60, default: 12, scaleFactor: 0.25 },
  quote: { min: 8, max: 120, default: 18, scaleFactor: 0.35 },
  orb: { min: 30, max: 400, default: 130, scaleFactor: 1.0 },
};

export const DraggableHeroItem: React.FC<DraggableHeroItemProps> = ({
  id,
  label,
  position = { x: 0, y: 0 },
  isEditor = false,
  isOutsideMobile = false,
  onPositionChange,
  onLockToggle,
  onBringToFront,
  onSendToBack,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
  className = "",
  style = {},
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingFont, setIsResizingFont] = useState(false);
  const [resizeIndicator, setResizeIndicator] = useState<{
    type: "width" | "font";
    value: string;
  } | null>(null);

  const isLocked = Boolean(position?.locked);
  const [liveOffset, setLiveOffset] = useState<Position>({
    x: position?.x ?? 0,
    y: position?.y ?? 0,
  });

  const [liveWidth, setLiveWidth] = useState<number | undefined>(position?.width);
  const [liveFontSize, setLiveFontSize] = useState<number | undefined>(position?.fontSize);
  const [liveTextAlign, setLiveTextAlign] = useState<"left" | "center" | "right" | undefined>(position?.textAlign);

  // Keep live offset and dimensions in sync when position prop changes externally
  useEffect(() => {
    if (!isDragging) {
      setLiveOffset({
        x: position?.x ?? 0,
        y: position?.y ?? 0,
      });
    }
  }, [position?.x, position?.y, isDragging]);

  useEffect(() => {
    if (!isResizingWidth) {
      setLiveWidth(position?.width);
    }
  }, [position?.width, isResizingWidth]);

  useEffect(() => {
    if (!isResizingFont) {
      setLiveFontSize(position?.fontSize);
    }
  }, [position?.fontSize, isResizingFont]);

  useEffect(() => {
    setLiveTextAlign(position?.textAlign);
  }, [position?.textAlign]);

  // Click outside to deselect
  useEffect(() => {
    if (!isEditor || !isSelected) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (domRef.current && !domRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, [isEditor, isSelected]);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const latestOffsetRef = useRef<Position>(liveOffset);
  latestOffsetRef.current = liveOffset;

  // Main dragging handler for moving element around canvas
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isEditor) return;
      setIsSelected(true);
      if (isLocked) return;
      // Only drag on primary mouse button or touch
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const initialX = liveOffset.x;
      const initialY = liveOffset.y;

      dragStartRef.current = {
        startX,
        startY,
        initialX,
        initialY,
        hasMoved: false,
      };

      setIsDragging(true);

      const rect = domRef.current?.getBoundingClientRect();
      if (onDragStart) {
        onDragStart(id, { x: initialX, y: initialY }, rect);
      }

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const deltaX = moveEvt.clientX - startX;
        const deltaY = moveEvt.clientY - startY;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          dragStartRef.current.hasMoved = true;
        }

        const rawX = Math.round(initialX + deltaX);
        const rawY = Math.round(initialY + deltaY);

        const currentRect = domRef.current?.getBoundingClientRect();
        const snapped = onDragMove
          ? onDragMove(id, { x: rawX, y: rawY }, { x: initialX, y: initialY }, currentRect)
          : undefined;

        const effectivePos = snapped
          ? { x: Math.round(snapped.x), y: Math.round(snapped.y) }
          : { x: rawX, y: rawY };
        latestOffsetRef.current = effectivePos;
        setLiveOffset(effectivePos);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        setIsDragging(false);

        const finalPos: Position = {
          ...latestOffsetRef.current,
          x: Math.round(latestOffsetRef.current.x),
          y: Math.round(latestOffsetRef.current.y),
          zIndex: position?.zIndex,
          locked: position?.locked,
          width: liveWidth,
          fontSize: liveFontSize,
          textAlign: liveTextAlign ?? position?.textAlign,
        };
        const finalRect = domRef.current?.getBoundingClientRect();

        if (onDragEnd) {
          onDragEnd(id, finalPos, finalRect);
        }

        if (dragStartRef.current.hasMoved && onPositionChange) {
          onPositionChange(id, finalPos);
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [
      isEditor,
      isLocked,
      liveOffset.x,
      liveOffset.y,
      id,
      position?.zIndex,
      position?.locked,
      liveWidth,
      liveFontSize,
      liveTextAlign,
      onPositionChange,
      onDragStart,
      onDragMove,
      onDragEnd,
      position?.textAlign,
    ]
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const isObjectItem = id === "orb";

  // Canva-style Side Handle Resizing (Adjusts Bounding Box Width & Wraps Text / Scales Orb)
  const handleSideResizeStart = (e: React.PointerEvent, side: "left" | "right") => {
    if (!isEditor || isLocked) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore if iframe/browser restricts pointer capture
    }

    const startX = e.clientX;
    const limits = ITEM_CONFIGS[id] ?? { min: 50, max: 1400, default: 200, scaleFactor: 1 };
    const currentDomWidth =
      contentRef.current?.getBoundingClientRect().width ??
      domRef.current?.getBoundingClientRect().width ??
      200;
    const initialWidth = liveWidth ?? (position?.width ? position.width : Math.round(currentDomWidth));
    const initialOffset = { ...latestOffsetRef.current };
    const initialX = initialOffset.x;
    const initialY = initialOffset.y;

    // Detect layout anchor alignment
    const parent = domRef.current?.parentElement;
    let alignMode: "flex-start" | "flex-end" | "center" = "flex-start";
    if (parent) {
      const computedParent = window.getComputedStyle(parent);
      if (computedParent.alignItems === "flex-end" || computedParent.alignItems === "end") {
        alignMode = "flex-end";
      } else if (computedParent.alignItems === "center") {
        alignMode = "center";
      } else {
        alignMode = "flex-start";
      }
    }
    const computedSelf = domRef.current ? window.getComputedStyle(domRef.current) : null;
    if (computedSelf?.alignSelf === "flex-end" || computedSelf?.alignSelf === "end") {
      alignMode = "flex-end";
    } else if (computedSelf?.alignSelf === "flex-start" || computedSelf?.alignSelf === "start") {
      alignMode = "flex-start";
    } else if (computedSelf?.alignSelf === "center") {
      alignMode = "center";
    }

    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    setIsResizingWidth(true);
    setResizeIndicator({ type: "width", value: `${initialWidth}px` });

    let latestW = initialWidth;
    let latestX = initialX;
    let rafId: number | null = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const clientX = moveEvt.clientX;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        const deltaX = clientX - startX;
        // Right handle: moving right expands width; Left handle: moving left expands width
        const change = side === "right" ? deltaX : -deltaX;
        const minW = isObjectItem ? limits.min : 50;
        const maxW = isObjectItem ? limits.max : 1400;
        const computedW = Math.max(minW, Math.min(maxW, Math.round(initialWidth + change)));
        const actualDeltaW = computedW - initialWidth;

        let newX = initialX;
        if (alignMode === "flex-end") {
          // Right-anchored (e.g. Partner 1):
          // Dragging right handle expands to the right; shift x right so left edge stays pinned
          // Dragging left handle expands to the left; x stays same because right edge is already pinned!
          if (side === "right") {
            newX = initialX + actualDeltaW;
          } else {
            newX = initialX;
          }
        } else if (alignMode === "flex-start") {
          // Left-anchored (e.g. Partner 2):
          // Dragging right handle expands to the right; x stays same because left edge is pinned!
          // Dragging left handle expands to the left; shift x left so right edge stays pinned
          if (side === "left") {
            newX = initialX - actualDeltaW;
          } else {
            newX = initialX;
          }
        } else {
          // Center-anchored (e.g. Eyebrow, mobile items):
          // Symmetrical expansion by default; shift x by half delta so opposite edge stays pinned!
          if (side === "right") {
            newX = initialX + Math.round(actualDeltaW / 2);
          } else {
            newX = initialX - Math.round(actualDeltaW / 2);
          }
        }

        latestW = computedW;
        latestX = newX;
        latestOffsetRef.current = { x: newX, y: initialY };
        setLiveWidth(computedW);
        setLiveOffset({ x: newX, y: initialY });
        setResizeIndicator({ type: "width", value: `${computedW}px` });
      });
    };

    const handlePointerUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      try {
        targetEl?.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;

      setIsResizingWidth(false);
      setResizeIndicator(null);

      if (onPositionChange) {
        onPositionChange(id, {
          ...latestOffsetRef.current,
          x: Math.round(latestX),
          y: Math.round(initialY),
          zIndex: position?.zIndex,
          locked: position?.locked,
          fontSize: isObjectItem ? undefined : liveFontSize,
          width: latestW,
          textAlign: liveTextAlign ?? position?.textAlign,
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Canva-style Corner Handle Resizing (Scales Font Size for text, or scales Width for objects like Orb)
  const handleCornerResizeStart = (
    e: React.PointerEvent,
    corner: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ) => {
    if (!isEditor || isLocked) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    const cornerCursor =
      corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = cornerCursor;
    document.body.style.userSelect = "none";

    const startX = e.clientX;
    const startY = e.clientY;
    const limits = ITEM_CONFIGS[id] ?? { min: 6, max: 800, default: 48, scaleFactor: 0.45 };

    if (isObjectItem) {
      const currentDomWidth =
        contentRef.current?.getBoundingClientRect().width ??
        domRef.current?.getBoundingClientRect().width ??
        limits.default;
      const initialSize = liveWidth ?? (position?.width ? position.width : Math.round(currentDomWidth));

      setIsResizingWidth(true);
      setResizeIndicator({ type: "width", value: `${initialSize}px` });

      let latestW = initialSize;
      let rafId: number | null = null;

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const clientX = moveEvt.clientX;
        const clientY = moveEvt.clientY;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const deltaX = clientX - startX;
          const deltaY = clientY - startY;

          let directionDelta = 0;
          if (corner === "bottom-right") {
            directionDelta = (deltaX + deltaY) / 2;
          } else if (corner === "bottom-left") {
            directionDelta = (-deltaX + deltaY) / 2;
          } else if (corner === "top-right") {
            directionDelta = (deltaX - deltaY) / 2;
          } else if (corner === "top-left") {
            directionDelta = (-deltaX - deltaY) / 2;
          }

          const computed = Math.max(
            limits.min,
            Math.min(limits.max, Math.round(initialSize + directionDelta * limits.scaleFactor))
          );
          latestW = computed;
          setLiveWidth(computed);
          setResizeIndicator({ type: "width", value: `${computed}px` });
        });
      };

      const handlePointerUp = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        try {
          targetEl?.releasePointerCapture?.(e.pointerId);
        } catch {
          // Ignore
        }
        document.body.style.cursor = originalCursor;
        document.body.style.userSelect = originalUserSelect;

        setIsResizingWidth(false);
        setResizeIndicator(null);

        if (onPositionChange) {
          onPositionChange(id, {
            ...latestOffsetRef.current,
            x: Math.round(latestOffsetRef.current.x),
            y: Math.round(latestOffsetRef.current.y),
            zIndex: position?.zIndex,
            locked: position?.locked,
            width: latestW,
            fontSize: undefined,
            textAlign: liveTextAlign ?? position?.textAlign,
          });
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return;
    }

    // For text items: query only within contentRef, NEVER inside the editor toolbar/label
    let measuredFs = limits.default;
    if (contentRef.current) {
      const textEl = (
        contentRef.current.matches("h1, h2, p, span, blockquote")
          ? contentRef.current
          : contentRef.current.querySelector("h1, h2, p, span, blockquote")
      ) as HTMLElement | null;

      if (textEl) {
        const computed = parseFloat(window.getComputedStyle(textEl).fontSize);
        if (!isNaN(computed) && computed > 0) {
          measuredFs = Math.round(computed);
        }
      }
    }

    const initialFs = liveFontSize ?? (position?.fontSize ? position.fontSize : measuredFs);

    setIsResizingFont(true);
    setResizeIndicator({ type: "font", value: `${initialFs}px` });

    let latestFs = initialFs;
    let rafId: number | null = null;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const clientX = moveEvt.clientX;
      const clientY = moveEvt.clientY;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        let directionDelta = 0;
        if (corner === "bottom-right") {
          directionDelta = (deltaX + deltaY) / 2;
        } else if (corner === "bottom-left") {
          directionDelta = (-deltaX + deltaY) / 2;
        } else if (corner === "top-right") {
          directionDelta = (deltaX - deltaY) / 2;
        } else if (corner === "top-left") {
          directionDelta = (-deltaX - deltaY) / 2;
        }

        const computed = Math.max(
          limits.min,
          Math.min(limits.max, Math.round(initialFs + directionDelta * limits.scaleFactor))
        );
        latestFs = computed;
        setLiveFontSize(computed);
        setResizeIndicator({ type: "font", value: `${computed}px` });
      });
    };

    const handlePointerUp = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      try {
        targetEl?.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;

      setIsResizingFont(false);
      setResizeIndicator(null);

      if (onPositionChange) {
        onPositionChange(id, {
          ...latestOffsetRef.current,
          x: Math.round(latestOffsetRef.current.x),
          y: Math.round(latestOffsetRef.current.y),
          zIndex: position?.zIndex,
          locked: position?.locked,
          width: liveWidth,
          fontSize: latestFs,
          textAlign: liveTextAlign ?? position?.textAlign,
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLiveOffset({ x: 0, y: 0 });
    if (onPositionChange) {
      onPositionChange(id, {
        x: 0,
        y: 0,
        zIndex: position?.zIndex,
        locked: position?.locked,
        width: liveWidth,
        fontSize: liveFontSize,
        textAlign: liveTextAlign ?? position?.textAlign,
      });
    }
  };

  const handleResetWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLiveWidth(undefined);
    if (onPositionChange) {
      onPositionChange(id, {
        ...latestOffsetRef.current,
        zIndex: position?.zIndex,
        locked: position?.locked,
        fontSize: liveFontSize,
        width: undefined,
        textAlign: liveTextAlign ?? position?.textAlign,
      });
    }
  };

  const handleResetFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLiveFontSize(undefined);
    if (onPositionChange) {
      onPositionChange(id, {
        ...latestOffsetRef.current,
        zIndex: position?.zIndex,
        locked: position?.locked,
        width: liveWidth,
        fontSize: undefined,
        textAlign: liveTextAlign ?? position?.textAlign,
      });
    }
  };

  const handleSetTextAlign = (align: "left" | "center" | "right") => {
    setLiveTextAlign(align);
    if (onPositionChange) {
      onPositionChange(id, {
        ...latestOffsetRef.current,
        zIndex: position?.zIndex,
        locked: position?.locked,
        width: liveWidth,
        fontSize: liveFontSize,
        textAlign: align,
      });
    }
  };

  const isShifted = Math.round(liveOffset.x) !== 0 || Math.round(liveOffset.y) !== 0;
  const currentZIndex = position?.zIndex;
  const effectiveWidth = liveWidth ?? position?.width;
  const effectiveFontSize = liveFontSize ?? position?.fontSize;
  const effectiveTextAlign = liveTextAlign ?? position?.textAlign;

  // Transform translation & layer z-index style
  const transformStyle: React.CSSProperties = {
    ...style,
    zIndex: isDragging ? 999 : currentZIndex !== undefined ? currentZIndex : style.zIndex,
    transform:
      isShifted || isDragging || isResizingWidth
        ? `translate3d(${Math.round(liveOffset.x)}px, ${Math.round(liveOffset.y)}px, 0)`
        : style.transform,
    width: effectiveWidth ? `${effectiveWidth}px` : undefined,
    minWidth: effectiveWidth ? `${effectiveWidth}px` : undefined,
    maxWidth: effectiveWidth || isResizingWidth ? "none" : undefined,
    flexShrink: 0,
    textAlign: effectiveTextAlign,
    willChange:
      isDragging || isResizingWidth || isResizingFont
        ? "transform, width"
        : isShifted
        ? "transform"
        : undefined,
    transition: isDragging || isResizingWidth || isResizingFont ? "none" : undefined,
    ...(effectiveFontSize ? ({ "--custom-font-size": `${effectiveFontSize}px` } as React.CSSProperties) : {}),
  };

  if (!isEditor) {
    // Normal guest view: render smoothly without drag badges or interaction listeners
    return (
      <div
        className={className}
        style={{
          ...transformStyle,
          willChange: isShifted ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    );
  }

  const showHandles = !isLocked && (isSelected || isDragging || isResizingWidth || isResizingFont);

  return (
    <div
      ref={domRef}
      onPointerDown={handlePointerDown}
      className={`group relative pointer-events-auto select-none transition-shadow ${
        isDragging
          ? "z-50 cursor-grabbing ring-2 ring-primary/90 shadow-2xl rounded-lg bg-background/20 backdrop-blur-xs scale-[1.01]"
          : isLocked
          ? "cursor-default hover:outline hover:outline-1 hover:outline-dashed hover:outline-amber-500/70 hover:bg-amber-500/[0.04] rounded-lg"
          : isSelected || isResizingWidth || isResizingFont
          ? "outline outline-1.5 outline-primary/80 outline-dashed bg-primary/[0.03] rounded-lg shadow-sm"
          : isOutsideMobile && !isDragging
          ? "cursor-grab outline outline-1 outline-dashed outline-amber-500/80 rounded-lg"
          : "cursor-grab hover:outline hover:outline-1 hover:outline-dashed hover:outline-primary/70 hover:bg-primary/[0.03] rounded-lg"
      } ${className}`}
      style={transformStyle}
      title={
        isLocked
          ? `${label} (Locked) — click Unlock to edit`
          : `${label} — Drag to move, side handles to wrap/expand width, corner handles to scale font size`
      }
    >
      {/* Persistent mini lock badge in corner when locked */}
      {isLocked && !isDragging && (
        <div
          className="absolute -top-2 -right-2 z-40 p-0.5 rounded-full bg-amber-500 text-white shadow-xs pointer-events-none"
          title="Position locked from dragging"
        >
          <Lock className="size-2.5" />
        </div>
      )}

      {/* Floating Drag Label, Layer Order, Dimensions & Lock Controls */}
      <div
        className={`absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap shadow-md pointer-events-auto transition-opacity duration-150 ${
          isDragging || isSelected || isResizingWidth || isResizingFont
            ? "opacity-100 bg-primary text-primary-foreground scale-105"
            : "opacity-0 group-hover:opacity-100 bg-foreground/90 text-background backdrop-blur-md"
        }`}
      >
        {isLocked ? (
          <div className="flex items-center gap-1 text-amber-400 font-semibold" title="Element locked from dragging">
            <Lock className="size-3 shrink-0" />
            <span>{label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <GripVertical className="size-3 opacity-70 shrink-0" />
            <span>{label}</span>
          </div>
        )}

        {isShifted && (
          <span className="text-[9px] opacity-80 font-mono ml-0.5">
            ({Math.round(liveOffset.x) > 0 ? `+${Math.round(liveOffset.x)}` : Math.round(liveOffset.x)},{" "}
            {Math.round(liveOffset.y) > 0 ? `+${Math.round(liveOffset.y)}` : Math.round(liveOffset.y)})
          </span>
        )}

        {/* Custom Width / Size Badge with Reset */}
        {effectiveWidth && !isLocked && (
          <button
            type="button"
            onClick={handleResetWidth}
            className="text-[9px] font-mono bg-white/20 hover:bg-white/30 text-inherit px-1 py-0.2 rounded cursor-pointer"
            title={
              isObjectItem
                ? "Custom size applied. Click to reset size to default"
                : "Custom width applied. Click to reset width to auto (1 line)"
            }
          >
            {isObjectItem ? "Size:" : "W:"}{effectiveWidth}px ✕
          </button>
        )}

        {/* Custom Font Size Badge with Reset (text items only) */}
        {!isObjectItem && effectiveFontSize && !isLocked && (
          <button
            type="button"
            onClick={handleResetFontSize}
            className="text-[9px] font-mono bg-white/20 hover:bg-white/30 text-inherit px-1 py-0.2 rounded cursor-pointer"
            title="Custom font size applied. Click to reset font size to default"
          >
            Font:{effectiveFontSize}px ✕
          </button>
        )}

        {/* Layer Order controls: Front / Back */}
        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-white/20">
          {onBringToFront && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onBringToFront(id);
              }}
              className="p-0.5 px-1 rounded-sm hover:bg-background/25 text-background cursor-pointer flex items-center gap-0.5 text-[9px]"
              title="Bring to Front (Bawa ke Hadapan Sekali)"
            >
              <BringToFront className="size-2.5" />
              <span className="hidden sm:inline">Front</span>
            </button>
          )}
          {onSendToBack && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSendToBack(id);
              }}
              className="p-0.5 px-1 rounded-sm hover:bg-background/25 text-background cursor-pointer flex items-center gap-0.5 text-[9px]"
              title="Send to Back (Hantar ke Belakang Sekali)"
            >
              <SendToBack className="size-2.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>

        {/* Alignment Controls: Left / Center / Right (text items only) */}
        {!isObjectItem && (
          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-white/20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSetTextAlign("left");
              }}
              className={`p-0.5 px-1 rounded-sm cursor-pointer flex items-center justify-center text-[9px] ${
                effectiveTextAlign === "left"
                  ? "bg-white/30 text-white font-bold"
                  : "hover:bg-background/25 text-background/80"
              }`}
              title="Align Left (Rata Kiri)"
            >
              <AlignLeft className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSetTextAlign("center");
              }}
              className={`p-0.5 px-1 rounded-sm cursor-pointer flex items-center justify-center text-[9px] ${
                effectiveTextAlign === "center"
                  ? "bg-white/30 text-white font-bold"
                  : "hover:bg-background/25 text-background/80"
              }`}
              title="Align Center (Rata Tengah)"
            >
              <AlignCenter className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleSetTextAlign("right");
              }}
              className={`p-0.5 px-1 rounded-sm cursor-pointer flex items-center justify-center text-[9px] ${
                effectiveTextAlign === "right"
                  ? "bg-white/30 text-white font-bold"
                  : "hover:bg-background/25 text-background/80"
              }`}
              title="Align Right (Rata Kanan)"
            >
              <AlignRight className="size-2.5" />
            </button>
          </div>
        )}

        {/* Lock / Unlock Toggle Button */}
        {onLockToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onLockToggle(id, !isLocked);
            }}
            className={`p-0.5 px-1 rounded-sm hover:bg-background/25 cursor-pointer flex items-center gap-0.5 text-[9px] ${
              isLocked ? "text-amber-400 bg-amber-500/25 font-semibold" : "text-background"
            }`}
            title={isLocked ? "Unlock dragging" : "Lock position to prevent accidental dragging"}
          >
            {isLocked ? <Unlock className="size-2.5" /> : <Lock className="size-2.5" />}
            <span>{isLocked ? "Unlock" : "Lock"}</span>
          </button>
        )}

        {/* Reset Position Button */}
        {isShifted && !isLocked && (
          <button
            type="button"
            onClick={handleResetPosition}
            className="ml-0.5 p-0.5 rounded-full hover:bg-background/20 text-background cursor-pointer"
            title="Reset position to default (0, 0)"
          >
            <RotateCcw className="size-2.5" />
          </button>
        )}
      </div>

      {/* Canva-style Resize Tooltip (shows live px during width or corner drag) */}
      {resizeIndicator && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 px-2 py-0.5 rounded-md bg-black/85 text-white text-[10px] font-mono shadow-lg flex items-center gap-1 pointer-events-none whitespace-nowrap animate-in fade-in-50">
          <span className="text-muted-foreground uppercase text-[8px] font-sans">
            {resizeIndicator.type === "width" ? (isObjectItem ? "Size:" : "Width:") : "Font Size:"}
          </span>
          <span className="font-semibold text-emerald-400">{resizeIndicator.value}</span>
        </div>
      )}

      {/* ── Canva-style Border Handles ─────────────────────────────────────── */}
      {showHandles && (
        <>
          {/* 1. Left Side Handle (Pill - Width / Expand / Wrap) */}
          <div
            onPointerDown={(e) => handleSideResizeStart(e, "left")}
            onDoubleClick={handleResetWidth}
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-ew-resize z-50 transition-transform flex items-center justify-center before:absolute before:-inset-2 before:content-['']"
            title={
              isObjectItem
                ? "Drag to adjust size. Double click to reset."
                : "Drag to expand / shrink width (wrap text to 2 lines). Double click to reset."
            }
          >
            <span className="w-0.5 h-2 bg-primary/70 rounded-full pointer-events-none" />
          </div>

          {/* 2. Right Side Handle (Pill - Width / Expand / Wrap) */}
          <div
            onPointerDown={(e) => handleSideResizeStart(e, "right")}
            onDoubleClick={handleResetWidth}
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-ew-resize z-50 transition-transform flex items-center justify-center before:absolute before:-inset-2 before:content-['']"
            title={
              isObjectItem
                ? "Drag to adjust size. Double click to reset."
                : "Drag to expand / shrink width (wrap text to 2 lines). Double click to reset."
            }
          >
            <span className="w-0.5 h-2 bg-primary/70 rounded-full pointer-events-none" />
          </div>

          {/* 3. Top-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, "top-left")}
            onDoubleClick={isObjectItem ? handleResetWidth : handleResetFontSize}
            className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-nwse-resize z-50 transition-transform before:absolute before:-inset-1.5 before:content-['']"
            title={
              isObjectItem
                ? "Drag to scale size bigger / smaller. Double click to reset."
                : "Drag to scale font size bigger / smaller. Double click to reset."
            }
          />

          {/* 4. Top-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, "top-right")}
            onDoubleClick={isObjectItem ? handleResetWidth : handleResetFontSize}
            className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-nesw-resize z-50 transition-transform before:absolute before:-inset-1.5 before:content-['']"
            title={
              isObjectItem
                ? "Drag to scale size bigger / smaller. Double click to reset."
                : "Drag to scale font size bigger / smaller. Double click to reset."
            }
          />

          {/* 5. Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, "bottom-left")}
            onDoubleClick={isObjectItem ? handleResetWidth : handleResetFontSize}
            className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-nesw-resize z-50 transition-transform before:absolute before:-inset-1.5 before:content-['']"
            title={
              isObjectItem
                ? "Drag to scale size bigger / smaller. Double click to reset."
                : "Drag to scale font size bigger / smaller. Double click to reset."
            }
          />

          {/* 6. Bottom-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleCornerResizeStart(e, "bottom-right")}
            onDoubleClick={isObjectItem ? handleResetWidth : handleResetFontSize}
            className="absolute -bottom-1.5 -right-1.5 size-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary shadow-md hover:scale-125 cursor-nwse-resize z-50 transition-transform before:absolute before:-inset-1.5 before:content-['']"
            title={
              isObjectItem
                ? "Drag to scale size bigger / smaller. Double click to reset."
                : "Drag to scale font size bigger / smaller. Double click to reset."
            }
          />
        </>
      )}

      {/* Persistent "outside mobile" warning badge */}
      {isOutsideMobile && !isDragging && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold whitespace-nowrap bg-amber-500 text-white shadow-md pointer-events-none">
          <span>⚠ Outside mobile</span>
        </div>
      )}

      <div
        ref={contentRef}
        data-draggable-content="true"
        className={id === "orb" ? "size-full flex items-center justify-center" : "w-full"}
      >
        {children}
      </div>
    </div>
  );
};
