import React, { useEffect, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react";
import { downloadPhotoboothCard } from "@/lib/photoboothCanvas";
import { getMediaUrl } from "@/api/media";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";

interface ImageLightboxProps {
  item: MediaItem | null;
  wedding?: Wedding | null;
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string, code?: string) => Promise<void>;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  item,
  wedding,
  url,
  isOpen,
  onClose,
  onDelete,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) => {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [deleteCode, setDeleteCode] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (url || !item) {
      return;
    }

    let isCurrent = true;
    getMediaUrl(item.id)
      .then((data) => {
        if (isCurrent) {
          setFetchedUrl(data.url);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch image URL in lightbox:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [item, url]);

  const activeUrl = url || fetchedUrl;

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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeUrl || !item) return;
    try {
      setIsDownloading(true);
      await downloadPhotoboothCard(activeUrl, wedding, item.filename, {
        wishes: item.wishes,
        from: item.fromName,
        signature: item.signature,
      });
    } catch (err) {
      console.error("Failed to download framed photo:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item) return;
    const saved = localStorage.getItem(`fotokita_secret_${item.id}`) || "";
    setDeleteCode(saved);
    setDeleteError(null);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item || !onDelete) return;
    if (!deleteCode.trim()) {
      setDeleteError("Please enter your secret code (or cheatcode 'ggwp').");
      return;
    }
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDelete(item.id, deleteCode.trim());
      setIsAlertOpen(false);
      onClose();
    } catch (err: any) {
      setDeleteError(
        err?.message ||
          "Incorrect secret code. Only the uploader or admin ('ggwp') can remove this photo."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const coupleName = wedding?.name ?? "The Wedding";

  const formattedWeddingDate = React.useMemo(() => {
    const rawDate = wedding?.date || item?.createdAt;
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
  }, [wedding?.date, item?.createdAt]);

  if (!item) return null;

  const isVideo = item.mimeType?.startsWith("video/");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={true}
        className="max-w-md sm:max-w-lg w-[92vw] p-4 sm:p-6 bg-[#FFFCF8] border border-[#E7DED5] rounded-[3px] shadow-2xl flex flex-col font-sans select-none overflow-hidden"
      >
        <DialogTitle className="sr-only">
          {coupleName} — Photobooth Print
        </DialogTitle>

        {/* Top embossed branding matching zoom-out card */}
        <div className="text-center pb-2.5 pt-0.5 select-none">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#7A7069]/60 font-sans font-medium">
            Fotokita Photobooth
          </span>
        </div>

        {/* Fixed 1:1 Square Photo Area */}
        <div className="relative aspect-square w-full bg-[#F8F5F0] overflow-hidden border border-[#E7DED5]/90 rounded-[1px]">
          {activeUrl ? (
            isVideo ? (
              <video
                src={activeUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeUrl}
                alt=""
                className="w-full h-full object-cover selection:bg-transparent"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7A7069] text-xs font-sans">
              <span className="animate-pulse">Loading photograph...</span>
            </div>
          )}

          {/* Action Icons in Top Right of Photo: Download & Delete */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            {activeUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDownloading}
                onClick={handleDownload}
                aria-label="Download photobooth print"
                className="size-8 bg-[#FFFCF8]/90 hover:bg-[#FFFCF8] text-[#7A7069] hover:text-[#2F2926] rounded-xs shadow-xs"
                title="Download Photobooth Print"
              >
                <Download className="size-3.5" />
              </Button>
            )}

            {onDelete && (
              <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting}
                      onClick={handleOpenDelete}
                      aria-label="Delete photograph"
                      className="size-8 bg-[#FFFCF8]/90 hover:bg-[#FFFCF8] text-[#7A7069] hover:text-[#9E3E3E] rounded-xs shadow-xs"
                      title="Delete Photograph"
                    >
                      <Trash2 className="size-3.5" />
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
                      <span className="text-[10px] text-[#A67C6B] font-mono">
                        Admin cheatcode: ggwp
                      </span>
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
                      placeholder="Enter secret code or ggwp"
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
            )}
          </div>

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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#FFFCF8]/85 border-[#E7DED5] hover:bg-[#FFFCF8] text-[#2F2926] rounded-xs size-8 shadow-xs z-10"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#FFFCF8]/85 border-[#E7DED5] hover:bg-[#FFFCF8] text-[#2F2926] rounded-xs size-8 shadow-xs z-10"
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>

        {/* Photobooth Bottom Chin Typography (Matching Zoom Out) */}
        <div className="pt-4 sm:pt-5 pb-1 text-center select-none font-sans">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#7A7069] font-medium leading-none">
            The Wedding Of
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#2F2926] uppercase tracking-wider leading-snug mt-2 mb-1.5">
            {coupleName}
          </h3>
          {formattedWeddingDate && (
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#7A7069] tabular-nums leading-none">
              {formattedWeddingDate}
            </p>
          )}

          {/* Wishes, Sender & Signature if present */}
          {(item.wishes || item.fromName || item.signature) && (
            <div className="pt-3 mt-3 border-t border-[#E7DED5]/80 space-y-1.5">
              {item.wishes && (
                <p className="font-serif italic text-sm text-[#433B37] leading-relaxed line-clamp-3 px-2">
                  "{item.wishes}"
                </p>
              )}
              {item.fromName && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#7A7069] font-medium">
                  — With Love, {item.fromName}
                </p>
              )}
              {item.signature && (
                <div className="flex justify-center pt-0.5">
                  {item.signature.startsWith("data:image/") ? (
                    <img
                      src={item.signature}
                      alt="Signature"
                      className="h-6 object-contain"
                    />
                  ) : (
                    <p className="font-signature text-2xl sm:text-3xl text-[#2F2926] leading-none pt-0.5">
                      {item.signature}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
