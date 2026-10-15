import React, { useState, useCallback, useEffect } from "react";
import { GalleryItem } from "./GalleryItem";
import { ImageLightbox } from "./ImageLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, RefreshCw, UploadCloud, Grid3X3, Square } from "lucide-react";
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
  const [columns, setColumns] = useState<1 | 3>(() => {
    try {
      const saved = localStorage.getItem("fotokita_gallery_layout");
      if (saved === "1" || saved === "3") {
        return Number(saved) as 1 | 3;
      }
    } catch {
      // ignore
    }
    return 3;
  });

  const handleSelectColumns = (cols: 1 | 3) => {
    setColumns(cols);
    try {
      localStorage.setItem("fotokita_gallery_layout", String(cols));
    } catch {
      // ignore
    }
  };

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
    const cachedUrl = urlCache[nextItem.id] || nextItem.url || "";

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
    const cachedUrl = urlCache[prevItem.id] || prevItem.url || "";

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
      const existingUrl = urlCache[target.id] || target.url;
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
    <section className="relative z-20 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-24 -mt-16 sm:-mt-24 md:-mt-28">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E7DED5]/80 dark:border-[#332B25]/80 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2.5 mb-2">
            <span className="w-5 h-px bg-[#A67C6B]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#7A7069] dark:text-[#A89F97] font-sans font-medium">
              Visual Archive
            </span>
            <span className="w-5 h-px bg-[#A67C6B]/50" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2F2926] dark:text-[#F5EFEB] font-normal tracking-tight leading-tight">
            The Photo Collection
          </h2>
          <p className="font-serif italic text-sm text-[#7A7069] dark:text-[#A89F97] mt-1.5 font-normal">
            A curated chronicle of celebration, emotion, and cherished memories
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A7069] dark:text-[#A89F97] font-sans tabular-nums tracking-wide">
              {mediaList.length} {mediaList.length === 1 ? "moment" : "moments"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] hover:bg-[#FFFCF8] dark:hover:bg-[#1A1715] rounded-xs h-7 w-7 p-0 text-xs transition-colors"
              title="Refresh gallery"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Toggle (1 photo vs 3 photos per line) */}
            <div
              role="group"
              aria-label="Susunan galeri foto"
              className="inline-flex items-center p-0.5 rounded-xs border border-[#E7DED5] dark:border-[#332B25] bg-[#F8F5F0]/80 dark:bg-[#12100E]/80 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => handleSelectColumns(1)}
                className={`px-2 py-1 rounded-[1px] text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all ${
                  columns === 1
                    ? "bg-[#FFFCF8] dark:bg-[#1A1715] text-[#2F2926] dark:text-[#F5EFEB] shadow-xs"
                    : "text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB]"
                }`}
                title="1 gambar selajur (lebih jelas)"
                aria-label="1 gambar selajur"
                aria-pressed={columns === 1}
              >
                <Square className="size-3" />
                <span className="text-[10px]">1</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectColumns(3)}
                className={`px-2 py-1 rounded-[1px] text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all ${
                  columns === 3
                    ? "bg-[#FFFCF8] dark:bg-[#1A1715] text-[#2F2926] dark:text-[#F5EFEB] shadow-xs"
                    : "text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB]"
                }`}
                title="3 gambar selajur (padat)"
                aria-label="3 gambar selajur"
                aria-pressed={columns === 3}
              >
                <Grid3X3 className="size-3" />
                <span className="text-[10px]">3</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {isLoading && mediaList.length === 0 && (
        <div
          className={
            columns === 1
              ? "grid grid-cols-1 items-start gap-6 sm:gap-8 max-w-[320px] sm:max-w-[350px] mx-auto px-1 sm:px-0"
              : "grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 items-start gap-1.5 sm:gap-4 md:gap-6 lg:gap-8"
          }
        >
          {Array.from({ length: columns === 1 ? 3 : 9 }).map((_, i) => (
            <div
              key={i}
              className={`bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] shadow-xs flex flex-col justify-start ${
                columns === 1
                  ? "rounded-[2px] p-2.5 pb-3 sm:p-3 sm:pb-3.5"
                  : "rounded-[1.5px] sm:rounded-[2px] p-1.5 pb-2 sm:p-3 sm:pb-3.5"
              }`}
            >
              <div
                className={`text-center shrink-0 flex items-center justify-center ${
                  columns === 1 ? "pb-2 h-6" : "pb-1 sm:pb-2 h-4 sm:h-6"
                }`}
              >
                <Skeleton
                  className={`bg-[#EDE6DC]/40 dark:bg-[#2C2622]/60 ${
                    columns === 1 ? "h-2 w-24" : "h-1.5 sm:h-2 w-10 sm:w-24"
                  }`}
                />
              </div>
              <Skeleton className="aspect-square w-full bg-[#EDE6DC]/60 dark:bg-[#2C2622]/80 animate-pulse rounded-[1px] shrink-0" />
              <div
                className={`shrink-0 space-y-1.5 text-center flex flex-col items-center justify-center ${
                  columns === 1 ? "h-[72px] pt-1" : "h-[54px] sm:h-[84px]"
                }`}
              >
                <Skeleton
                  className={`bg-[#EDE6DC]/60 dark:bg-[#2C2622]/80 ${
                    columns === 1 ? "h-3 w-36" : "h-2 sm:h-3 w-20 sm:w-36"
                  }`}
                />
                <Skeleton
                  className={`bg-[#EDE6DC]/40 dark:bg-[#2C2622]/60 ${
                    columns === 1 ? "h-2 w-24" : "h-1.5 sm:h-2 w-12 sm:w-24"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="max-w-md mx-auto my-16 p-8 bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-xs text-center font-sans space-y-4 shadow-none">
          <div className="size-10 rounded-full bg-[#9E3E3E]/10 text-[#9E3E3E] mx-auto flex items-center justify-center">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-[#2F2926] dark:text-[#F5EFEB]">
              Failed to load gallery
            </h3>
            <p className="text-xs text-[#7A7069] dark:text-[#A89F97] mt-1">{error}</p>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            className="border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] hover:bg-[#F8F5F0] dark:hover:bg-[#25211E] text-[#2F2926] dark:text-[#F5EFEB] text-xs uppercase tracking-wider rounded-xs"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && mediaList.length === 0 && (
        <div className="max-w-lg mx-auto my-20 p-12 bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-xs text-center font-sans space-y-5">
          <div className="size-14 rounded-full bg-[#F8F5F0] dark:bg-[#25211E] border border-[#E7DED5] dark:border-[#332B25] text-[#A67C6B] mx-auto flex items-center justify-center">
            <Camera className="size-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl text-[#2F2926] dark:text-[#F5EFEB] font-normal">
              No Photographs Yet
            </h3>
            <p className="text-xs text-[#7A7069] dark:text-[#A89F97] max-w-sm mx-auto leading-relaxed">
              Every story begins with a single frame. Be the first to share cherished memories of this celebration.
            </p>
          </div>
          <Button
            onClick={onOpenUpload}
            variant="outline"
            className="border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] hover:bg-[#F8F5F0] dark:hover:bg-[#25211E] hover:border-[#A67C6B] text-[#2F2926] dark:text-[#F5EFEB] text-xs uppercase tracking-widest px-6 py-2.5 rounded-xs h-auto gap-2"
          >
            <UploadCloud className="size-3.5 text-[#A67C6B]" />
            <span>Add First Photograph</span>
          </Button>
        </div>
      )}

      {/* Populated Gallery Grid */}
      {mediaList.length > 0 && (
        <div
          className={
            columns === 1
              ? "grid grid-cols-1 items-start gap-6 sm:gap-8 max-w-[320px] sm:max-w-[350px] mx-auto px-1 sm:px-0"
              : "grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 items-start gap-1.5 sm:gap-4 md:gap-6 lg:gap-8"
          }
        >
          {mediaList.map((media) => (
            <GalleryItem
              key={media.id}
              media={media}
              wedding={wedding}
              onSelect={handleSelectMedia}
              onDelete={onDeleteMedia}
              onUrlLoaded={handleUrlLoaded}
              layoutMode={columns}
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
