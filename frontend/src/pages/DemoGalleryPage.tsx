import React, { useState, useMemo } from "react";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { AdminModal } from "@/components/wedding/AdminModal";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { PricingModal } from "@/components/pricing/PricingModal";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import type { Wedding } from "@/types/wedding";
import type { MediaItem } from "@/types/media";

const INITIAL_DEMO_WEDDING: Wedding = {
  id: "demo-wedding",
  name: "Tewkesbury & Enola",
  slug: "demo",
  date: "2026-10-31T00:00:00.000Z",
  createdAt: "2026-10-31T00:00:00.000Z",
};

const INITIAL_DEMO_PHOTOS: MediaItem[] = [
  {
    id: "demo-1",
    weddingId: "demo-wedding",
    filename: "royal_entrance.jpg",
    mimeType: "image/jpeg",
    size: 1204000,
    fromName: "Sherlock Holmes",
    wishes: "A deduction-defying match! Wishing you a lifetime of joy, laughter and harmony.",
    signature: "- Sherlock -",
    code: "1234",
    createdAt: "2026-10-31T15:45:00.000Z",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-2",
    weddingId: "demo-wedding",
    filename: "vows_exchange.jpg",
    mimeType: "image/jpeg",
    size: 1150000,
    fromName: "Lady Tewkesbury",
    wishes: "My heart is overflowing seeing both of you so completely devoted. Congratulations!",
    signature: "- Lady T -",
    code: "1234",
    createdAt: "2026-10-31T16:12:00.000Z",
    url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-3",
    weddingId: "demo-wedding",
    filename: "bridal_bouquet.jpg",
    mimeType: "image/jpeg",
    size: 980000,
    fromName: "Eudoria Holmes",
    wishes: "Paint your own path together, Enola. Never stop defying the ordinary!",
    signature: "- Eudoria -",
    code: "1234",
    createdAt: "2026-10-31T16:30:00.000Z",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-4",
    weddingId: "demo-wedding",
    filename: "first_dance.jpg",
    mimeType: "image/jpeg",
    size: 1420000,
    fromName: "Dr. John Watson",
    wishes: "An exquisite evening! Best wedding dance floor celebration I have ever attended.",
    signature: "- J. Watson -",
    code: "1234",
    createdAt: "2026-10-31T17:15:00.000Z",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-5",
    weddingId: "demo-wedding",
    filename: "champagne_toast.jpg",
    mimeType: "image/jpeg",
    size: 1310000,
    fromName: "Inspector Lestrade",
    wishes: "To the Viscount and his brilliant Lady. Cheers to an unbreakable lifetime partnership!",
    signature: "- Lestrade -",
    code: "1234",
    createdAt: "2026-10-31T18:00:00.000Z",
    url: "https://images.unsplash.com/photo-1519225429980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-6",
    weddingId: "demo-wedding",
    filename: "reception_table.jpg",
    mimeType: "image/jpeg",
    size: 1550000,
    fromName: "Mrs. Hudson",
    wishes: "Such a breathtaking reception! The flowers and candlelights are utterly magical.",
    signature: "- Mrs. Hudson -",
    code: "1234",
    createdAt: "2026-10-31T18:45:00.000Z",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-7",
    weddingId: "demo-wedding",
    filename: "garden_stroll.jpg",
    mimeType: "image/jpeg",
    size: 1100000,
    fromName: "Lord Tewkesbury",
    wishes: "With you, every adventure is only just beginning. Forever yours, Tewkesbury.",
    signature: "- Tewkesbury -",
    code: "1234",
    createdAt: "2026-10-31T19:20:00.000Z",
    url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "demo-8",
    weddingId: "demo-wedding",
    filename: "sparkler_sendoff.jpg",
    mimeType: "image/jpeg",
    size: 1250000,
    fromName: "Enola Holmes",
    wishes: "Our future is whatever we choose to create. Thank you everyone for being here!",
    signature: "- Enola -",
    code: "1234",
    createdAt: "2026-10-31T20:00:00.000Z",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85",
  },
];

interface DemoGalleryPageProps {
  onOpenRegister?: () => void;
  onNavigateToLanding?: () => void;
}

