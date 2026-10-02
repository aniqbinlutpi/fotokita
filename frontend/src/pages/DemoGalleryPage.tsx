import React, { useState, useEffect, useCallback, useMemo } from "react";
import ScrollExpand from "@/components/ScrollExpand";
import { Shdr12 } from "@/components/ui/shdr-12";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  UploadCloud,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Sparkles,
  Camera,
  Heart,
  ArrowRight,
  X,
  Info,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import imgExpand from "@/assets/images/img-expand.png";
import { PricingModal } from "@/components/pricing/PricingModal";

// Palette matching WeddingHero for the 3D brick orb
const warmGoldChocolateBrickColors = {
  brickA: "#1F1712", // Deep Dark Chocolate
  brickB: "#4A3728", // Rich Mocha Bronze
  brickC: "#8C6D48", // Warm Antique Gold
  brickD: "#C9AA7C", // Soft Champagne Gold
  brickE: "#F5EADB", // Lustrous Silk Cream
};

export interface DemoPhotoItem {
  id: string;
  title: string;
  url: string;
  filename: string;
  fromName: string;
  wishes: string;
  time: string;
  aspectRatio?: string;
}

const STATIC_DEMO_PHOTOS: DemoPhotoItem[] = [
  {
    id: "demo-1",
    title: "The Royal Entrance",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
    filename: "royal_entrance.jpg",
    fromName: "Sherlock Holmes",
    wishes: "A deduction-defying match! Wishing you a lifetime of joy, laughter and harmony.",
    time: "3:45 PM",
  },
  {
    id: "demo-2",
    title: "Vows & Rings Exchange",
    url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=85",
    filename: "vows_exchange.jpg",
    fromName: "Lady Tewkesbury",
    wishes: "My heart is overflowing seeing both of you so completely devoted. Congratulations!",
    time: "4:12 PM",
  },
  {
    id: "demo-3",
    title: "The Bouquet & Laughter",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
    filename: "bridal_bouquet.jpg",
    fromName: "Eudoria Holmes",
    wishes: "Paint your own path together, Enola. Never stop defying the ordinary!",
    time: "4:30 PM",
  },
  {
    id: "demo-4",
    title: "First Dance Under the Chandelier",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85",
    filename: "first_dance.jpg",
    fromName: "Dr. John Watson",
    wishes: "An exquisite evening! Best wedding dance floor celebration I have ever attended.",
    time: "5:15 PM",
  },
  {
    id: "demo-5",
    title: "Champagne Toast & Cheers",
    url: "https://images.unsplash.com/photo-1519225429980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
    filename: "champagne_toast.jpg",
    fromName: "Inspector Lestrade",
    wishes: "To the Viscount and his brilliant Lady. Cheers to an unbreakable lifetime partnership!",
    time: "6:00 PM",
  },
  {
    id: "demo-6",
    title: "The Grand Reception Table",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85",
    filename: "reception_table.jpg",
    fromName: "Mrs. Hudson",
    wishes: "Such a breathtaking reception! The flowers and candlelights are utterly magical.",
    time: "6:45 PM",
  },
  {
    id: "demo-7",
    title: "Stroll in the English Garden",
    url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85",
    filename: "garden_stroll.jpg",
    fromName: "Lord Tewkesbury",
    wishes: "With you, every adventure is only just beginning. Forever yours, Tewkesbury.",
    time: "7:20 PM",
  },
  {
    id: "demo-8",
    title: "Sparklers Send-Off",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85",
    filename: "sparkler_sendoff.jpg",
    fromName: "Enola Holmes",
    wishes: "Our future is whatever we choose to create. Thank you everyone for being here!",
    time: "8:00 PM",
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
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploadDemoOpen, setIsUploadDemoOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activePhoto = useMemo(() => {
    if (selectedPhotoIndex === null) return null;
    return STATIC_DEMO_PHOTOS[selectedPhotoIndex] || null;
  }, [selectedPhotoIndex]);

  const handleNextPhoto = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    if (selectedPhotoIndex < STATIC_DEMO_PHOTOS.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  }, [selectedPhotoIndex]);

  const handlePrevPhoto = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  }, [selectedPhotoIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "ArrowRight") handleNextPhoto();
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "Escape") setSelectedPhotoIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, handleNextPhoto, handlePrevPhoto]);

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Live Demo Archive Up To Date", {
        description: "Static showcase data for Tewkesbury & Enola is fully synchronised.",
      });
    }, 450);
  };

  const handleDownloadDemoPhoto = (photo: DemoPhotoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toast.info(`Preparing print for "${photo.title}"`, {
      description: "Sample high-resolution photo downloaded.",
    });
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `fotokita-tewkesbury-enola-${photo.filename}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] dark:bg-[#12100E] text-[#2F2926] dark:text-[#F5EFEB] selection:bg-[#A67C6B]/20 selection:text-[#2F2926] dark:selection:text-[#F5EFEB] flex flex-col font-sans transition-colors duration-300">
      <Toaster />

      {/* ─────────────────────────────────────────────────────────────
          EDITORIAL NAVIGATION BAR (DEMO SHOWCASE)
      ───────────────────────────────────────────────────────────── */}
      <nav className="border-b border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8]/85 dark:bg-[#1A1715]/85 backdrop-blur-md fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3.5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
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

          {/* Right Navigation & Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {onNavigateToLanding && (
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="hidden md:inline-flex text-xs uppercase tracking-wider text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors cursor-pointer"
              >
                Home
              </button>
            )}

            {/* Archive Label & Info Trigger */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7A7069] dark:text-[#A89F97] hidden md:inline-block">
                Archive:{" "}
                <span className="text-[#2F2926] dark:text-[#F5EFEB] font-medium">
                  Tewkesbury & Enola
                </span>
              </span>

              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                title="Live Demo Information"
                className="w-5 h-5 rounded-full border border-[#D5CCC2] dark:border-[#3D352E] text-[#8C7E74] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] hover:border-[#2F2926] dark:hover:border-[#F5EFEB] hover:bg-[#EFE9DF]/50 dark:hover:bg-[#25211E] flex items-center justify-center text-xs font-serif italic transition-all duration-150 cursor-pointer shadow-2xs select-none"
                aria-label="Demo Information"
              >
                ?
              </button>
            </div>

            {/* Live Demo Showcase Pill */}
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-widest bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-2 py-0.5"
            >
              Live Demo
            </Badge>

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

            {/* Upload Demo Modal */}
            <button
              onClick={() => setIsUploadDemoOpen(true)}
              className="text-xs uppercase tracking-widest text-[#A67C6B] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 font-medium cursor-pointer"
            >
              + Upload
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        {/* HERO SECTION: Matches the screenshot with 3D brick orb inside the & */}
        <section className="relative w-full">
          <ScrollExpand
            src={imgExpand}
            alt="Tewkesbury & Enola Wedding Archive"
            useWindowScroll={true}
            shape="circle"
            circleSize={isMobile ? 0.2 : 0.16}
            orbSize={isMobile ? 54 : 130}
            orbOffset={isMobile ? { x: 40, y: -38 } : { x: 112, y: -98 }}
            startRadius={9999}
            endRadius={0}
            mediaZoom={1.28}
            scrollDistance={1.1}
            holdDistance={0.35}
            smoothing={0.08}
            overlayScrim={0.45}
            orb={
              <Shdr12
                className="size-full"
                state="idle"
                params={{
                  spin: 0.32,
                  tilt: 0.45,
                  studs: 24,
                  gloss: 2.2,
                  gap: 0.02,
                  patch: 0.65,
                  gain: 1.05,
                  radius: 0.94,
                  contrast: 1.05,
                }}
                colors={warmGoldChocolateBrickColors}
                stateColors={{
                  idle: warmGoldChocolateBrickColors,
                  thinking: warmGoldChocolateBrickColors,
                  speaking: warmGoldChocolateBrickColors,
                }}
                statePresets={{
                  idle: { spin: 0.3, gloss: 2.2, gap: 0.02 },
                  thinking: { spin: 0.1, gloss: 1.5, gap: 0.15 },
                  speaking: { spin: 0.5, gloss: 2.4, gap: 0 },
                }}
                wrapper="none"
                paused={false}
                pauseOffscreen
                maxDpr={1.5}
                ariaLabel="Warm Gold and Chocolate 3D Brick Orb"
              />
            }
            behindOrb={
              <div className="flex items-center justify-center pointer-events-none select-none">
                <span className="font-serif not-italic font-normal text-[#2F2926] dark:text-[#F5EFEB]/25 leading-none text-[200px] sm:text-[380px] md:text-[480px] lg:text-[560px] translate-y-[-2%] select-none">
                  &
                </span>
              </div>
            }
            title={
              <div className="w-full flex flex-col items-center justify-center pointer-events-none select-none max-w-7xl mx-auto relative px-2 sm:px-8 md:px-16">
                {/* Top Eyebrow: - WEDDING ARCHIVE - */}
                <div className="absolute -top-20 sm:-top-32 md:-top-40 lg:-top-44 left-0 right-0 flex items-center justify-center">
                  <span className="text-[11px] sm:text-xs md:text-base uppercase tracking-[0.35em] text-[#2F2926]/85 dark:text-[#F5EFEB]/85 font-sans font-medium whitespace-nowrap">
                    - WEDDING ARCHIVE -
                  </span>
                </div>

                {/* Middle Row: Tewkesbury on Left, Orb in Center, Enola on Right */}
                <div className="w-full flex items-center justify-between">
                  {/* Left Column: Tewkesbury + Date */}
                  <div className="flex-1 flex flex-col items-end text-right pr-5 sm:pr-16 md:pr-28 lg:pr-36 min-w-0">
                    <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap">
                      Tewkesbury
                    </h1>
                    <p className="font-sans text-[10.5px] sm:text-xs md:text-sm text-[#2F2926]/75 dark:text-[#F5EFEB]/75 tracking-wide sm:tracking-wider mt-1.5 sm:mt-3 whitespace-nowrap">
                      October 31, 2026
                    </p>
                  </div>

                  {/* Center Spacer accommodating the 3D Orb and & */}
                  <div className="shrink-0 w-[96px] sm:w-[125px] md:w-[145px] lg:w-[165px] pointer-events-none" />

                  {/* Right Column: Enola + Photo Count */}
                  <div className="flex-1 flex flex-col items-start text-left pl-9 sm:pl-16 md:pl-24 lg:pl-32 min-w-0">
                    <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2F2926] dark:text-[#F5EFEB] tracking-tight leading-none drop-shadow-sm whitespace-nowrap">
                      Enola
                    </h1>
                    <p className="font-sans text-[10.5px] sm:text-xs md:text-sm text-[#2F2926]/75 dark:text-[#F5EFEB]/75 tracking-wide sm:tracking-wider mt-1.5 sm:mt-3 whitespace-nowrap">
                      {STATIC_DEMO_PHOTOS.length} Photographs
                    </p>
                  </div>
                </div>
              </div>
            }
            background={
              <FireworksBackground
                className="absolute inset-0 size-full pointer-events-auto"
                population={1.2}
                color={[
                  "#D4AF37",
                  "#C5A880",
                  "#A67C6B",
                  "#E5A988",
                  "#8C624D",
                  "#DFBA89",
                ]}
                fireworkSpeed={{ min: 3.5, max: 6.5 }}
                particleSpeed={{ min: 1.5, max: 5 }}
                particleSize={{ min: 1.2, max: 3.5 }}
              />
            }
            scrollHint={
              <div className="inline-flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-[#7A7069] dark:text-[#A89F97] drop-shadow-sm">
                <span>Scroll to expand</span>
                <ChevronDown className="size-4 animate-bounce text-[#A67C6B]" />
              </div>
            }
          >
            {/* Full-bleed expanded overlay content */}
            <div className="flex flex-col items-center justify-center text-center max-w-2xl px-6 pointer-events-auto">
              <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[#E7DED5] mb-3 drop-shadow">
                <span className="w-8 h-px bg-[#E7DED5]/70" />
                <span>Wedding Archive</span>
                <span className="w-8 h-px bg-[#E7DED5]/70" />
              </div>

              <h2 className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-white tracking-tight leading-[1.05] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                Tewkesbury & Enola
              </h2>

              <p className="font-serif italic text-base sm:text-xl text-[#F8F5F0]/95 max-w-lg mx-auto mb-6 drop-shadow">
                Every candid smile, every heartfelt celebration — preserved for a lifetime.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => setIsUploadDemoOpen(true)}
                  className="bg-[#FFFCF8] dark:bg-[#1A1715] text-[#2F2926] dark:text-[#F5EFEB] hover:bg-[#F8F5F0] dark:hover:bg-[#25211E] border border-[#E7DED5] dark:border-[#332B25] transition-all duration-200 px-7 py-3 rounded-sm text-xs uppercase tracking-widest font-medium shadow-2xl gap-2 h-auto cursor-pointer pointer-events-auto"
                >
                  <UploadCloud className="size-4 text-[#A67C6B]" />
                  <span>Contribute Memories</span>
                </Button>
              </div>
            </div>
          </ScrollExpand>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            DEMO INFORMATION / NOTICE CALLOUT
        ───────────────────────────────────────────────────────────── */}
        <section className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-16 mb-6">
          <div className="rounded-xl border border-amber-500/25 bg-amber-50/70 dark:bg-amber-950/20 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="size-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-serif text-sm font-medium text-foreground">
                  Static Live Demo Showcase (Tewkesbury & Enola)
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This showcase demonstrates the live guest gallery with fixed sample data. Real purchasers get a dedicated private URL, custom couple names, table QR cards, and live ballroom screen streaming.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsPricingModalOpen(true)}
              className="shrink-0 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium cursor-pointer shadow-xs gap-1.5"
            >
              <span>Book Now</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            VISUAL ARCHIVE GALLERY GRID (FIXED DEMO PHOTOS)
        ───────────────────────────────────────────────────────────── */}
        <section className="relative z-20 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pb-24">
          {/* Section Header */}
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

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7A7069] dark:text-[#A89F97] font-sans tabular-nums tracking-wide">
                {STATIC_DEMO_PHOTOS.length} moments
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSimulateRefresh}
                disabled={isRefreshing}
                className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] hover:bg-[#FFFCF8] dark:hover:bg-[#1A1715] rounded-xs h-8 px-2.5 text-xs transition-colors"
                title="Refresh gallery"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 items-start gap-1.5 sm:gap-4 md:gap-6 lg:gap-8">
            {STATIC_DEMO_PHOTOS.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="group relative bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-[1.5px] sm:rounded-[2px] p-1.5 pb-2 sm:p-3 sm:pb-3.5 shadow-[0_2px_8px_-2px_rgba(47,41,38,0.06)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_28px_-6px_rgba(47,41,38,0.12)] dark:hover:shadow-[0_14px_32px_-6px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 flex flex-col justify-start cursor-pointer"
              >
                {/* Top Tiny Embossed Branding */}
                <div className="text-center pb-1 sm:pb-2 select-none shrink-0 h-4 sm:h-6 flex items-center justify-center">
                  <span className="text-[6.5px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.25em] text-[#7A7069]/60 dark:text-[#A89F97]/60 font-sans font-medium line-clamp-1 block">
                    Fotobooth Kita
                  </span>
                </div>

                {/* 1:1 Square Photo Container */}
                <div className="relative aspect-square w-full bg-[#F8F5F0] dark:bg-[#12100E] overflow-hidden border border-[#E7DED5]/90 dark:border-[#332B25]/90 rounded-[1px] shrink-0">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#2F2926]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="p-2 rounded-full bg-[#FFFCF8]/95 text-[#2F2926] shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                      <Maximize2 className="size-3.5 sm:size-4" />
                    </span>
                  </div>

                  {/* Hover Download Button */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDownloadDemoPhoto(photo, e)}
                      className="size-7 bg-[#FFFCF8]/90 dark:bg-[#1A1715]/90 hover:bg-[#FFFCF8] dark:hover:bg-[#25211E] text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] rounded-xs shadow-xs"
                      title="Download photograph"
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Polaroid Bottom Note Area */}
                <div className="pt-2.5 sm:pt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-serif">
                    <span className="font-medium text-[#2F2926] dark:text-[#F5EFEB] truncate pr-2">
                      {photo.fromName}
                    </span>
                    <span className="text-[10px] text-[#7A7069] dark:text-[#A89F97] font-mono shrink-0">
                      {photo.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7A7069] dark:text-[#A89F97] font-serif italic line-clamp-2 leading-relaxed">
                    "{photo.wishes}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          FULLSCREEN EDITORIAL LIGHTBOX DIALOG
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onOpenChange={(open) => !open && setSelectedPhotoIndex(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl p-0 overflow-hidden bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-lg shadow-2xl font-sans"
        >
          {activePhoto && (
            <div className="flex flex-col md:flex-row max-h-[85vh] overflow-hidden">
              {/* Image Viewport */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[340px] sm:min-h-[460px]">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.title}
                  className="max-h-[85vh] w-auto max-w-full object-contain select-none"
                />

                {/* Lightbox Navigation Buttons */}
                {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Previous photo (Left Arrow)"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                )}

                {selectedPhotoIndex !== null &&
                  selectedPhotoIndex < STATIC_DEMO_PHOTOS.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Next photo (Right Arrow)"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  )}

                {/* Close Button on image for mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="md:hidden absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Sidebar Metadata & Guest Note */}
              <div className="w-full md:w-80 p-5 sm:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715]">
                <div className="space-y-4">
                  {/* Top Bar with Close button */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7DED5]/60 dark:border-[#332B25]/60">
                    <span className="text-[10px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97] font-medium">
                      Photo {(selectedPhotoIndex ?? 0) + 1} of {STATIC_DEMO_PHOTOS.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPhotoIndex(null)}
                      className="hidden md:flex size-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground items-center justify-center cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Couple & Wedding Context */}
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#A67C6B] font-semibold block">
                      Tewkesbury & Enola
                    </span>
                    <DialogTitle className="font-serif text-2xl text-[#2F2926] dark:text-[#F5EFEB] font-normal mt-0.5">
                      {activePhoto.title}
                    </DialogTitle>
                    <p className="text-xs text-[#7A7069] dark:text-[#A89F97] font-mono mt-1">
                      Saturday, October 31, 2026 &bull; {activePhoto.time}
                    </p>
                  </div>

                  {/* Guest Wish Card */}
                  <div className="p-3.5 rounded-lg bg-[#F8F5F0] dark:bg-[#12100E] border border-[#E7DED5] dark:border-[#332B25] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-serif font-medium text-[#2F2926] dark:text-[#F5EFEB]">
                      <Heart className="size-3 text-[#A67C6B]" />
                      <span>{activePhoto.fromName}</span>
                    </div>
                    <DialogDescription className="text-xs text-[#7A7069] dark:text-[#A89F97] font-serif italic leading-relaxed">
                      "{activePhoto.wishes}"
                    </DialogDescription>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => handleDownloadDemoPhoto(activePhoto)}
                    className="w-full bg-[#2F2926] dark:bg-[#F5EFEB] text-[#F8F5F0] dark:text-[#12100E] hover:bg-[#4A3728] text-xs uppercase tracking-wider font-medium rounded-xs gap-2"
                  >
                    <Download className="size-3.5" />
                    <span>Download Photograph</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPhotoIndex(null);
                      setIsPricingModalOpen(true);
                    }}
                    className="w-full border-[#E7DED5] dark:border-[#332B25] text-xs uppercase tracking-wider rounded-xs cursor-pointer"
                  >
                    <span>Book Now</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          UPLOAD SIMULATION / INFO DIALOG
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isUploadDemoOpen} onOpenChange={setIsUploadDemoOpen}>
        <DialogContent className="max-w-md p-6 bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-xl font-sans">
          <div className="space-y-4">
            <div className="size-10 rounded-full bg-[#A67C6B]/15 text-[#A67C6B] flex items-center justify-center">
              <Camera className="size-5" />
            </div>

            <div>
              <DialogTitle className="font-serif text-2xl text-[#2F2926] dark:text-[#F5EFEB] font-normal">
                Guest Upload Experience
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7A7069] dark:text-[#A89F97] mt-1 leading-relaxed">
                In a live wedding gallery, your guests participate seamlessly without downloading any apps:
              </DialogDescription>
            </div>

            <div className="space-y-2.5 text-xs text-foreground/90 py-1">
              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                  1
                </div>
                <div>
                  <strong className="block text-foreground">Scan Table QR Card</strong>
                  <span className="text-[#7A7069] dark:text-[#A89F97]">
                    Guests point their phone camera at the physical table tent or acrylic stand.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                  2
                </div>
                <div>
                  <strong className="block text-foreground">Snap with Custom Frame</strong>
                  <span className="text-[#7A7069] dark:text-[#A89F97]">
                    Guests take selfies stamped with your wedding names and custom digital frame.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px]">
                  3
                </div>
                <div>
                  <strong className="block text-foreground">Live Streaming to Ballroom Screen</strong>
                  <span className="text-[#7A7069] dark:text-[#A89F97]">
                    Photos stream in real-time to your ballroom projector and cloud archive.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                onClick={() => {
                  setIsUploadDemoOpen(false);
                  setIsPricingModalOpen(true);
                }}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 text-xs uppercase tracking-wider font-medium cursor-pointer"
              >
                <span>Book Now</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsUploadDemoOpen(false)}
                className="text-xs uppercase tracking-wider border-[#E7DED5] dark:border-[#332B25]"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          DEMO INFO MODAL
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-md p-6 bg-[#FFFCF8] dark:bg-[#1A1715] border border-[#E7DED5] dark:border-[#332B25] rounded-xl font-sans">
          <div className="space-y-4">
            <div className="size-10 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Info className="size-5" />
            </div>

            <div>
              <DialogTitle className="font-serif text-2xl text-[#2F2926] dark:text-[#F5EFEB] font-normal">
                About This Live Demo
              </DialogTitle>
              <DialogDescription className="text-xs text-[#7A7069] dark:text-[#A89F97] mt-1.5 leading-relaxed">
                This page is an interactive live demo showcasing the static archive of <strong>Tewkesbury & Enola</strong>.
              </DialogDescription>
            </div>

            <p className="text-xs text-[#7A7069] dark:text-[#A89F97] leading-relaxed">
              When couples subscribe to Fotokita, they receive:
            </p>

            <ul className="space-y-2 text-xs text-foreground/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent shrink-0" />
                <span>Custom wedding URL slug (e.g., fotokita.my/your-names)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent shrink-0" />
                <span>Couple name & date customization in 3D animated hero</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent shrink-0" />
                <span>Zero-app guest upload with handwritten signature stamps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent shrink-0" />
                <span>Ballroom screen projector slideshow feed</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent shrink-0" />
                <span>1-Click bulk high-definition original download</span>
              </li>
            </ul>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setIsInfoModalOpen(false);
                  setIsPricingModalOpen(true);
                }}
                className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs uppercase tracking-wider font-medium cursor-pointer"
              >
                <span>Book Now &rarr;</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          EDITORIAL FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] py-8 px-6 text-center text-xs text-[#7A7069] dark:text-[#A89F97] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-serif italic text-sm text-[#2F2926] dark:text-[#F5EFEB]">
            Fotokita — Preserving timeless wedding memories
          </p>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest">
            <span>Showcase: Tewkesbury & Enola</span>
            <span className="w-1 h-1 rounded-full bg-[#A67C6B]" />
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="text-[#A67C6B] hover:underline font-semibold cursor-pointer"
            >
              Pricing & Booking
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
