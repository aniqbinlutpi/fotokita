import React, { useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  FileText,
  HardDrive,
} from "lucide-react";
import type { MediaItem } from "@/types/media";

interface ImageLightboxProps {
  item: MediaItem | null;
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  item,
  url,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        onPrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!item) return null;

  const formattedSize =
    item.size > 1024 * 1024
      ? `${(item.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(item.size / 1024)} KB`;

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const isVideo = item.mimeType?.startsWith("video/");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="max-w-5xl w-[95vw] md:w-[90vw] max-h-[92vh] p-0 bg-[#FFFCF8] border-[#E7DED5] rounded-sm overflow-hidden flex flex-col shadow-none"
      >
        <DialogTitle className="sr-only">
          {item.filename || "Wedding Photograph"}
        </DialogTitle>

        {/* Media Viewer Area */}
        <div className="relative flex-1 min-h-[400px] max-h-[72vh] flex items-center justify-center bg-[#F8F5F0] overflow-hidden p-4 select-none">
          {url ? (
            isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                className="max-h-[68vh] max-w-full object-contain rounded-xs"
              />
            ) : (
              <img
                src={url}
                alt={item.filename}
                className="max-h-[68vh] max-w-full object-contain rounded-xs selection:bg-transparent"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-[#7A7069] text-xs font-sans">
              <span className="animate-pulse">Loading photograph...</span>
            </div>
          )}

          {/* Navigation Arrows */}
          {hasPrev && onPrev && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="Previous photograph"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#FFFCF8]/90 border-[#E7DED5] hover:bg-[#FFFCF8] text-[#2F2926] rounded-sm size-9 shadow-none"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}

          {hasNext && onNext && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Next photograph"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FFFCF8]/90 border-[#E7DED5] hover:bg-[#FFFCF8] text-[#2F2926] rounded-sm size-9 shadow-none"
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>

        {/* Editorial Footer / Metadata */}
        <div className="p-4 bg-[#FFFCF8] border-t border-[#E7DED5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs text-[#7A7069]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium text-[#2F2926] flex items-center gap-1.5 truncate max-w-xs">
              <FileText className="size-3.5 text-[#A67C6B] shrink-0" />
              <span className="truncate">{item.filename}</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="size-3 text-[#7A7069]" />
              <span>{formattedSize}</span>
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-[#7A7069]" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          {url && (
            <div className="flex items-center gap-2">
              <a
                href={url}
                download={item.filename}
                target="_blank"
                rel="noreferrer"
                className="border border-[#E7DED5] bg-[#FFFCF8] text-[#2F2926] hover:bg-[#F8F5F0] rounded-sm text-xs h-8 px-3 inline-flex items-center gap-1.5 font-medium transition-colors"
              >
                <Download className="size-3.5 text-[#A67C6B]" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