export const DemoGalleryPage: React.FC<DemoGalleryPageProps> = ({
  onOpenRegister: _onOpenRegister,
  onNavigateToLanding,
}) => {
  const [wedding, setWedding] = useState<Wedding>(INITIAL_DEMO_WEDDING);
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_DEMO_PHOTOS);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

  // Parse partner names for WeddingHero
  const { partner1, partner2 } = useMemo(() => {
    if (wedding.name.includes("&")) {
      const parts = wedding.name.split("&").map((s) => s.trim());
      return { partner1: parts[0] || "Tewkesbury", partner2: parts[1] || "Enola" };
    }
    if (wedding.name.includes("and")) {
      const parts = wedding.name.split("and").map((s) => s.trim());
      return { partner1: parts[0] || "Tewkesbury", partner2: parts[1] || "Enola" };
    }
    return { partner1: wedding.name, partner2: "" };
  }, [wedding.name]);

  const handleRefresh = async () => {
    toast.success("Gallery refreshed", {
      description: "Live demo archive synchronized.",
    });
  };

  const handleUploadSuccess = (newMedia: MediaItem) => {
    setMediaList((prev) => [newMedia, ...prev]);
  };

  const handleCustomUpload = async ({
    file,
    from,
    wishes,
    signature,
    code,
  }: {
    weddingId: string;
    file: File;
    from: string;
    wishes: string;
    signature?: string;
    code: string;
    onProgress?: (percent: number) => void;
  }): Promise<MediaItem> => {
    // Generate immediate preview URL
    const objectUrl = URL.createObjectURL(file);
    const newMedia: MediaItem = {
      id: `demo-upload-${Date.now()}`,
      weddingId: wedding.id,
      filename: file.name,
      mimeType: file.type || "image/jpeg",
      size: file.size,
      fromName: from,
      wishes,
      signature,
      code,
      createdAt: new Date().toISOString(),
      url: objectUrl,
    };
    return newMedia;
  };

  const handleDeleteMedia = async (mediaId: string, code?: string) => {
    const targetItem = mediaList.find((m) => m.id === mediaId);
    if (!targetItem) {
      throw new Error("Photograph not found.");
    }

    const correctCode = targetItem.code || "1234";
    if (code && code.trim() !== correctCode) {
      throw new Error("Incorrect secret code. Only the uploader can remove this photo.");
    }

    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    try {
      localStorage.removeItem(`fotokita_secret_${mediaId}`);
    } catch {
      // Ignored
    }
    toast.success("Photograph removed from archive");
  };

  const handleWeddingUpdated = (updated: Wedding) => {
    setWedding(updated);
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
              className="flex items-center group cursor-pointer text-left"
            >
              <FotokitaLogo variant="full" size="sm" />
            </button>
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7A7069] dark:text-[#A89F97] hidden md:inline-block">
                Archive: <span className="text-[#2F2926] dark:text-[#F5EFEB] font-medium">
                  {wedding.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                title="Admin Access (Edit Names & Date)"
                className="w-5 h-5 rounded-full border border-[#D5CCC2] dark:border-[#332B25] text-[#8C7E74] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] hover:border-[#2F2926] dark:hover:border-[#F5EFEB] hover:bg-[#EFE9DF]/50 dark:hover:bg-[#25211E] flex items-center justify-center text-xs font-serif italic transition-all duration-150 cursor-pointer shadow-2xs select-none"
                aria-label="Admin Access"
              >
                ?
              </button>
            </div>

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
        <WeddingHero
          wedding={wedding}
          photoCount={mediaList.length}
          onOpenUpload={() => setIsUploadOpen(true)}
          partner1Name={partner1}
          partner2Name={partner2}
          customDate={wedding.date}
          eyebrow="- WEDDING ARCHIVE -"
          tagline="Every candid smile, every heartfelt celebration — preserved for a lifetime."
          themePalette="warmGold"
          fireworksEnabled={true}
        />

        <Gallery
          weddingId={wedding.id}
          wedding={wedding}
          mediaList={mediaList}
          isLoading={false}
          error={null}
          onRefresh={handleRefresh}
          onDeleteMedia={handleDeleteMedia}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Upload Modal Dialog */}
      <UploadPhotos
        weddingId={wedding.id}
        wedding={wedding}
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={handleUploadSuccess}
        onCustomUpload={handleCustomUpload}
      />

      {/* Admin Settings Modal */}
      <AdminModal
        wedding={wedding}
        isOpen={isAdminOpen}
        onOpenChange={setIsAdminOpen}
        onWeddingUpdated={handleWeddingUpdated}
      />

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
