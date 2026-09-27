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
import { Trash2, Maximize2, AlertCircle } from "lucide-react";
import { getMediaUrl } from "@/api/media";
import type { MediaItem } from "@/types/media";

interface GalleryItemProps {
  media: MediaItem;
  onSelect: (media: MediaItem, url: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export const GalleryItem: React.FC<GalleryItemProps> = ({
  media,
  onSelect,
  onDelete,
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    getMediaUrl(media.id)
      .then((data) => {
        if (isMounted) {
          setUrl(data.url);
          setIsLoading(false);
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
  }, [media.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDelete(media.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const formattedSize =
    media.size > 1024 * 1024
      ? `${(media.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(media.size / 1024)} KB`;

  const isVideo = media.mimeType?.startsWith("video/");

  return (
    <div className="group relative bg-[#FFFCF8] border border-[#E7DED5] rounded-xs overflow-hidden transition-all duration-300 hover:border-[#A67C6B]/60 hover:shadow-[0_4px_20px_-4px_rgba(47,41,38,0.06)] flex flex-col">
      {/* Media display area */}
      <div
        onClick={() => url && onSelect(media, url)}
        className="relative aspect-[4/5] bg-[#F8F5F0] overflow-hidden cursor-pointer"
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

            {/* Subtle editorial hover overlay */}
            <div className="absolute inset-0 bg-[#2F2926]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="p-2 rounded-full bg-[#FFFCF8]/90 text-[#2F2926] shadow-sm transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <Maximize2 className="size-4" />
              </span>
            </div>
          </>
        )}
      </div>

      {/* Item info bar */}
      <div className="p-3 bg-[#FFFCF8] border-t border-[#E7DED5]/80 flex items-center justify-between gap-2 font-sans">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#2F2926] truncate">
            {media.filename}
          </p>
          <p className="text-[11px] text-[#7A7069] tabular-nums mt-0.5">
            {formattedSize}
          </p>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                aria-label={`Delete ${media.filename}`}
                className="size-7 text-[#7A7069] hover:text-[#9E3E3E] hover:bg-[#F8F5F0] rounded-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
              >
                <Trash2 className="size-3.5" />
              </Button>
            }
          />
          <AlertDialogContent className="bg-[#FFFCF8] border-[#E7DED5] rounded-sm max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-xl font-normal text-[#2F2926]">
                Remove Photograph
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#7A7069] leading-relaxed">
                Are you sure you want to remove <strong className="text-[#2F2926] font-medium">{media.filename}</strong> from the wedding archive? This action cannot be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel className="border-[#E7DED5] bg-[#FFFCF8] hover:bg-[#F8F5F0] text-[#2F2926] text-xs uppercase tracking-wider rounded-xs h-8">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-[#9E3E3E] hover:bg-[#853434] text-white text-xs uppercase tracking-wider rounded-xs h-8"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
