import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Smartphone,
  Tablet,
  Check,
  Apple,
  RotateCcw,
  QrCode,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { PhoneProfile } from "@/pages/SubAdminPortalPage";

interface SubAdminMobileCanvasProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewIframeUrl: string;
  onIframeLoad: () => void;
  selectedPhone: PhoneProfile;
  selectedPhoneId: string;
  onSelectPhoneId: (id: string) => void;
  phoneProfiles: PhoneProfile[];
  activeScale: number;
  totalPhoneHeight: number;
  zoomLevel: string;
  onSelectZoomLevel: (z: "fit" | "100" | "85" | "75" | "65") => void;
  onRefreshPreview: () => void;
  onOpenQrModal: () => void;
}

export const SubAdminMobileCanvas: React.FC<SubAdminMobileCanvasProps> = ({
  iframeRef,
  previewIframeUrl,
  onIframeLoad,
  selectedPhone,
  selectedPhoneId,
  onSelectPhoneId,
  phoneProfiles,
  activeScale,
  totalPhoneHeight,
  zoomLevel,
  onSelectZoomLevel,
  onRefreshPreview,
  onOpenQrModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isDeviceSheetOpen, setIsDeviceSheetOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMobileScreen =
    containerSize.width > 0
      ? containerSize.width < 768
      : typeof window !== "undefined"
      ? window.innerWidth < 768
      : false;

  // Calculate dynamic fit scale based on actual available canvas dimensions
  const dynamicFitScale = useMemo(() => {
    const width =
      containerSize.width || (typeof window !== "undefined" ? window.innerWidth : 800);
    const height =
      containerSize.height ||
      (typeof window !== "undefined" ? window.innerHeight - 56 : 600);

    // On mobile (< 768px):
    // Reserve ~76px at bottom for floating dock and padding
    // Reserve ~24px horizontally for padding
    // On desktop (>= 768px):
    // Reserve ~264px horizontally for side controller dock
    // Reserve ~32px vertically for padding
    const availableW = isMobileScreen
      ? Math.max(200, width - 24)
      : Math.max(280, width - 264 - 32);

    const availableH = isMobileScreen
      ? Math.max(240, height - 76)
      : Math.max(340, height - 32);

    const wScale = availableW / selectedPhone.width;
    const hScale = availableH / totalPhoneHeight;
    const scale = Math.min(wScale, hScale);

    return Math.min(1.0, Math.max(0.25, Number(scale.toFixed(3))));
  }, [
    containerSize.width,
    containerSize.height,
    isMobileScreen,
    selectedPhone.width,
    totalPhoneHeight,
  ]);

  const effectiveScale = useMemo(() => {
    if (zoomLevel === "100") return 1;
    if (zoomLevel === "85") return 0.85;
    if (zoomLevel === "75") return 0.75;
    if (zoomLevel === "65") return 0.65;
    return dynamicFitScale || activeScale;
  }, [zoomLevel, dynamicFitScale, activeScale]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col md:flex-row items-center justify-center relative overflow-hidden"
    >
      {/* Phone Mockup Frame - Centered with m-auto to avoid negative flexbox scroll clipping */}
      <div className="m-auto flex items-center justify-center p-2 sm:p-4">
        <div
          style={{
            width: `${Math.round(selectedPhone.width * effectiveScale)}px`,
            height: `${Math.round(totalPhoneHeight * effectiveScale)}px`,
          }}
          className="relative shrink-0 rounded-[28px] sm:rounded-[36px] shadow-2xl border-[3px] sm:border-[4px] border-neutral-800/90 dark:border-neutral-700/90 overflow-hidden bg-background ring-1 ring-black/10 dark:ring-white/10 transition-all duration-150"
        >
          {/* Subtle Dynamic Island / Camera cutout for mobile phone preview realism */}
          {selectedPhone.category !== "tablet" && (
            <div
              style={{
                transform: `scale(${effectiveScale})`,
                transformOrigin: "top center",
              }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-transform duration-150"
            >
              {selectedPhone.brand === "Apple" ? (
                <div className="w-24 h-5 bg-black/90 rounded-full shadow-inner flex items-center justify-end pr-2.5">
                  <div className="size-2 rounded-full bg-[#101428]/90 ring-1 ring-white/10" />
                </div>
              ) : (
                <div className="size-3.5 rounded-full bg-black/90 ring-1 ring-white/15" />
              )}
            </div>
          )}

          {/* Scaled Preview Simulator Iframe */}
          <div
            style={{
              width: `${selectedPhone.width}px`,
              height: `${totalPhoneHeight}px`,
              transform: `scale(${effectiveScale})`,
              transformOrigin: "top left",
            }}
            className="absolute top-0 left-0 transition-transform duration-150"
          >
            <iframe
              ref={iframeRef}
              src={previewIframeUrl}
              key={selectedPhone.id}
              title="Live Guest View Simulator"
              onLoad={onIframeLoad}
              className="w-full h-full border-0 bg-[#F8F5F0] dark:bg-[#12100E]"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP SIDE CONTROLLER: Displayed on medium and larger screens beside mockup */}
      <div className="hidden md:flex flex-col gap-3 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-3.5 w-60 shrink-0 text-xs animate-in fade-in-50 mr-2 sm:mr-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-border/50">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            {selectedPhone.category === "tablet" ? (
              <Tablet className="size-3.5 text-primary" />
            ) : (
              <Smartphone className="size-3.5 text-primary" />
            )}
            <span>Select Device</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
            {selectedPhone.resolutionLabel}
          </span>
        </div>

        {/* Device List */}
        <div className="space-y-1">
          {phoneProfiles.map((phone) => {
            const isSelected = selectedPhoneId === phone.id;
            return (
              <button
                key={phone.id}
                type="button"
                onClick={() => onSelectPhoneId(phone.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isSelected
                    ? "bg-foreground text-background font-medium shadow-xs"
                    : "hover:bg-muted/70 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {phone.category === "tablet" ? (
                    <Tablet
                      className={`size-3.5 shrink-0 ${
                        isSelected ? "text-background" : "text-blue-500 dark:text-blue-400"
                      }`}
                    />
                  ) : phone.brand === "Apple" ? (
                    <Apple
                      className={`size-3.5 shrink-0 ${
                        isSelected ? "text-background" : "text-foreground"
                      }`}
                    />
                  ) : (
                    <Smartphone
                      className={`size-3.5 shrink-0 ${
                        isSelected ? "text-emerald-300" : "text-emerald-500"
                      }`}
                    />
                  )}
                  <span className="truncate">{phone.name}</span>
                </div>
                {isSelected && (
                  <Check className="size-3.5 shrink-0 ml-1 text-primary-foreground" />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-px bg-border/60" />

        {/* Zoom Scale Switcher */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Display Zoom
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {Math.round(effectiveScale * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/50 text-[11px]">
            {(["fit", "65", "75", "85", "100"] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => onSelectZoomLevel(z)}
                className={`py-1 rounded text-center transition-colors cursor-pointer capitalize ${
                  zoomLevel === z
                    ? "bg-background shadow-xs font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {z === "fit" ? "Fit" : `${z}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions (Refresh / Test Phone) */}
        <div className="flex items-center gap-1.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshPreview}
            className="flex-1 text-xs h-7.5 cursor-pointer gap-1.5"
          >
            <RotateCcw className="size-3" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQrModal}
            className="flex-1 text-xs h-7.5 cursor-pointer gap-1.5"
          >
            <QrCode className="size-3" />
            <span>QR Code</span>
          </Button>
        </div>
      </div>

      {/* MOBILE FLOATING DOCK: Compact, unobtrusive control pill at bottom of screen on mobile */}
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex items-center justify-between gap-1.5 p-1.5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl md:hidden max-w-sm mx-auto">
        {/* Device Selector Pill */}
        <button
          type="button"
          onClick={() => setIsDeviceSheetOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer truncate max-w-[170px]"
          title="Change phone profile"
        >
          {selectedPhone.category === "tablet" ? (
            <Tablet className="size-3.5 text-blue-500 shrink-0" />
          ) : selectedPhone.brand === "Apple" ? (
            <Apple className="size-3.5 text-foreground shrink-0" />
          ) : (
            <Smartphone className="size-3.5 text-emerald-500 shrink-0" />
          )}
          <span className="truncate">{selectedPhone.name}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-0.5" />
        </button>

        {/* Zoom Fit / 100% Quick Switcher */}
        <div className="flex items-center bg-muted/50 p-0.5 rounded-xl border border-border/50 text-[11px]">
          <button
            type="button"
            onClick={() => onSelectZoomLevel("fit")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              zoomLevel === "fit"
                ? "bg-background shadow-xs font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => onSelectZoomLevel(zoomLevel === "100" ? "fit" : "100")}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              zoomLevel === "100"
                ? "bg-background shadow-xs font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            100%
          </button>
        </div>

        {/* Quick Actions: Refresh & QR */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefreshPreview}
            className="size-7.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            title="Refresh preview"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenQrModal}
            className="size-7.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            title="Scan QR Code to test on real phone"
          >
            <QrCode className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* MOBILE DEVICE SELECTOR BOTTOM SHEET */}
      <Sheet open={isDeviceSheetOpen} onOpenChange={setIsDeviceSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/50 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                <span>Device Preview Settings</span>
              </SheetTitle>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {selectedPhone.resolutionLabel}
              </span>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Select a phone or tablet profile to preview guest layout behavior.
            </SheetDescription>
          </SheetHeader>

          {/* Device Profiles */}
          <div className="space-y-1.5 py-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Target Devices
            </div>
            {phoneProfiles.map((phone) => {
              const isSelected = selectedPhoneId === phone.id;
              return (
                <button
                  key={phone.id}
                  type="button"
                  onClick={() => {
                    onSelectPhoneId(phone.id);
                    setIsDeviceSheetOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-foreground text-background font-medium shadow-xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {phone.category === "tablet" ? (
                      <Tablet
                        className={`size-4 shrink-0 ${
                          isSelected ? "text-background" : "text-blue-500"
                        }`}
                      />
                    ) : phone.brand === "Apple" ? (
                      <Apple
                        className={`size-4 shrink-0 ${
                          isSelected ? "text-background" : "text-foreground"
                        }`}
                      />
                    ) : (
                      <Smartphone
                        className={`size-4 shrink-0 ${
                          isSelected ? "text-emerald-300" : "text-emerald-500"
                        }`}
                      />
                    )}
                    <div>
                      <div className="font-medium truncate">{phone.name}</div>
                      <div
                        className={`text-[10px] font-mono ${
                          isSelected ? "text-background/80" : "text-muted-foreground"
                        }`}
                      >
                        {phone.resolutionLabel}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="size-4 shrink-0 ml-1 text-primary-foreground" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Zoom Level Switcher */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Display Zoom
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {Math.round(effectiveScale * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50 text-xs">
              {(["fit", "65", "75", "85", "100"] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => onSelectZoomLevel(z)}
                  className={`py-1.5 rounded-lg text-center transition-colors cursor-pointer capitalize font-medium ${
                    zoomLevel === z
                      ? "bg-background shadow-xs font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {z === "fit" ? "Fit" : `${z}%`}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SubAdminMobileCanvas;
