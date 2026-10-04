import React from "react";
import {
  Monitor,
  Smartphone,
  Sparkles,
  ArrowRight,
  QrCode,
  X,
  Layers,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubAdminLayoutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMode?: "desktop" | "mobile";
  onSwitchViewMode: (mode: "desktop" | "mobile") => void;
  onOpenQrModal?: () => void;
  dontShowAgainSession?: boolean;
  onToggleDontShowAgain?: (checked: boolean) => void;
  isPostSaveReminder?: boolean;
}

export const SubAdminLayoutGuideModal: React.FC<SubAdminLayoutGuideModalProps> = ({
  isOpen,
  onClose,
  savedMode = "desktop",
  onSwitchViewMode,
  onOpenQrModal,
  dontShowAgainSession = false,
  onToggleDontShowAgain,
  isPostSaveReminder = true,
}) => {
  if (!isOpen) return null;

  const isDesktopSaved = savedMode === "desktop";
  const targetMode = isDesktopSaved ? "mobile" : "desktop";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
    >
      <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="size-11 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            {isPostSaveReminder ? (
              <Sparkles className="size-5" />
            ) : (
              <HelpCircle className="size-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-medium text-foreground">
                {isPostSaveReminder
                  ? `${isDesktopSaved ? "Desktop" : "Mobile"} Layout Saved!`
                  : "Independent Responsive Layouts"}
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                Responsive Guide
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPostSaveReminder
                ? isDesktopSaved
                  ? "Please double-check how your changes look on mobile devices."
                  : "Please double-check how your changes look on desktop screens."
                : "Desktop and Mobile layouts have separate coordinates and sizing."}
            </p>
          </div>
        </div>

        {/* Visual Dual Layout Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Desktop Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isDesktopSaved
                ? "bg-amber-500/5 dark:bg-amber-400/5 border-amber-500/30"
                : "bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Monitor className="size-4 text-amber-500" />
                <span>Desktop Layout</span>
              </div>
              {isDesktopSaved && (
                <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                  Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Wide 3-column layout designed for laptops & widescreen monitors (≥ 768px). Center orb and spacious typography.
            </p>
          </div>

          {/* Mobile Card */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              !isDesktopSaved
                ? "bg-sky-500/5 dark:bg-sky-400/5 border-sky-500/30"
                : "bg-sky-500/10 dark:bg-sky-400/10 border-sky-500/40 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Smartphone className="size-4 text-sky-500" />
                <span>Mobile Layout</span>
              </div>
              {isDesktopSaved ? (
                <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  Review Needed
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded">
                  Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vertical stacked layout designed for phones (&lt; 768px). Centered circle hero and touch-optimized font sizes.
            </p>
          </div>
        </div>

        {/* Helpful Tip Box */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            <span>Why are these separated?</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">
            Dragging an element or changing font size in {isDesktopSaved ? "Desktop" : "Mobile"} view will{" "}
            <strong>not</strong> break or shift your {targetMode} layout. You can customize both independently so your wedding invitation looks breathtaking on every screen.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                onSwitchViewMode(targetMode);
                onClose();
              }}
              className="w-full sm:flex-1 text-xs font-medium cursor-pointer gap-2 h-9"
            >
              {targetMode === "mobile" ? (
                <Smartphone className="size-4" />
              ) : (
                <Monitor className="size-4" />
              )}
              <span>Switch to {targetMode === "mobile" ? "Mobile View" : "Desktop View"}</span>
              <ArrowRight className="size-3.5" />
            </Button>

            {onOpenQrModal && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenQrModal();
                }}
                className="w-full sm:w-auto text-xs cursor-pointer gap-1.5 h-9"
              >
                <QrCode className="size-3.5 text-muted-foreground" />
                <span>Scan QR</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground cursor-pointer h-9"
            >
              Keep {savedMode === "desktop" ? "Desktop" : "Mobile"}
            </Button>
          </div>

          {/* Session suppression option */}
          {onToggleDontShowAgain && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgainSession}
                  onChange={(e) => onToggleDontShowAgain(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-3.5"
                />
                <span>Don't show this reminder again for this session</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
