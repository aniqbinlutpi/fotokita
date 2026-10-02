import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GripVertical,
  RotateCcw,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
} from "lucide-react";

export interface Position {
  x: number;
  y: number;
  zIndex?: number;
  locked?: boolean;
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
  const isLocked = Boolean(position?.locked);
  const [liveOffset, setLiveOffset] = useState<Position>({
    x: position?.x ?? 0,
    y: position?.y ?? 0,
  });

  // Keep live offset in sync when position prop changes externally
  useEffect(() => {
    if (!isDragging) {
      setLiveOffset({
        x: position?.x ?? 0,
        y: position?.y ?? 0,
      });
    }
  }, [position?.x, position?.y, isDragging]);

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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isEditor || isLocked) return;
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

        const effectivePos = snapped || { x: rawX, y: rawY };
        latestOffsetRef.current = effectivePos;
        setLiveOffset(effectivePos);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        setIsDragging(false);

        const finalPos = {
          ...latestOffsetRef.current,
          zIndex: position?.zIndex,
          locked: position?.locked,
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
    [isEditor, isLocked, liveOffset.x, liveOffset.y, id, position?.zIndex, position?.locked, onPositionChange, onDragStart, onDragMove, onDragEnd]
  );

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
      });
    }
  };

  const isShifted = liveOffset.x !== 0 || liveOffset.y !== 0;

  // Transform translation & layer z-index style
  const currentZIndex = position?.zIndex;
  const transformStyle: React.CSSProperties = {
    ...style,
    zIndex: isDragging ? 999 : currentZIndex !== undefined ? currentZIndex : style.zIndex,
    transform:
      isShifted || isDragging
        ? `translate3d(${liveOffset.x}px, ${liveOffset.y}px, 0)`
        : style.transform,
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

  return (
    <div
      ref={domRef}
      onPointerDown={handlePointerDown}
      className={`group relative pointer-events-auto select-none transition-shadow ${
        isDragging
          ? "z-50 cursor-grabbing ring-2 ring-primary/80 shadow-2xl rounded-xl bg-background/30 backdrop-blur-xs scale-[1.02]"
          : isLocked
          ? "cursor-default hover:outline hover:outline-1 hover:outline-dashed hover:outline-amber-500/70 hover:bg-amber-500/[0.04] rounded-xl"
          : isOutsideMobile && !isDragging
          ? "cursor-grab outline outline-1 outline-dashed outline-amber-500/80 rounded-xl"
          : "cursor-grab hover:outline hover:outline-1 hover:outline-dashed hover:outline-primary/70 hover:bg-primary/[0.04] rounded-xl"
      } ${className}`}
      style={transformStyle}
      title={isLocked ? `${label} (Locked) — click Unlock to move` : `${label} — Click & drag to place anywhere`}
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

      {/* Floating Drag Label, Layer Order & Lock Controls */}
      <div
        className={`absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium whitespace-nowrap shadow-md pointer-events-auto transition-opacity duration-150 ${
          isDragging
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
          <span className="text-[9px] opacity-75 font-mono ml-0.5">
            ({liveOffset.x > 0 ? `+${liveOffset.x}` : liveOffset.x}, {liveOffset.y > 0 ? `+${liveOffset.y}` : liveOffset.y})
          </span>
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

      {/* Persistent "outside mobile" warning badge */}
      {isOutsideMobile && !isDragging && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold whitespace-nowrap bg-amber-500 text-white shadow-md pointer-events-none">
          <span>⚠ Outside mobile</span>
        </div>
      )}

      {children}
    </div>
  );
};
