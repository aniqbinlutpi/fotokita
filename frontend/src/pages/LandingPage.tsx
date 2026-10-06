import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  QrCode,
  Tv,
  Cloud,
  Check,
  ChevronDown,
  Smartphone,
  Eye,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogIn,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { WhatsAppInquiryModal } from "@/components/pricing/WhatsAppInquiryModal";
import { SubAdminLoginModal } from "@/components/tenant/SubAdminLoginModal";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { WobbleCard } from "@/components/ui/wobble-card";
import { Shdr12 } from "@/components/ui/shdr-12";
import { PRICING_PLANS } from "@/data/pricingPlans";
import imgExpand from "@/assets/images/img-expand.png";

const warmGoldBrickColors = {
  brickA: "#1F1712",
  brickB: "#4A3728",
  brickC: "#8C6D48",
  brickD: "#C9AA7C",
  brickE: "#F5EADB",
};

interface LandingPageProps {
  onNavigateToGallery?: () => void;
  onNavigateToDemo?: () => void;
  onNavigateToRegister?: (plan?: "standard" | "premium") => void;
  onNavigateToSubAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToGallery,
  onNavigateToDemo,
  onNavigateToSubAdmin,
}) => {
  // Sub-Admin Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // WhatsApp Deals Modal State
  const [selectedPlanForWhatsApp, setSelectedPlanForWhatsApp] = useState<{
    id: string;
    name: string;
    price: string;
    code: string;
  } | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const handleOpenWhatsAppDeal = (plan: { id: string; name: string; price: string; code: string }) => {
    setSelectedPlanForWhatsApp(plan);
    setIsWhatsAppModalOpen(true);
  };

  // Pricing Carousel State & Ref
  const pricingCarouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activePlanIndex, setActivePlanIndex] = useState(1); // default to '1day' popular

  const checkPricingScroll = () => {
    if (!pricingCarouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = pricingCarouselRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < maxScrollLeft - 15);

    if (maxScrollLeft <= 0) {
      setActivePlanIndex(0);
      return;
    }

    const progress = scrollLeft / maxScrollLeft;
    const targetIndex = Math.round(progress * (PRICING_PLANS.length - 1));
    setActivePlanIndex(Math.min(Math.max(0, targetIndex), PRICING_PLANS.length - 1));
  };

  useEffect(() => {
    const el = pricingCarouselRef.current;
    if (!el) return;
    checkPricingScroll();
    el.addEventListener("scroll", checkPricingScroll, { passive: true });
    window.addEventListener("resize", checkPricingScroll);
    return () => {
      el.removeEventListener("scroll", checkPricingScroll);
      window.removeEventListener("resize", checkPricingScroll);
    };
  }, []);

  const scrollToPlanIndex = (index: number) => {
    if (!pricingCarouselRef.current) return;
    const { scrollWidth, clientWidth } = pricingCarouselRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;
    if (maxScrollLeft <= 0) return;

    let targetLeft = 0;
    if (index === 0) {
      targetLeft = 0;
    } else if (index === PRICING_PLANS.length - 1) {
      targetLeft = maxScrollLeft;
    } else {
      targetLeft = (maxScrollLeft / (PRICING_PLANS.length - 1)) * index;
    }

    pricingCarouselRef.current.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
    setActivePlanIndex(index);
  };

  const scrollPricing = (direction: "left" | "right") => {
    if (!pricingCarouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = pricingCarouselRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;
    if (maxScrollLeft <= 0) return;

    const progress = scrollLeft / maxScrollLeft;
    const currentIndex = Math.round(progress * (PRICING_PLANS.length - 1));
    const nextIndex =
      direction === "left"
        ? Math.max(0, currentIndex - 1)
        : Math.min(PRICING_PLANS.length - 1, currentIndex + 1);

    scrollToPlanIndex(nextIndex);
  };

  // Sticky header scroll elevation state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenDemo = (e?: React.MouseEvent) => {
    if (onNavigateToDemo) {
      e?.preventDefault();
      onNavigateToDemo();
    } else if (onNavigateToGallery) {
      e?.preventDefault();
      onNavigateToGallery();
    } else {
      e?.preventDefault();
      const demoUrl = new URL(window.location.origin + window.location.pathname);
      demoUrl.searchParams.set("page", "demo");
      window.open(demoUrl.toString(), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans transition-colors duration-300 selection:bg-accent/20 selection:text-foreground overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────
          WARM AMBIENT WEDDING BACKGROUND WITH REAL PHOTO TEXTURE
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Subtle, soft wedding photo background overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.035] dark:opacity-[0.06] grayscale contrast-125 transition-opacity"
          style={{ backgroundImage: `url(${imgExpand})` }}
        />

        {/* Warm Ambient Radial Gradients */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] bg-gradient-to-b from-accent/18 via-accent/6 to-transparent rounded-full blur-3xl opacity-75" />
        <div className="absolute top-[35%] -right-32 w-80 h-80 bg-accent/10 rounded-full blur-[110px] opacity-60" />
        <div className="absolute top-[70%] -left-32 w-80 h-80 bg-accent/8 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10">
        {/* ─────────────────────────────────────────────────────────────
            HEADER / NAVIGATION
        ───────────────────────────────────────────────────────────── */}
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-background/85 backdrop-blur-xl border-b border-border/70 shadow-xs"
              : "bg-background/60 backdrop-blur-md border-b border-border/40"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <a href="#" className="flex items-center group">
              <FotokitaLogo variant="full" size="md" />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-7 text-xs uppercase tracking-widest font-medium text-muted-foreground">
              <a href="#experience" className="hover:text-foreground transition-colors py-1">
                Experience
              </a>
              <a href="#why-fotokita" className="hover:text-foreground transition-colors py-1">
                Why FotoKita
              </a>
              <a href="#pricing" className="hover:text-foreground transition-colors py-1">
                Packages
              </a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <AnimatedThemeToggler
                variant="circle"
                duration={400}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted/50 cursor-pointer"
                title="Toggle theme"
              />

              <a
                href="?page=demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDemo}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium cursor-pointer border border-border/80 hover:border-accent hover:bg-accent/10 text-foreground transition-colors select-none"
              >
                <Eye className="text-accent size-3.5" />
                <span>Live Demo</span>
              </a>

              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (onNavigateToSubAdmin) {
                    onNavigateToSubAdmin();
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="cursor-pointer shadow-xs hover:shadow transition-all bg-foreground text-background hover:bg-foreground/90 font-medium gap-1.5 text-xs h-8 px-3.5"
              >
                <span>Login</span>
                <LogIn className="size-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            1. MINIMAL HERO WITH 3D WEDDING SHADER ORB
        ───────────────────────────────────────────────────────────── */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Pill Badge with 3D Orb Sparkle */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center mb-6"
            >
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-[11px] uppercase tracking-widest gap-2 bg-card/70 backdrop-blur-xs border-border/70 text-muted-foreground font-normal shadow-2xs"
              >
                <Sparkles className="size-3.5 text-accent animate-pulse" />
                <span>Live Wedding Photobooth & Ballroom Gallery</span>
              </Badge>
            </motion.div>

            {/* Editorial Headline with Embedded 3D Shader Orb */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative max-w-3xl mx-auto"
            >
              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight text-foreground font-normal leading-[1.1] relative z-10">
                Every candid moment,{" "}
                <span className="italic text-accent underline decoration-accent/30 decoration-1 underline-offset-8">
                  streamed live
                </span>{" "}
                from your guests.
              </h1>

              {/* 3D Wedding Shader Orb Ambient Accents */}
              <div className="hidden sm:block absolute -top-8 -right-8 pointer-events-none opacity-85">
                <Shdr12
                  size={95}
                  state="idle"
                  params={{
                    spin: 0.28,
                    tilt: 0.45,
                    studs: 20,
                    gloss: 2.2,
                    gap: 0.03,
                    patch: 0.6,
                    gain: 1.1,
                    radius: 0.92,
                    contrast: 1.05,
                  }}
                  colors={warmGoldBrickColors}
                  stateColors={{
                    idle: warmGoldBrickColors,
                    thinking: warmGoldBrickColors,
                    speaking: warmGoldBrickColors,
                  }}
                  wrapper="none"
                  paused={false}
                  pauseOffscreen
                  maxDpr={1.5}
                  ariaLabel="FotoKita 3D Wedding Shader Orb"
                />
              </div>
            </motion.div>

            {/* Concise Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto"
            >
              No apps to download. Guests scan a table QR code to snap selfies with your custom frame.
              Photos project instantly on venue screens and save in full resolution.
            </motion.p>

            {/* Clear Primary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >
              <a
                href="#pricing"
                className="w-full sm:w-auto h-11 px-7 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer bg-foreground text-background hover:bg-foreground/90 transition-all inline-flex items-center justify-center gap-2 shadow-sm select-none"
              >
                <span>View Packages</span>
                <ChevronDown className="size-3.5" />
              </a>

              <a
                href="?page=demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDemo}
                className="w-full sm:w-auto h-11 px-7 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer bg-card border border-border/80 hover:border-accent hover:bg-card/90 transition-all inline-flex items-center justify-center gap-2 text-foreground select-none"
              >
                <Eye className="text-accent size-4" />
                <span>Explore Live Demo</span>
              </a>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-14 pt-8 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
            >
              <div className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                <span>Zero app installs</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                <span>Original camera resolution</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                <span>Real-time ballroom projection</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" />
                <span>1-Click Bulk ZIP download</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2. PRODUCT EXPERIENCE SHOWCASE (WOBBLE CARDS BENTO WITH REAL PHOTO MOCKUPS)
        ───────────────────────────────────────────────────────────── */}
        <section id="experience" className="py-20 sm:py-28 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-[11px] uppercase tracking-widest text-accent border-accent/30 font-normal">
                How It Works
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                The Guest-to-Screen Journey
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Move your cursor across the cards to experience each celebration touchpoint.
              </p>
            </div>

            {/* Asymmetric Bento Grid using WobbleCard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Card 1: Live Ballroom Screen (Col span 7) */}
              <div className="lg:col-span-7">
                <WobbleCard containerClassName="h-full bg-card/85 border-border/70 hover:border-accent/40 shadow-xs">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                          <Tv className="size-4.5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider text-accent border-accent/30">
                          HDMI Plug & Play
                        </Badge>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                        Live Ballroom Screen & Projectors
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
                        Plug any laptop into your venue screen via HDMI. Guest photos cycle smoothly in real-time, making the entire ballroom light up with laughter and spontaneous reactions.
                      </p>
                    </div>

                    {/* Interactive Visual Projection Mockup with Authentic Wedding Photos */}
                    <div className="mt-6 rounded-xl border border-border/80 bg-background/90 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-medium text-foreground">Ballroom Slideshow</span>
                        </div>
                        <span className="font-mono text-[10px]">Auto-syncs every 5s</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="aspect-4/3 rounded-lg overflow-hidden border border-border/60 relative group/photo shadow-2xs">
                          <img
                            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                            alt="The Grand Entrance"
                            className="size-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 text-[9px] text-white font-serif">
                            Grand Entrance
                          </div>
                        </div>

                        <div className="aspect-4/3 rounded-lg overflow-hidden border-2 border-accent shadow-xs relative group/photo">
                          <img
                            src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80"
                            alt="Table 4 Selfies"
                            className="size-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 text-[9px] text-amber-200 font-serif font-medium">
                            Table 4 Moments
                          </div>
                        </div>

                        <div className="aspect-4/3 rounded-lg overflow-hidden border border-border/60 relative group/photo shadow-2xs">
                          <img
                            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
                            alt="Bouquet Toss"
                            className="size-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 text-[9px] text-white font-serif">
                            Bouquet Cheers
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </WobbleCard>
              </div>

              {/* Card 2: Table QR Stand (Col span 5) */}
              <div className="lg:col-span-5">
                <WobbleCard containerClassName="h-full bg-card/85 border-border/70 hover:border-accent/40 shadow-xs">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                          <QrCode className="size-4.5" />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">0 App Downloads</span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                        Printable Table QR Cards
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                        Ready-to-print A6 templates for every guest table. Even tech-shy relatives can point their phone camera and upload in 2 seconds.
                      </p>
                    </div>

                    {/* QR Standee Mini Preview */}
                    <div className="mt-6 rounded-xl border border-border/80 bg-background/90 p-4 text-center shadow-sm">
                      <div className="size-16 mx-auto bg-foreground/5 rounded-lg border border-dashed border-border flex items-center justify-center mb-2">
                        <QrCode className="size-10 text-foreground/80" />
                      </div>
                      <span className="text-[11px] font-serif text-foreground font-medium block">
                        Scan to snap & see on screen
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        fotokita.com/your-wedding
                      </span>
                    </div>
                  </div>
                </WobbleCard>
              </div>

              {/* Card 3: Digital Polaroid Frames (Col span 5) */}
              <div className="lg:col-span-5">
                <WobbleCard containerClassName="h-full bg-card/85 border-border/70 hover:border-accent/40 shadow-xs">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                          <Smartphone className="size-4.5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] text-accent border-accent/30 font-normal">
                          Personalized
                        </Badge>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                        Custom Polaroid Frames
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                        Every upload is stamped with your couple monogram, date, and heartfelt guest wishes as an instant digital keepsake.
                      </p>
                    </div>

                    {/* Authentic Polaroid Mockup */}
                    <div className="mt-6 rounded-xl border border-border/80 bg-background/90 p-3 shadow-sm text-center">
                      <div className="aspect-16/10 rounded-lg overflow-hidden border border-border/40 relative mb-2.5">
                        <img
                          src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80"
                          alt="First Dance Under the Chandelier"
                          className="size-full object-cover"
                        />
                      </div>
                      <span className="font-serif italic text-sm text-foreground block">
                        Farhan & Dania
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Digital Guestbook &bull; 2026
                      </span>
                    </div>
                  </div>
                </WobbleCard>
              </div>

              {/* Card 4: High-Res Vault & Bulk ZIP (Col span 7) */}
              <div className="lg:col-span-7">
                <WobbleCard containerClassName="h-full bg-card/85 border-border/70 hover:border-accent/40 shadow-xs">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="size-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                          <Cloud className="size-4.5" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="size-3.5 text-accent" />
                          <span>Private Couple PIN</span>
                        </div>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                        Original Sensor Resolution & Bulk ZIP
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
                        Zero compression. Every uncompressed photo is stored securely in private cloud storage. When the reception ends, download all files in a single ZIP for your album.
                      </p>
                    </div>

                    {/* Download Archive Bar with Photo Preview Strip */}
                    <div className="mt-6 rounded-xl border border-border/80 bg-background/90 p-3.5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                          <Download className="size-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-medium text-foreground block">
                            Full Resolution Archive
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            1-Click Download &bull; High-Definition
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Ready Midnight
                      </Badge>
                    </div>
                  </div>
                </WobbleCard>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. WHY FOTOKITA (CLEAN 3-COLUMN CONTRAST)
        ───────────────────────────────────────────────────────────── */}
        <section id="why-fotokita" className="py-20 bg-card/30 border-y border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <Badge variant="outline" className="mb-2 text-[11px] uppercase tracking-widest text-accent border-accent/30 font-normal">
                Comparison
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Why Couples Choose FotoKita
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Collecting wedding photos is usually messy and fragmented. We make it effortless.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* WhatsApp */}
              <div className="p-6 rounded-2xl bg-background/70 border border-border/70 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg text-foreground font-medium mb-1">
                    WhatsApp Groups
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    The chaotic default.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>Heavy compression damages photo clarity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>Clutters everyone&apos;s phone storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>Requires chasing guests for weeks</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-6 pt-3 border-t border-border/50 text-[11px] text-muted-foreground/80 italic">
                  Most photos get lost or never sent.
                </p>
              </div>

              {/* Google Drive */}
              <div className="p-6 rounded-2xl bg-background/70 border border-border/70 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg text-foreground font-medium mb-1">
                    Google Drive Links
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    High friction for guests.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>Requires account sign-in & folder permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>Elderly relatives get confused or give up</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground/60">&times;</span>
                      <span>No fun live screen interaction</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-6 pt-3 border-t border-border/50 text-[11px] text-muted-foreground/80 italic">
                  Only a few tech-savvy friends participate.
                </p>
              </div>

              {/* FotoKita */}
              <div className="p-6 rounded-2xl bg-card border-2 border-accent/80 flex flex-col justify-between shadow-md relative">
                <div className="absolute -top-3 left-6 bg-accent text-accent-foreground text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
                  Seamless
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground font-semibold mb-1">
                    FotoKita
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Instant, joyful guest experience.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-2.5 text-xs text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <span><strong>Instant Camera</strong>: 2 seconds to open & snap</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <span><strong>Original HD</strong>: Full sensor quality preserved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <span><strong>Live Joy</strong>: Streams immediately to ballroom screen</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-6 pt-3 border-t border-accent/20 text-[11px] text-accent font-medium">
                  Hundreds of spontaneous memories captured.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. EVENT PACKAGES & PRICING
        ───────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 max-w-5xl mx-auto">
              <div>
                <Badge variant="outline" className="mb-2 text-[11px] uppercase tracking-widest text-accent border-accent/30 font-normal">
                  Transparent Pricing
                </Badge>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                  Simple Event Packages
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Pick the duration that fits your celebration. Zero recurring subscription traps.
                </p>
              </div>

              {/* Scroll Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollPricing("left")}
                  disabled={!canScrollLeft}
                  className="size-8 rounded-full border border-border/80 cursor-pointer disabled:opacity-30"
                  aria-label="Previous plan"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollPricing("right")}
                  disabled={!canScrollRight}
                  className="size-8 rounded-full border border-border/80 cursor-pointer disabled:opacity-30"
                  aria-label="Next plan"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Carousel Container */}
            <div className="relative max-w-6xl mx-auto">
              <div
                ref={pricingCarouselRef}
                className="flex gap-5 overflow-x-auto pb-4 pt-3 px-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {PRICING_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className="w-[280px] sm:w-[320px] shrink-0 snap-center flex flex-col"
                  >
                    <Card
                      className={`h-full p-6 flex flex-col justify-between transition-all duration-200 ${
                        plan.isPopular
                          ? "bg-card border-2 border-accent shadow-lg"
                          : plan.isSpecialPartner
                          ? "bg-card border-border/90 hover:border-accent"
                          : "bg-background/80 border-border/80 hover:border-accent/40"
                      }`}
                    >
                      <div>
                        {plan.isPopular && (
                          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-accent mb-2">
                            <Sparkles className="size-3" />
                            <span>Most Popular</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground uppercase font-mono mb-1">
                          {plan.badge}
                        </div>
                        <CardTitle className="font-serif text-2xl text-foreground font-normal">
                          {plan.name}
                        </CardTitle>
                        <div className="flex items-baseline gap-1 mt-2 mb-3">
                          <span className="text-3xl font-semibold text-foreground">
                            {plan.price}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {plan.duration}
                          </span>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mb-5 min-h-[36px] leading-relaxed">
                          {plan.description}
                        </CardDescription>

                        <Separator className="mb-4" />

                        <ul className="space-y-2.5 text-xs text-muted-foreground">
                          {plan.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className={`flex items-center gap-2 ${
                                feat.highlight ? "text-foreground font-medium" : ""
                              }`}
                            >
                              <Check className="size-3.5 text-accent shrink-0" />
                              <span>{feat.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 pt-2">
                        <Button
                          size="sm"
                          variant={plan.isPopular ? "default" : "outline"}
                          className={`w-full text-xs uppercase tracking-wider font-semibold cursor-pointer ${
                            plan.isPopular
                              ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-xs"
                              : "hover:border-accent hover:text-accent"
                          }`}
                          onClick={() =>
                            handleOpenWhatsAppDeal({
                              id: plan.id,
                              name: `${plan.name} (${plan.price})`,
                              price: plan.price,
                              code: plan.code,
                            })
                          }
                        >
                          <span>Select Package</span>
                          <ArrowUpRight className="size-3.5 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {PRICING_PLANS.map((plan, idx) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => scrollToPlanIndex(idx)}
                    aria-label={`View ${plan.name}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activePlanIndex === idx
                        ? "w-6 h-2 bg-accent"
                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            5. CLEAN FINAL CTA
        ───────────────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-24 bg-card/60 border-t border-border/70 text-center relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <h2 className="font-serif text-3xl sm:text-5xl text-foreground font-normal leading-tight">
              Ready to bring your wedding gallery to life?
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Give your guests the easiest way to share their perspective, and preserve memories that last forever.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#pricing"
                className="w-full sm:w-auto h-11 px-7 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer bg-foreground text-background hover:bg-foreground/90 transition-all inline-flex items-center justify-center gap-2 shadow-xs select-none"
              >
                <span>Get Started</span>
                <ArrowUpRight className="size-3.5" />
              </a>

              <a
                href="?page=demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDemo}
                className="w-full sm:w-auto h-11 px-7 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer bg-background border border-border/80 hover:border-accent transition-all inline-flex items-center justify-center gap-2 text-foreground select-none"
              >
                <Eye className="text-accent size-4" />
                <span>Try Demo Gallery</span>
              </a>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            MINIMAL FOOTER
        ───────────────────────────────────────────────────────────── */}
        <footer className="border-t border-border/60 py-10 px-4 sm:px-6 text-xs text-muted-foreground">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <FotokitaLogo variant="full" size="sm" />
            </div>

            <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider">
              <a href="#experience" className="hover:text-foreground transition-colors">
                Experience
              </a>
              <a href="#why-fotokita" className="hover:text-foreground transition-colors">
                Why FotoKita
              </a>
              <a href="#pricing" className="hover:text-foreground transition-colors">
                Packages
              </a>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToSubAdmin) {
                    onNavigateToSubAdmin();
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="text-accent font-medium hover:underline cursor-pointer"
              >
                Sub-Admin Login
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground">
              &copy; {new Date().getFullYear()} FotoKita. Timeless wedding galleries.
            </div>
          </div>
        </footer>
      </div>

      {/* WhatsApp Deals Inquiry Modal */}
      <WhatsAppInquiryModal
        isOpen={isWhatsAppModalOpen}
        onOpenChange={setIsWhatsAppModalOpen}
        plan={selectedPlanForWhatsApp}
        onNavigateToSubAdmin={() => {
          if (onNavigateToSubAdmin) {
            onNavigateToSubAdmin();
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

      {/* Sub-Admin Login Modal */}
      <SubAdminLoginModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onSuccess={() => {
          if (onNavigateToSubAdmin) {
            onNavigateToSubAdmin();
          } else {
            window.location.href = "/subadmin";
          }
        }}
      />
    </div>
  );
};
