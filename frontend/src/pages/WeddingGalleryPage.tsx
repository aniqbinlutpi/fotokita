import React, { useState, useEffect, useCallback } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { AdminModal } from "@/components/wedding/AdminModal";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
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
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

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
      name: "Afiq & Wieam",
      slug: "afiq-wieam",
      date: new Date("2026-12-20T02:00:00Z").toISOString(),
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
        let activeWedding = await fetchWeddingData();
        try {
          const savedOverride = localStorage.getItem("fotokita_wedding_override");
          if (savedOverride) {
            const parsed = JSON.parse(savedOverride);
            activeWedding = { ...activeWedding, ...parsed };
          }
        } catch {
          // ignore
        }
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
        let fallback: Wedding = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Afiq & Wieam",
          slug: "afiq-wieam",
          date: new Date("2026-12-20T02:00:00Z").toISOString(),
          createdAt: new Date().toISOString(),
        };
        try {
          const savedOverride = localStorage.getItem("fotokita_wedding_override");
          if (savedOverride) {
            const parsed = JSON.parse(savedOverride);
            fallback = { ...fallback, ...parsed };
          }
        } catch {
          // ignore
        }
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

  const handleDeleteMedia = async (mediaId: string, code?: string) => {
    try {
      await deleteMedia(mediaId, code);
      setMediaList((prev) => prev.filter((item) => item.id !== mediaId));
      try {
        localStorage.removeItem(`fotokita_secret_${mediaId}`);
      } catch {
        // Ignored
      }
      toast.success("Photograph removed from archive");
    } catch (err: any) {
      console.error("Failed to delete media:", err);
      toast.error("Failed to delete photograph", {
        description: err?.message || "Please check secret code or server connection.",
      });
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#12100E] text-[#2F2926] dark:text-[#F5EFEB] selection:bg-[#A67C6B]/20 selection:text-[#2F2926] dark:selection:text-[#F5EFEB] flex flex-col font-sans transition-colors duration-300">
      <Toaster />

      {/* Editorial Navigation Bar */}
      <nav className="border-b border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8]/80 dark:bg-[#1A1715]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-widest text-lg font-medium text-[#2F2926] dark:text-[#F5EFEB] uppercase">
              Fotokita
            </span>
            <span className="hidden sm:inline-block w-px h-3.5 bg-[#E7DED5] dark:bg-[#332B25]" />
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97]">
              Editorial Wedding Gallery
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {wedding && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A7069] dark:text-[#A89F97] hidden md:inline-block">
                  Archive: <span className="text-[#2F2926] dark:text-[#F5EFEB] font-medium">{wedding.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(true)}
                  title="Admin Access (Edit Names & Date)"
                  className="w-5 h-5 rounded-full border border-[#D5CCC2] dark:border-[#3D352E] text-[#8C7E74] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] hover:border-[#2F2926] dark:hover:border-[#F5EFEB] hover:bg-[#EFE9DF]/50 dark:hover:bg-[#25211E] flex items-center justify-center text-xs font-serif italic transition-all duration-150 cursor-pointer shadow-2xs select-none"
                  aria-label="Admin Access"
                >
                  ?
                </button>
              </div>
            )}

            {/* Dark / Light Mode Switcher */}
            <AnimatedThemeToggler
              variant="circle"
              duration={450}
              className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 cursor-pointer p-1 flex items-center justify-center select-none [&_svg]:size-4 sm:[&_svg]:size-[18px]"
              title="Tukar tema mod gelap / cerah"
              aria-label="Tukar tema mod gelap / cerah"
            />

            <button
              onClick={() => setIsUploadOpen(true)}
              className="text-xs uppercase tracking-widest text-[#A67C6B] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 font-medium cursor-pointer"
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
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A7069] dark:text-[#A89F97] animate-pulse">
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
            wedding={wedding}
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
          wedding={wedding}
          isOpen={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Admin Settings Modal */}
      {wedding && (
        <AdminModal
          wedding={wedding}
          isOpen={isAdminOpen}
          onOpenChange={setIsAdminOpen}
          onWeddingUpdated={(updated) => {
            setWedding(updated);
          }}
        />
      )}

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] py-8 px-6 text-center text-xs text-[#7A7069] dark:text-[#A89F97] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-sm text-[#2F2926] dark:text-[#F5EFEB]">
            Fotokita — Preserving timeless wedding memories
          </p>
          <p className="text-[11px] text-[#7A7069] dark:text-[#A89F97] uppercase tracking-widest">
            Photography & Art Direction
          </p>
        </div>
      </footer>
    </div>
  );
};
