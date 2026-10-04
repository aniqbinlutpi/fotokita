import React from "react";
import {
  Smartphone,
  Tablet,
  Check,
  Apple,
  RotateCcw,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-h-full">
      {/* Clean Mobile Viewport */}
      <div
        style={{
          width: `${Math.round(selectedPhone.width * activeScale)}px`,
          height: `${Math.round(totalPhoneHeight * activeScale)}px`,
        }}
        className="relative shrink-0 rounded-2xl shadow-2xl border border-border/80 overflow-hidden bg-background ring-1 ring-black/5 dark:ring-white/10"
      >
        <div
          style={{
            width: `${selectedPhone.width}px`,
            height: `${totalPhoneHeight}px`,
            transform: `scale(${activeScale})`,
            transformOrigin: "top left",
          }}
          className="absolute top-0 left-0 transition-transform duration-200"
        >
          {/* Live Guest View Iframe (100% Full Mobile Viewport) */}
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

      {/* Side Device Controller (Beside Device) */}
      <div className="flex flex-col gap-3 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-3.5 w-60 shrink-0 text-xs animate-in fade-in-50">
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
              {Math.round(activeScale * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/50 text-[11px]">
            {(["fit", "65", "75", "100"] as const).map((z) => (
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
    </div>
  );
};

export default SubAdminMobileCanvas;
