import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Maximize2, AlertCircle, Download } from "lucide-react";
import { getMediaUrl } from "@/api/media";
import { downloadPhotoboothCard } from "@/lib/photoboothCanvas";
import { parseSignature } from "@/lib/signature";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";

interface GalleryItemProps {
  media: MediaItem;
  wedding?: Wedding | null;
  onSelect: (media: MediaItem, url: string) => void;
  onDelete: (id: string, code?: string) => Promise<void>;
  onUrlLoaded?: (id: string, url: string) => void;
}

export const GalleryItem: React.FC<GalleryItemProps> = ({
  media,
  wedding,
  onSelect,
  onDelete,
  onUrlLoaded,
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [deleteCode, setDeleteCode] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const parsedSignature = parseSignature(media.signature);

  useEffect(() => {
    let isMounted = true;

    getMediaUrl(media.id)
      .then((data) => {
        if (isMounted) {
          setUrl(data.url);
          setIsLoading(false);
          onUrlLoaded?.(media.id, data.url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [media.id, onUrlLoaded]);

  const handleOpenDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = localStorage.getItem(`fotokita_secret_${media.id}`) || "";
    setDeleteCode(saved);
    setDeleteError(null);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deleteCode.trim()) {
      setDeleteError("Please enter your secret code.");
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDelete(media.id, deleteCode.trim());
      setIsAlertOpen(false);
    } catch (err: any) {
      setDeleteError(
        err?.message ||
          "Incorrect secret code. Only the uploader can remove this photo."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    try {
      setIsDownloading(true);
      await downloadPhotoboothCard(url, wedding, media.filename, {
        wishes: media.wishes,
        from: media.fromName,
        signature: media.signature,
      });
    } catch (err) {
      console.error("Failed to download framed photo:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const coupleName = wedding?.name ?? "The Wedding";

  const formattedDate = React.useMemo(() => {
    const rawDate = wedding?.date || media.createdAt;
    if (!rawDate) return "";
    try {
      const d = new Date(rawDate);
      return d
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();
    } catch {
      return "";
    }
  }, [wedding?.date, media.createdAt]);

  const isVideo = media.mimeType?.startsWith("video/");

  return (
    <div className="group relative bg-[#FFFCF8] border border-[#E7DED5] rounded-[1.5px] sm:rounded-[2px] p-1.5 pb-2 sm:p-3 sm:pb-3.5 shadow-[0_2px_8px_-2px_rgba(47,41,38,0.06)] hover:shadow-[0_12px_28px_-6px_rgba(47,41,38,0.12)] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 flex flex-col justify-start">
      {/* Top tiny embossed branding like the photobooth print */}
      <div className="text-center pb-1 sm:pb-2 select-none shrink-0 h-4 sm:h-6 flex items-center justify-center">
        <span className="text-[6.5px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.25em] text-[#7A7069]/60 font-sans font-medium line-clamp-1 block">
          Fotobooth Kita
        </span>
      </div>

      {/* Fixed 1:1 Square Photo Frame */}
      <div
        onClick={() => url && onSelect(media, url)}
        className="relative aspect-square w-full bg-[#F8F5F0] overflow-hidden border border-[#E7DED5]/90 rounded-[1px] cursor-pointer shrink-0"
      >
        {isLoading && (
          <Skeleton className="absolute inset-0 bg-[#EDE6DC]/60 animate-pulse rounded-none" />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-[#7A7069] text-xs font-sans text-center gap-1.5">
            <AlertCircle className="size-4 text-[#9E3E3E]" />
            <span>Unable to load image</span>
          </div>
        )}

        {url && !error && (
          <>
            {isVideo ? (
              <video
                src={url}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <img
                src={url}
                alt={media.filename}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                onLoad={() => setIsLoading(false)}
              />
            )}

            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-[#2F2926]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="p-1 sm:p-2 rounded-full bg-[#FFFCF8]/95 text-[#2F2926] shadow-sm transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <Maximize2 className="size-2.5 sm:size-4" />
              </span>
            </div>
          </>
        )}

        {/* Hover Action Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-0.5 sm:gap-1"
        >
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isDownloading}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(e);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label={`Download ${media.filename} with border`}
              className="size-5 sm:size-7 bg-[#FFFCF8]/90 hover:bg-[#FFFCF8] text-[#7A7069] hover:text-[#2F2926] rounded-xs shadow-xs"
              title="Download Photobooth Print"
            >
              <Download className="size-2.5 sm:size-3.5" />
            </Button>
          )}

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDelete(e);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  aria-label={`Delete ${media.filename}`}
                  className="size-5 sm:size-7 bg-[#FFFCF8]/90 hover:bg-[#FFFCF8] text-[#7A7069] hover:text-[#9E3E3E] rounded-xs shadow-xs"
                >
                  <Trash2 className="size-2.5 sm:size-3.5" />
                </Button>
              }
            />
            <AlertDialogContent className="bg-[#FFFCF8] border-[#E7DED5] rounded-sm max-w-md font-sans">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-xl font-normal text-[#2F2926]">
                  Remove Photograph
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-[#7A7069] leading-relaxed">
                  Enter the secret code you created when uploading this photo to confirm removal.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Secret Code Input */}
              <div className="space-y-1.5 my-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-medium text-[#2F2926]">
                  <span>Secret Code</span>
                </div>
                <input
                  type="password"
                  value={deleteCode}
                  onChange={(e) => {
                    setDeleteCode(e.target.value);
                    setDeleteError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmDelete(e as any);
                    }
                  }}
                  placeholder="Enter secret code"
                  className="w-full bg-[#F8F5F0]/80 border border-[#E7DED5] rounded-[2px] px-3 py-1.5 text-xs text-[#2F2926] font-mono focus:outline-none focus:border-[#A67C6B]"
                />
                {deleteError && (
                  <p className="text-[11px] text-[#9E3E3E] flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{deleteError}</span>
                  </p>
                )}
              </div>

              <AlertDialogFooter className="mt-3 gap-2">
                <AlertDialogCancel
                  onClick={() => setIsAlertOpen(false)}
                  className="border-[#E7DED5] bg-[#FFFCF8] hover:bg-[#F8F5F0] text-[#2F2926] text-xs uppercase tracking-wider rounded-xs h-8"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || !deleteCode.trim()}
                  className="bg-[#9E3E3E] hover:bg-[#853434] text-white text-xs uppercase tracking-wider rounded-xs h-8"
                >
                  {isDeleting ? "Verifying..." : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Signature overlay at the bottom-right corner of the photo */}
        {parsedSignature && (
          <div className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-2 z-10 pointer-events-none select-none max-w-[65%] flex justify-end">
            {parsedSignature.type === "image" ? (
              <img
                src={parsedSignature.data}
                alt="Signature"
                className="h-3 sm:h-5 object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              />
            ) : (
              <p
                style={{ color: parsedSignature.color || "#FFFFFF" }}
                className="font-signature text-xs sm:text-lg leading-none truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
              >
                {parsedSignature.data}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Photobooth / Polaroid Card Chin (Fixed Height Typography) */}
      <div className="pt-2 pb-1 h-[76px] sm:h-[136px] flex flex-col justify-start text-center select-none font-sans shrink-0 overflow-hidden">
        <p className="text-[6px] sm:text-[10px] uppercase tracking-[0.05em] sm:tracking-[0.25em] text-[#7A7069] font-medium leading-none whitespace-nowrap truncate">
          The Wedding Of
        </p>
        <h4 className="font-serif text-[8.5px] sm:text-lg md:text-xl font-normal text-[#2F2926] uppercase tracking-normal sm:tracking-wider leading-tight mt-0.5 sm:mt-1 mb-0.5 line-clamp-1 sm:line-clamp-2">
          {coupleName}
        </h4>
        {formattedDate && (
          <p className="text-[6px] sm:text-[10px] uppercase tracking-[0.03em] sm:tracking-[0.2em] text-[#7A7069] tabular-nums leading-none whitespace-nowrap truncate">
            {formattedDate}
          </p>
        )}

        {/* Wishes & Sender Area (Fixed height slot with subtle divider) */}
        {(media.wishes || media.fromName) ? (
          <div className="pt-1 mt-1 sm:pt-2 sm:mt-2 border-t border-[#E7DED5]/80 space-y-0.5 sm:space-y-1">
            {media.wishes && (
              <p className="font-serif italic text-[7px] sm:text-xs text-[#433B37] leading-tight line-clamp-2 px-0.5 sm:px-1">
                "{media.wishes}"
              </p>
            )}
            {media.fromName && (
              <p className="text-[6px] sm:text-[9px] uppercase tracking-[0.03em] sm:tracking-[0.15em] text-[#7A7069] font-medium truncate">
                — With Love, {media.fromName}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
};
