import React, { useState, useCallback, useEffect } from "react";
import { GalleryItem } from "./GalleryItem";
import { ImageLightbox } from "./ImageLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, RefreshCw, UploadCloud } from "lucide-react";
import { getMediaUrl } from "@/api/media";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";

interface GalleryProps {
  weddingId: string;
  wedding?: Wedding | null;
  mediaList: MediaItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDeleteMedia: (id: string, code?: string) => Promise<void>;
  onOpenUpload: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  wedding,
  mediaList,
  isLoading,
  error,
  onRefresh,
  onDeleteMedia,
  onOpenUpload,
}) => {
  const [urlCache, setUrlCache] = useState<Record<string, string>>({});
  const [selectedMedia, setSelectedMedia] = useState<{
    item: MediaItem;
    url: string;
    index: number;
  } | null>(null);

  const handleUrlLoaded = useCallback((id: string, loadedUrl: string) => {
    setUrlCache((prev) => {
      if (prev[id] === loadedUrl) return prev;
      return { ...prev, [id]: loadedUrl };
    });
  }, []);

  const handleSelectMedia = (item: MediaItem, url: string) => {
    const index = mediaList.findIndex((m) => m.id === item.id);
    if (url) {
      setUrlCache((prev) => ({ ...prev, [item.id]: url }));
    }
    setSelectedMedia({ item, url, index });
  };

  const handleCloseLightbox = () => {
    setSelectedMedia(null);
  };

  const handleNext = () => {
    if (!selectedMedia || selectedMedia.index >= mediaList.length - 1) return;
    const nextIndex = selectedMedia.index + 1;
    const nextItem = mediaList[nextIndex];
    const cachedUrl = urlCache[nextItem.id] || "";

    setSelectedMedia({
      item: nextItem,
      url: cachedUrl,
      index: nextIndex,
    });

    if (!cachedUrl) {
      getMediaUrl(nextItem.id)
        .then((res) => {
          setUrlCache((prev) => ({ ...prev, [nextItem.id]: res.url }));
          setSelectedMedia((curr) => {
            if (curr && curr.item.id === nextItem.id) {
              return { ...curr, url: res.url };
            }
            return curr;
          });
        })
        .catch((err) => console.error("Error loading next image URL:", err));
    }
  };

  const handlePrev = () => {
    if (!selectedMedia || selectedMedia.index <= 0) return;
    const prevIndex = selectedMedia.index - 1;
    const prevItem = mediaList[prevIndex];
    const cachedUrl = urlCache[prevItem.id] || "";

    setSelectedMedia({
      item: prevItem,
      url: cachedUrl,
      index: prevIndex,
    });

    if (!cachedUrl) {
      getMediaUrl(prevItem.id)
        .then((res) => {
          setUrlCache((prev) => ({ ...prev, [prevItem.id]: res.url }));
          setSelectedMedia((curr) => {
            if (curr && curr.item.id === prevItem.id) {
              return { ...curr, url: res.url };
            }
            return curr;
          });
        })
        .catch((err) => console.error("Error loading previous image URL:", err));
    }
  };

  // Prefetch adjacent image URLs and browser image assets for zero-lag navigation
  useEffect(() => {
    if (!selectedMedia) return;
    const currentIndex = selectedMedia.index;
    const targets: MediaItem[] = [];

    if (currentIndex + 1 < mediaList.length) {
      targets.push(mediaList[currentIndex + 1]);
    }
    if (currentIndex - 1 >= 0) {
      targets.push(mediaList[currentIndex - 1]);
    }

    targets.forEach((target) => {
      const existingUrl = urlCache[target.id];
      if (existingUrl) {
        // Pre-warm browser image cache
        const img = new Image();
        img.src = existingUrl;
      } else {
        getMediaUrl(target.id)
          .then((res) => {
            setUrlCache((prev) => ({ ...prev, [target.id]: res.url }));
            const img = new Image();
            img.src = res.url;
          })
          .catch(() => {});
      }
    });
  }, [selectedMedia, mediaList, urlCache]);

  return (
    <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-24">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E7DED5] pb-5 mb-8 gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#7A7069] font-sans font-medium">
            Visual Archive
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2F2926] font-normal mt-1">
            The Photo Collection
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7A7069] font-sans tabular-nums">
            {mediaList.length} {mediaList.length === 1 ? "moment" : "moments"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-[#7A7069] hover:text-[#2F2926] hover:bg-[#FFFCF8] rounded-xs h-8 px-2 text-xs"
            title="Refresh gallery"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {isLoading && mediaList.length === 0 && (
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 items-start gap-1.5 sm:gap-4 md:gap-6 lg:gap-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#FFFCF8] border border-[#E7DED5] rounded-[1.5px] sm:rounded-[2px] p-1.5 pb-2 sm:p-3 sm:pb-3.5 shadow-xs flex flex-col justify-start"
            >
              <div className="text-center pb-1 sm:pb-2 shrink-0 h-4 sm:h-6 flex items-center justify-center">
                <Skeleton className="h-1.5 sm:h-2 w-10 sm:w-24 bg-[#EDE6DC]/40" />
              </div>
              <Skeleton className="aspect-square w-full bg-[#EDE6DC]/60 animate-pulse rounded-[1px] shrink-0" />
              <div className="h-3.5 sm:h-5 shrink-0" />
              <div className="h-[76px] sm:h-[136px] shrink-0 space-y-1 sm:space-y-1.5 text-center flex flex-col items-center">
                <Skeleton className="h-1.5 sm:h-2 w-8 sm:w-16 bg-[#EDE6DC]/40" />
                <Skeleton className="h-2.5 sm:h-4 w-12 sm:w-32 bg-[#EDE6DC]/60" />
                <Skeleton className="h-1.5 sm:h-2 w-10 sm:w-20 bg-[#EDE6DC]/40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="max-w-md mx-auto my-16 p-8 bg-[#FFFCF8] border border-[#E7DED5] rounded-xs text-center font-sans space-y-4 shadow-none">
          <div className="size-10 rounded-full bg-[#9E3E3E]/10 text-[#9E3E3E] mx-auto flex items-center justify-center">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-[#2F2926]">
              Failed to load gallery
            </h3>
            <p className="text-xs text-[#7A7069] mt-1">{error}</p>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-[#E7DED5] bg-[#FFFCF8] hover:bg-[#F8F5F0] text-[#2F2926] text-xs uppercase tracking-wider rounded-xs"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && mediaList.length === 0 && (
        <div className="max-w-lg mx-auto my-20 p-12 bg-[#FFFCF8] border border-[#E7DED5] rounded-xs text-center font-sans space-y-5">
          <div className="size-14 rounded-full bg-[#F8F5F0] border border-[#E7DED5] text-[#A67C6B] mx-auto flex items-center justify-center">
            <Camera className="size-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl text-[#2F2926] font-normal">
              No Photographs Yet
            </h3>
            <p className="text-xs text-[#7A7069] max-w-sm mx-auto leading-relaxed">
              Every story begins with a single frame. Be the first to share cherished memories of this celebration.
            </p>
          </div>
          <Button
            onClick={onOpenUpload}
            variant="outline"
            className="border-[#E7DED5] bg-[#FFFCF8] hover:bg-[#F8F5F0] hover:border-[#A67C6B] text-[#2F2926] text-xs uppercase tracking-widest px-6 py-2.5 rounded-xs h-auto gap-2"
          >
            <UploadCloud className="size-3.5 text-[#A67C6B]" />
            <span>Add First Photograph</span>
          </Button>
        </div>
      )}

      {/* Populated Gallery Grid */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 items-start gap-1.5 sm:gap-4 md:gap-6 lg:gap-8">
          {mediaList.map((media) => (
            <GalleryItem
              key={media.id}
              media={media}
              wedding={wedding}
              onSelect={handleSelectMedia}
              onDelete={onDeleteMedia}
              onUrlLoaded={handleUrlLoaded}
            />
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        item={selectedMedia?.item ?? null}
        wedding={wedding}
        url={selectedMedia?.url ?? null}
        isOpen={Boolean(selectedMedia)}
        onClose={handleCloseLightbox}
        onDelete={onDeleteMedia}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={
          Boolean(selectedMedia) &&
          selectedMedia!.index < mediaList.length - 1
        }
        hasPrev={Boolean(selectedMedia) && selectedMedia!.index > 0}
      />
    </section>
  );
};
