import React, { useState, useMemo } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { deleteMedia } from "@/api/media";
import { getTenantCustomization, type TenantCustomization } from "@/api/tenant";
import { useActiveWedding } from "@/hooks/queries/useWeddings";
import { useMedia, useDeleteMedia } from "@/hooks/queries/useMedia";
import { extractSlugFromSearch } from "@/lib/slug";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import { NotFoundPage } from "./error/404_NotFoundPage";
import type { Wedding } from "@/types/wedding";


interface WeddingGalleryPageProps {
  slug?: string;
  weddingId?: string;
  onOpenRegister?: () => void;
  onNavigateToLanding?: () => void;
}

export const WeddingGalleryPage: React.FC<WeddingGalleryPageProps> = ({
  slug: propSlug,
  weddingId: propWeddingId,
  onOpenRegister: _onOpenRegister,
  onNavigateToLanding,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const activeSlug = propSlug || extractSlugFromSearch(window.location.search) || undefined;
  const activeWeddingId = propWeddingId || urlParams.get("weddingId") || undefined;
  const isSubadminPreview = urlParams.get("preview") === "subadmin";

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // TanStack Query for Wedding
  const {
    data: wedding,
    isLoading: isLoadingWedding,
    error: weddingError,
  } = useActiveWedding({ slug: activeSlug, weddingId: activeWeddingId });

  // Customization styling from tenant-service
  const [customization, setCustomization] = useState<TenantCustomization | null>(null);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState<boolean>(true);
  const [showMobileBoundary, setShowMobileBoundary] = useState<boolean>(true);
  const [deviceView, setDeviceView] = useState<"full" | "mobile" | "tablet">(() => {
    const p = urlParams.get("deviceView");
    if (p === "mobile" || p === "tablet" || p === "full") return p;
    return "full";
  });

  // Compute effective wedding for live preview or active wedding
  const effectiveWedding: Wedding | null = useMemo(() => {
    if (wedding) return wedding;
    if (isSubadminPreview && customization) {
      const name =
        customization.partner1 && customization.partner2
          ? `${customization.partner1} & ${customization.partner2}`
          : customization.partner1 || "Wedding Archive";
      return {
        id: customization.weddingId || activeWeddingId || "preview-wedding",
        name,
        slug: customization.slug || activeSlug || "wedding",
        date: customization.weddingDate || "2026-10-30",
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }, [wedding, isSubadminPreview, customization, activeWeddingId, activeSlug]);

  React.useEffect(() => {
    const identifier = wedding?.id || activeSlug;
    if (!identifier) return;
    getTenantCustomization(identifier)
      .then((data) => setCustomization(data))
      .catch(() => {});
  }, [wedding?.id, activeSlug]);

  // Listen for live preview synchronization from parent editor (Sub-Admin Portal)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "FOTOKITA_PREVIEW_SYNC") {
        if (event.data.customization) {
          setCustomization((prev) => ({
            ...prev,
            ...event.data.customization,
          }));
        }
        if (event.data.deviceView) {
          setDeviceView(event.data.deviceView);
        }
        if (event.data.guides) {
          if (typeof event.data.guides.showAlignmentGuides === "boolean") {
            setShowAlignmentGuides(event.data.guides.showAlignmentGuides);
          }
          if (typeof event.data.guides.showMobileBoundary === "boolean") {
            setShowMobileBoundary(event.data.guides.showMobileBoundary);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "FOTOKITA_PREVIEW_READY" }, "*");
    }

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const isMobileLayout =
    deviceView === "mobile" ||
    (deviceView !== "tablet" && typeof window !== "undefined" && window.innerWidth < 768);

  const handleHeroPositionChange = (
    id: string,
    pos: { x: number; y: number; zIndex?: number; locked?: boolean }
  ) => {
    const targetKey = isMobileLayout ? "mobileTextPositions" : "textPositions";
    const currentPositions = (customization as any)?.[targetKey] || {};
    const current = currentPositions[id] || { x: 0, y: 0 };
    const mergedPos = { ...current, ...pos };
    const updatedPositions = {
      ...currentPositions,
      [id]: mergedPos,
    };
    setCustomization((prev) => (prev ? { ...prev, [targetKey]: updatedPositions } : null));

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "FOTOKITA_PREVIEW_POSITION_CHANGE",
          targetKey,
          textPositions: updatedPositions,
        },
        "*"
      );
    }
  };

  // TanStack Query for Media
  const {
    data: mediaList = [],
    isLoading: isLoadingMedia,
    error: mediaQueryError,
    refetch: refetchMedia,
  } = useMedia(effectiveWedding?.id);

  // TanStack Query Mutation for Delete
  const deleteMutation = useDeleteMedia(effectiveWedding?.id);

  const handleRefresh = async () => {
    await refetchMedia();
  };

  const handleUploadSuccess = () => {
    refetchMedia();
  };

  const handleDeleteMedia = async (mediaId: string, code?: string) => {
    try {
      if (code) {
        await deleteMedia(mediaId, code);
        await refetchMedia();
      } else {
        await deleteMutation.mutateAsync(mediaId);
      }
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

  if (weddingError && !effectiveWedding) {
    return (
      <NotFoundPage
        weddingSlug={activeSlug}
        onNavigateHome={onNavigateToLanding}
        title="Wedding Gallery Not Found"
        description={
          activeSlug
            ? `The wedding gallery link for "${activeSlug}" was not found in our archive. Please verify the URL spelling or reach out to the couple.`
            : "This wedding gallery could not be found or may have been relocated."
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#12100E] text-[#2F2926] dark:text-[#F5EFEB] selection:bg-[#A67C6B]/20 selection:text-[#2F2926] dark:selection:text-[#F5EFEB] flex flex-col font-sans transition-colors duration-300">
      <Toaster />

      {/* Editorial Navigation Bar */}
      <nav className="border-b border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8]/80 dark:bg-[#1A1715]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-40 px-6 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="flex items-center group cursor-pointer text-left"
            >
              <FotokitaLogo variant="full" size="sm" />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {effectiveWedding && (
              <span className="text-xs text-[#7A7069] dark:text-[#A89F97] hidden md:inline-block">
                Archive: <span className="text-[#2F2926] dark:text-[#F5EFEB] font-medium">
                  {customization?.partner1 && customization?.partner2
                    ? `${customization.partner1} & ${customization.partner2}`
                    : effectiveWedding.name}
                </span>
              </span>
            )}

            {/* Dark / Light Mode Switcher */}
            <AnimatedThemeToggler
              variant="circle"
              duration={450}
              className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 cursor-pointer p-1 flex items-center justify-center select-none [&_svg]:size-4 sm:[&_svg]:size-[18px]"
              title="Toggle dark / light mode"
              aria-label="Toggle dark / light mode"
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
        {isLoadingWedding && !effectiveWedding ? (
          <div className="pt-20 pb-16 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A7069] dark:text-[#A89F97] animate-pulse">
              Loading Wedding Archive...
            </p>
          </div>
        ) : (
          <WeddingHero
            wedding={effectiveWedding}
            photoCount={mediaList.length}
            onOpenUpload={() => setIsUploadOpen(true)}
            partner1Name={customization?.partner1}
            partner2Name={customization?.partner2}
            customDate={customization?.weddingDate}
            eyebrow={customization?.eyebrow}
            tagline={customization?.tagline}
            themePalette={customization?.themePalette}
            fireworksEnabled={customization?.fireworksEnabled}
            partnerFont={customization?.partnerFont}
            partnerSize={customization?.partnerSize}
            eyebrowFont={customization?.eyebrowFont}
            eyebrowSize={customization?.eyebrowSize}
            dateFont={customization?.dateFont}
            dateSize={customization?.dateSize}
            quoteFont={customization?.quoteFont}
            quoteSize={customization?.quoteSize}
            ampersandSize={customization?.ampersandSize}
            orbSize={customization?.orbSize}
            textPositions={isMobileLayout ? customization?.mobileTextPositions || null : customization?.textPositions || null}
            isEditor={isSubadminPreview}
            onTextPositionChange={handleHeroPositionChange}
            showAlignmentGuides={showAlignmentGuides}
            showMobileBoundary={showMobileBoundary}
            deviceView={deviceView}
          />
        )}

        {effectiveWedding && (
          <Gallery
            weddingId={effectiveWedding.id}
            wedding={effectiveWedding}
            mediaList={mediaList}
            isLoading={isLoadingMedia}
            error={mediaQueryError ? (mediaQueryError as Error).message : null}
            onRefresh={handleRefresh}
            onDeleteMedia={handleDeleteMedia}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Upload Modal Dialog */}
      {effectiveWedding && (
        <UploadPhotos
          weddingId={effectiveWedding.id}
          wedding={effectiveWedding}
          isOpen={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] py-8 px-6 text-center text-xs text-[#7A7069] dark:text-[#A89F97] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-sm text-[#2F2926] dark:text-[#F5EFEB]">
            Fotokita — Preserving timeless wedding memories
          </p>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest">
            <span>Photography & Art Direction</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
