import React, { useState, useEffect, useCallback } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getWeddings, createWedding, getWeddingById } from "@/api/wedding";
import { getMediaByWeddingId, deleteMedia } from "@/api/media";
import type { Wedding } from "@/types/wedding";
import type { MediaItem } from "@/types/media";

export const WeddingGalleryPage: React.FC = () => {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoadingWedding, setIsLoadingWedding] = useState<boolean>(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Fetch active wedding
  const fetchWeddingData = useCallback(async (): Promise<Wedding> => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlWeddingId = urlParams.get("weddingId");

    if (urlWeddingId) {
      try {
        const specificWedding = await getWeddingById(urlWeddingId);
        if (specificWedding) {
          return specificWedding;
        }
      } catch (e) {
        console.warn("Could not find wedding from URL param, falling back to listing", e);
      }
    }

    const weddings = await getWeddings();
    if (weddings && weddings.length > 0) {
      return weddings[0];
    }

    return await createWedding({
      name: "Claire & Julian",
      slug: "claire-and-julian-2026",
      date: new Date("2026-09-27T14:00:00Z").toISOString(),
    });
  }, []);

  // Fetch media items for a wedding
  const fetchMediaData = useCallback(async (weddingId: string): Promise<MediaItem[]> => {
    const items = await getMediaByWeddingId(weddingId);
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialData() {
      try {
        const activeWedding = await fetchWeddingData();
        if (isCancelled) return;
        setWedding(activeWedding);
        setIsLoadingWedding(false);

        try {
          const media = await fetchMediaData(activeWedding.id);
          if (isCancelled) return;
          setMediaList(media);
        } catch (err: any) {
          if (isCancelled) return;
          console.error("Failed to load media:", err);
          setMediaError(err?.message || "Failed to load photographs from the media service.");
        } finally {
          if (!isCancelled) {
            setIsLoadingMedia(false);
          }
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error("Failed to load wedding details:", err);
        const fallback: Wedding = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Claire & Julian",
          slug: "claire-and-julian",
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        setWedding(fallback);
        setIsLoadingWedding(false);
        setIsLoadingMedia(false);
      }
    }

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [fetchWeddingData, fetchMediaData]);

  const handleRefresh = async () => {
    if (!wedding) return;
    try {
      setIsLoadingMedia(true);
      setMediaError(null);
      const items = await fetchMediaData(wedding.id);
      setMediaList(items);
    } catch (err: any) {
      console.error("Failed to refresh media:", err);
      setMediaError(err?.message || "Failed to refresh photographs.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleUploadSuccess = (newMedia: MediaItem) => {
    setMediaList((prev) => [newMedia, ...prev]);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await deleteMedia(mediaId);
      setMediaList((prev) => prev.filter((item) => item.id !== mediaId));
      toast.success("Photograph removed from archive");
    } catch (err: any) {
      console.error("Failed to delete media:", err);
      toast.error("Failed to delete photograph", {
        description: err?.message || "Please check server connection.",
      });
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2F2926] selection:bg-[#A67C6B]/20 selection:text-[#2F2926] flex flex-col font-sans">
      <Toaster />

      {/* Editorial Navigation Bar */}
      <nav className="border-b border-[#E7DED5] bg-[#FFFCF8]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-widest text-lg font-medium text-[#2F2926] uppercase">
              Fotokita
            </span>
            <span className="hidden sm:inline-block w-px h-3.5 bg-[#E7DED5]" />
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-[#7A7069]">
              Editorial Wedding Gallery
            </span>
          </div>

          <div className="flex items-center gap-4">
            {wedding && (
              <span className="text-xs text-[#7A7069] hidden md:inline-block">
                Archive: <span className="text-[#2F2926] font-medium">{wedding.name}</span>
              </span>
            )}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs uppercase tracking-widest text-[#A67C6B] hover:text-[#2F2926] transition-colors duration-200 font-medium cursor-pointer"
            >
              + Upload
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoadingWedding ? (
          <div className="pt-20 pb-16 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A7069] animate-pulse">
              Loading Wedding Archive...
            </p>
          </div>
        ) : (
          <WeddingHero
            wedding={wedding}
            photoCount={mediaList.length}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {wedding && (
          <Gallery
            weddingId={wedding.id}
            mediaList={mediaList}
            isLoading={isLoadingMedia}
            error={mediaError}
            onRefresh={handleRefresh}
            onDeleteMedia={handleDeleteMedia}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Upload Modal Dialog */}
      {wedding && (
        <UploadPhotos
          weddingId={wedding.id}
          isOpen={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-[#E7DED5] bg-[#FFFCF8] py-8 px-6 text-center text-xs text-[#7A7069]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-sm text-[#2F2926]">
            Fotokita — Preserving timeless wedding memories
          </p>
          <p className="text-[11px] text-[#7A7069] uppercase tracking-widest">
            Photography & Art Direction
          </p>
        </div>
      </footer>
    </div>
  );
};
