import React, { useState } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { AdminModal } from "@/components/wedding/AdminModal";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { deleteMedia } from "@/api/media";
import { getTenantCustomization, type TenantCustomization } from "@/api/tenant";
import { useActiveWedding, weddingKeys } from "@/hooks/queries/useWeddings";
import { useMedia, useDeleteMedia } from "@/hooks/queries/useMedia";
import { useQueryClient } from "@tanstack/react-query";
import { PricingModal } from "@/components/pricing/PricingModal";


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
  const activeSlug = propSlug || urlParams.get("slug") || undefined;
  const activeWeddingId = propWeddingId || urlParams.get("weddingId") || undefined;

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const initialAdminOpen =
    urlParams.get("login") === "subadmin" ||
    urlParams.get("admin") === "true" ||
    urlParams.get("action") === "login";
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(initialAdminOpen);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // TanStack Query for Wedding
  const {
    data: wedding,
    isLoading: isLoadingWedding,
    error: weddingError,
  } = useActiveWedding({ slug: activeSlug, weddingId: activeWeddingId });

  // Customization styling from tenant-service
  const [customization, setCustomization] = useState<TenantCustomization | null>(null);

  React.useEffect(() => {
    const identifier = wedding?.id || activeSlug;
    if (!identifier) return;
    getTenantCustomization(identifier)
      .then((data) => setCustomization(data))
      .catch(() => {});
  }, [wedding?.id, activeSlug]);

  // TanStack Query for Media
  const {
    data: mediaList = [],
    isLoading: isLoadingMedia,
    error: mediaQueryError,
    refetch: refetchMedia,
  } = useMedia(wedding?.id);

  // TanStack Query Mutation for Delete
  const deleteMutation = useDeleteMedia(wedding?.id);

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
              className="font-serif tracking-widest text-lg font-medium text-[#2F2926] dark:text-[#F5EFEB] uppercase hover:text-[#A67C6B] transition-colors cursor-pointer text-left"
            >
              Fotokita
            </button>
            <span className="hidden sm:inline-block w-px h-3.5 bg-[#E7DED5] dark:bg-[#332B25]" />
            <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97]">
              Editorial Wedding Gallery
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {onNavigateToLanding && (
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="hidden md:inline-flex text-xs uppercase tracking-wider text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors cursor-pointer"
              >
                Home
              </button>
            )}

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
              title="Toggle dark / light mode"
              aria-label="Toggle dark / light mode"
            />

            {/* CTA: Book Now */}
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#A67C6B]/40 hover:border-[#A67C6B] bg-[#A67C6B]/10 hover:bg-[#A67C6B]/20 text-[11px] uppercase tracking-wider text-[#A67C6B] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-all cursor-pointer font-medium"
            >
              <span>Book Now</span>
            </button>

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
        {weddingError ? (
          <div className="pt-32 pb-24 text-center px-4 max-w-md mx-auto space-y-4">
            <h2 className="font-serif text-3xl font-normal text-[#2F2926] dark:text-[#F5EFEB]">
              Galeri Tidak Dijumpai
            </h2>
            <p className="text-xs text-[#7A7069] dark:text-[#A89F97] leading-relaxed">
              Pautan galeri perkahwinan ini tidak wujud atau URL slug telah dikemas kini. Sila pastikan URL slug majlis adalah tepat.
            </p>
            {onNavigateToLanding && (
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="mt-4 px-6 py-2.5 rounded-full border border-[#D5CCC2] dark:border-[#3D352E] hover:border-[#2F2926] dark:hover:border-[#F5EFEB] text-xs font-medium cursor-pointer transition-colors"
              >
                Kembali ke Laman Utama
              </button>
            )}
          </div>
        ) : isLoadingWedding ? (
          <div className="pt-20 pb-16 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A7069] dark:text-[#A89F97] animate-pulse">
              Loading Wedding Archive...
            </p>
          </div>
        ) : (
          <WeddingHero
            wedding={wedding || null}
            photoCount={mediaList.length}
            onOpenUpload={() => setIsUploadOpen(true)}
            partner1Name={customization?.partner1}
            partner2Name={customization?.partner2}
            customDate={customization?.weddingDate}
            eyebrow={customization?.eyebrow}
            tagline={customization?.tagline}
            themePalette={customization?.themePalette}
            fireworksEnabled={customization?.fireworksEnabled}
          />
        )}

        {wedding && (
          <Gallery
            weddingId={wedding.id}
            wedding={wedding}
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
          onWeddingUpdated={(_updated) => {
            queryClient.invalidateQueries({ queryKey: weddingKeys.all });
          }}
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
            <span className="w-1 h-1 rounded-full bg-[#A67C6B]" />
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="text-[#A67C6B] hover:underline font-semibold cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </footer>

      {/* Pricing & Booking Dialog */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onOpenChange={setIsPricingModalOpen}
      />
    </div>
  );
};
