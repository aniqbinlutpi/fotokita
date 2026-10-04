import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Camera,
  QrCode,
  Tv,
  Cloud,
  ShieldCheck,
  Star,
  Download,
  CheckCircle2,
  ArrowRight,
  Send,
  Users,
  Check,
  ChevronDown,
  Smartphone,
  Heart,
  Eye,
  Lock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { WhatsAppInquiryModal } from "@/components/pricing/WhatsAppInquiryModal";
import { SubAdminLoginModal } from "@/components/tenant/SubAdminLoginModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface LandingPageProps {
  onNavigateToGallery?: () => void;
  onNavigateToDemo?: () => void;
  onNavigateToRegister?: (plan?: "standard" | "premium") => void;
  onNavigateToSubAdmin?: () => void;
}

interface FeedbackItem {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
}

const INITIAL_FEEDBACKS: FeedbackItem[] = [
  {
    id: "fb-1",
    name: "Afiq & Wieam",
    role: "Newlyweds",
    location: "Shah Alam, Selangor",
    rating: 5,
    comment:
      "Our guests had an absolute blast! Everyone competed to upload photos just to see their candid selfies live on the grand ballroom LED wall. We captured hundreds of authentic moments our official photographer couldn't possibly be around to catch.",
    date: "December 2025 Wedding",
  },
  {
    id: "fb-2",
    name: "Farhan & Dania",
    role: "Newlyweds",
    location: "Kuala Lumpur",
    rating: 5,
    comment:
      "No more begging friends for photos in messy WhatsApp groups where quality gets compressed and blurry. Every single photograph in Fotokita stays crystal-clear in full HD resolution. Worth every penny!",
    date: "January 2026 Wedding",
  },
  {
    id: "fb-3",
    name: "Hakim Studio",
    role: "Official Wedding Photographer",
    location: "Penang & KL",
    rating: 5,
    comment:
      "As a professional wedding photographer, Fotokita is my favorite partner. I focus on formal portraits and ceremony milestones, while Fotokita gathers all the spontaneous guest laughter and dining table memories.",
    date: "Creative Partner",
  },
  {
    id: "fb-4",
    name: "Nurul & Syamil",
    role: "Newlyweds",
    location: "Johor Bahru",
    rating: 5,
    comment:
      "Amazingly easy for our elderly relatives. Aunts and uncles simply scanned the table QR code and uploaded photos instantly without installing any app. Truly elevated our wedding reception!",
    date: "February 2026 Wedding",
  },
];

interface PricingPlanItem {
  id: string;
  name: string;
  badge: string;
  price: string;
  duration: string;
  description: string;
  features: { text: string; highlight?: boolean }[];
  isPopular?: boolean;
  isSpecialPartner?: boolean;
  code: string;
}

const PRICING_PLANS: PricingPlanItem[] = [
  {
    id: "12h",
    name: "12 Hours Pass",
    badge: "12 Hours • Short Session",
    price: "RM 6",
    duration: "/ 12 hours",
    description: "Ideal for solemnization (nikah), engagement ceremonies, or brief receptions.",
    code: "12 Hours (RM6)",
    features: [
      { text: "1 GB Cloud Storage (~300 photos)" },
      { text: "Live Table QR code guest standees" },
      { text: "Instant upload with zero app downloads" },
      { text: "12 hours active live gallery access" },
    ],
  },
  {
    id: "1day",
    name: "Whole Day Pass",
    badge: "Whole Day • 24 Hours",
    isPopular: true,
    price: "RM 10",
    duration: "/ 24 hours",
    description: "Most popular choice for full-day wedding celebrations (day & evening).",
    code: "Whole Day (RM10)",
    features: [
      { text: "5 GB Cloud Storage (~1,500 HD photos)", highlight: true },
      { text: "Custom URL (fotokita.com/your-name)" },
      { text: "Live Ballroom Screen & Projector Slideshow", highlight: true },
      { text: "Digital Photobooth & Signature Polaroid" },
      { text: "Print-ready table QR card templates" },
      { text: "1-Click Bulk High-Res ZIP Download" },
      { text: "24 hours full gallery access" },
    ],
  },
  {
    id: "3days",
    name: "3 Days Pass",
    badge: "3 Days • Weekend Pass",
    price: "RM 17",
    duration: "/ 3 days",
    description: "Perfect for multi-day events: henna night, Friday solemnization & Sunday banquet.",
    code: "3 Days (RM17)",
    features: [
      { text: "10 GB Cloud Storage (~3,000 HD photos)", highlight: true },
      { text: "Everything in Whole Day Pass included" },
      { text: "Live Projector & TV Ballroom Slideshow" },
      { text: "Digital Photobooth & Polaroid Frames" },
      { text: "3 days active upload & viewing access" },
    ],
  },
  {
    id: "1week",
    name: "1 Week Pass",
    badge: "1 Week • Best Value",
    price: "RM 23",
    duration: "/ 7 days",
    description: "A full week of leisurely celebration with extended family across both venues.",
    code: "1 Week (RM23)",
    features: [
      { text: "15 GB Large Storage (~5,000 photos & clips)", highlight: true },
      { text: "Everything in 3 Days Pass included" },
      { text: "Short guest video clip uploads" },
      { text: "7 days active upload & download access" },
      { text: "Print-ready A6 PDF table card templates" },
    ],
  },
  {
    id: "1month",
    name: "1 Month Pass",
    badge: "1 Month • Extended Archive",
    price: "RM 46",
    duration: "/ month",
    description: "Relive and gather every guest memory with zero rush throughout the month.",
    code: "1 Month (RM46)",
    features: [
      { text: "30 GB Large Storage (~10,000 photos & videos)", highlight: true },
      { text: "Everything in 1 Week Pass included" },
      { text: "30 days complete upload & viewing access" },
      { text: "Uncompressed full HD photo quality" },
      { text: "Priority technical assistance & support" },
    ],
  },
  {
    id: "1year",
    name: "1 Year Special",
    badge: "Photographers & Hall Partners",
    isSpecialPartner: true,
    price: "RM 189",
    duration: "/ year",
    description: "Tailored for Photographers, Event Organizers, Wedding Planners & Banquet Hall Owners.",
    code: "1 Year Special (RM189)",
    features: [
      { text: "100 GB Massive Cloud Storage", highlight: true },
      { text: "Multi-event coverage throughout 1 full year" },
      { text: "Custom Branding (Your studio / hall name)" },
      { text: "4K video support & high-speed downloads" },
      { text: "VIP Priority WhatsApp Concierge Support" },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToGallery,
  onNavigateToDemo,
  onNavigateToRegister: _onNavigateToRegister,
  onNavigateToSubAdmin,
}) => {
  // Sub-Admin Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Interactive Product Simulator Active Tab
  const [activeStepTab, setActiveStepTab] = useState<
    "qr" | "guest" | "screen" | "vault"
  >("qr");

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
  const [activePlanIndex, setActivePlanIndex] = useState(0);

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

    // Edge check: start of carousel
    if (scrollLeft <= 20) {
      setActivePlanIndex(0);
      return;
    }

    // Edge check: end of carousel (card 6 / 1 Year Special)
    if (scrollLeft >= maxScrollLeft - 20) {
      setActivePlanIndex(PRICING_PLANS.length - 1);
      return;
    }

    // Accurate normalized progress mapping across all plan cards
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

  // Navigation Dropdown State (Hover expand)
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterNav = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setIsNavDropdownOpen(true);
  };

  const handleMouseLeaveNav = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsNavDropdownOpen(false);
    }, 150);
  };

  // Sticky header scroll elevation state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Feedback state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    try {
      const stored = localStorage.getItem("fotokita_community_feedbacks");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_FEEDBACKS];
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FEEDBACKS;
  });

  const [feedbackAuthor, setFeedbackAuthor] = useState("");
  const [feedbackRole, setFeedbackRole] = useState("Newlyweds");
  const [feedbackLocation, setFeedbackLocation] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState(false);

  // Email Newsletter state
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [isSubscribingEmail, setIsSubscribingEmail] = useState(false);
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackAuthor.trim() || !feedbackText.trim()) {
      toast.error("Please provide your name and your feedback message.");
      return;
    }

    setIsSubmittingFeedback(true);
    setTimeout(() => {
      const newFb: FeedbackItem = {
        id: `fb-user-${Date.now()}`,
        name: feedbackAuthor.trim(),
        role: feedbackRole,
        location: feedbackLocation.trim() || "Malaysia",
        rating: feedbackRating,
        comment: feedbackText.trim(),
        date: "Just now",
      };

      const updated = [newFb, ...feedbacks];
      setFeedbacks(updated);

      try {
        const userOnly = updated.filter((item) =>
          item.id.startsWith("fb-user-")
        );
        localStorage.setItem(
          "fotokita_community_feedbacks",
          JSON.stringify(userOnly)
        );
      } catch {
        // ignore
      }

      setIsSubmittingFeedback(false);
      setFeedbackSuccessNotice(true);
      setFeedbackAuthor("");
      setFeedbackLocation("");
      setFeedbackText("");
      toast.success("Thank you for your feedback!", {
        description:
          "Your testimonial has been published to the Fotokita community.",
      });
    }, 400);
  };

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail.trim() || !subscriberEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubscribingEmail(true);
    setTimeout(() => {
      try {
        const existingList = JSON.parse(
          localStorage.getItem("fotokita_newsletter_subscribers") || "[]"
        );
        existingList.push({
          email: subscriberEmail.trim(),
          subscribedAt: new Date().toISOString(),
        });
        localStorage.setItem(
          "fotokita_newsletter_subscribers",
          JSON.stringify(existingList)
        );
      } catch {
        // ignore
      }

      setIsSubscribingEmail(false);
      setEmailSubscribed(true);
      toast.success("Subscription confirmed!", {
        description:
          "Your 20% discount voucher and printable table QR guide have been sent to your email.",
      });
      setSubscriberEmail("");
    }, 400);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

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
    <div className="relative min-h-screen bg-background text-foreground selection:bg-accent/25 selection:text-foreground font-sans transition-colors duration-300 overflow-x-clip">
      {/* ─────────────────────────────────────────────────────────────
          ELEGANT SUITABLE WEDDING BACKGROUND:
          Layered ambient champagne & terracotta glows, soft radial vignette,
          and delicate micro-grid texture with edge falloff.
      ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Warm Radial Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] sm:w-[960px] h-[520px] bg-gradient-to-b from-accent/18 via-accent/6 to-transparent rounded-full blur-3xl opacity-80" />

        {/* Secondary gentle champagne light orb on right */}
        <div className="absolute top-[28%] -right-40 w-96 h-96 bg-accent/10 rounded-full blur-[110px] opacity-70" />

        {/* Third subtle glow on lower left */}
        <div className="absolute top-[65%] -left-36 w-88 h-88 bg-accent/8 rounded-full blur-[100px] opacity-60" />

        {/* Subtle Luxury Micro-dot Architectural Texture */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 70% at 50% 30%, black 40%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Top Announcement Bar */}
        <div className="bg-primary/95 text-primary-foreground py-2 px-4 text-center text-xs border-b border-border/40 backdrop-blur-sm flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="size-3.5 text-accent animate-pulse" />
            <span className="font-serif tracking-wider font-semibold">
              WEDDING SEASON 2026:
            </span>
          </span>
          <span className="text-primary-foreground/80 hidden sm:inline">
            Host your live wedding gallery with zero app installs & full HD resolution.
          </span>
          <a
            href="#pricing"
            className="underline font-semibold text-accent hover:text-primary-foreground transition-colors ml-1 cursor-pointer"
          >
            Book Now & View Pricing &rarr;
          </a>
        </div>

        {/* Navigation Bar - Sticky with dynamic frosted elevation */}
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-background/85 backdrop-blur-xl border-b border-border/80 shadow-xs"
              : "bg-background/75 backdrop-blur-md border-b border-border/60"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <a href="#" className="flex items-center gap-2.5 group">
                <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                  <Camera className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif tracking-widest text-xl font-normal uppercase text-foreground leading-none">
                    Fotokita
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-sans mt-0.5">
                    Live Wedding Gallery
                  </span>
                </div>
              </a>
            </div>

            {/* Desktop Navigation Links: 3 General Items with Hover Expand */}
            <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-wider font-medium text-muted-foreground">
              {/* Item 1: How It Works with Hover Expand Dropdown */}
              <div
                className="relative py-2"
                onMouseEnter={handleMouseEnterNav}
                onMouseLeave={handleMouseLeaveNav}
              >
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer select-none"
                >
                  <span>How It Works</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isNavDropdownOpen ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </a>

                {/* 2x2 Floating Expand Dropdown Card (Solid Opaque, 1-Line Detailed Descriptions) */}
                <AnimatePresence>
                  {isNavDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2.5 z-50 w-max max-w-[95vw]"
                    >
                      <div className="rounded-2xl bg-card border border-border shadow-2xl p-2.5 grid grid-cols-2 gap-2">
                        <a
                          href="#experience"
                          onClick={() => setIsNavDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl hover:bg-muted/60 transition-all group flex flex-col text-left"
                        >
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors normal-case whitespace-nowrap">
                            Live Simulator
                          </span>
                          <span className="text-[11px] text-muted-foreground normal-case font-normal leading-tight mt-1 whitespace-nowrap">
                            Interactive guest-to-screen flow
                          </span>
                        </a>

                        <a
                          href="#how-it-works"
                          onClick={() => setIsNavDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl hover:bg-muted/60 transition-all group flex flex-col text-left"
                        >
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors normal-case whitespace-nowrap">
                            Core Features
                          </span>
                          <span className="text-[11px] text-muted-foreground normal-case font-normal leading-tight mt-1 whitespace-nowrap">
                            Table QR, frames & projector feed
                          </span>
                        </a>

                        <a
                          href="#comparison"
                          onClick={() => setIsNavDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl hover:bg-muted/60 transition-all group flex flex-col text-left"
                        >
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors normal-case whitespace-nowrap">
                            Why Fotokita
                          </span>
                          <span className="text-[11px] text-muted-foreground normal-case font-normal leading-tight mt-1 whitespace-nowrap">
                            Zero-app vs WhatsApp & Drive
                          </span>
                        </a>

                        <a
                          href="#faq"
                          onClick={() => setIsNavDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl hover:bg-muted/60 transition-all group flex flex-col text-left"
                        >
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors normal-case whitespace-nowrap">
                            FAQ & Details
                          </span>
                          <span className="text-[11px] text-muted-foreground normal-case font-normal leading-tight mt-1 whitespace-nowrap">
                            AV setup, storage & resolution
                          </span>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Item 2: Pricing */}
              <a href="#pricing" className="hover:text-foreground transition-colors py-2">
                Pricing
              </a>

              {/* Item 3: Reviews */}
              <a href="#testimonials" className="hover:text-foreground transition-colors py-2">
                Reviews
              </a>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <AnimatedThemeToggler
                variant="circle"
                duration={400}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted/60 cursor-pointer"
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
                className="cursor-pointer shadow-sm hover:shadow transition-all bg-foreground text-background hover:bg-foreground/90 font-medium gap-1.5"
              >
                <span>Login</span>
                <LogIn className="size-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            HERO SECTION:
            Minimalist, high clarity, emotional editorial typography
        ───────────────────────────────────────────────────────────── */}
        <section className="relative pt-14 pb-20 sm:pt-24 sm:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 text-[11px] uppercase tracking-widest gap-2 bg-card/70 backdrop-blur-sm border-border/80 shadow-2xs font-normal"
              >
                <Sparkles className="size-3.5 text-accent" />
                <span>The Live Guest Photobooth & Ballroom Screen Gallery</span>
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight text-foreground font-normal leading-[1.1] max-w-4xl mx-auto"
            >
              Every candid angle of your wedding,{" "}
              <span className="italic font-normal text-accent underline decoration-accent/30 decoration-wavy decoration-1 underline-offset-8">
                streamed live
              </span>{" "}
              from your guests' phones.
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              Zero app downloadsaaaa. Guests simply scan a table QR code to snap selfies
              with your custom digital frame. Photos stream immediately to your
              ballroom screens and preserve in high-definition cloud storage.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >

              <a
                href="?page=demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDemo}
                className="w-full sm:w-auto h-12 px-7 rounded-xl text-xs uppercase tracking-widest font-semibold cursor-pointer bg-card/60 backdrop-blur-sm border border-border hover:border-accent hover:bg-card transition-all inline-flex items-center justify-center gap-2 text-foreground select-none"
              >
                <Eye className="text-accent size-4" />
                <span>Explore Live Demo</span>
              </a>
            </motion.div>

            {/* Key Trust Signals Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-14 pt-8 border-t border-border/70 grid grid-cols-2 md:grid-cols-4 gap-4 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  100% No App Download
                  <span className="block text-[11px] text-muted-foreground font-normal">
                    Native camera browser
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  Original HD Resolution
                  <span className="block text-[11px] text-muted-foreground font-normal">
                    Zero compression loss
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  Live Ballroom Screen
                  <span className="block text-[11px] text-muted-foreground font-normal">
                    Projector slideshow mode
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="size-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="text-xs font-medium text-foreground">
                  1-Click Bulk ZIP
                  <span className="block text-[11px] text-muted-foreground font-normal">
                    Ready by midnight
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            INTERACTIVE PRODUCT SIMULATOR (EXPERIENCE SECTION)
            Allows any user to instantly understand how Fotokita works
            by clicking between the 4 touchpoints.
        ───────────────────────────────────────────────────────────── */}
        <section id="experience" className="py-20 bg-card/50 border-y border-border/70 backdrop-blur-xs transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="accent" className="mb-2">
                Interactive Product Tour
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                How It Works from Table to Big Screen
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Click each stage below to explore the seamless guest journey and couple experience.
              </p>
            </div>

            {/* Interactive Tab Stepper Segmented Control */}
            <div className="max-w-3xl mx-auto mb-10">
              <div className="grid grid-cols-2 md:grid-cols-4 p-1.5 rounded-2xl bg-background/80 border border-border/80 backdrop-blur-md shadow-xs gap-1.5">
                {[
                  {
                    id: "qr",
                    step: "#1",
                    label: "Table QR",
                    icon: QrCode,
                  },
                  {
                    id: "guest",
                    step: "#2",
                    label: "Guest Snap",
                    icon: Smartphone,
                  },
                  {
                    id: "screen",
                    step: "#3",
                    label: "Live Screen",
                    icon: Tv,
                  },
                  {
                    id: "vault",
                    step: "#4",
                    label: "Cloud Vault",
                    icon: Cloud,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeStepTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveStepTab(
                          tab.id as "qr" | "guest" | "screen" | "vault"
                        )
                      }
                      className={`relative flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none text-left ${
                        isActive
                          ? "text-accent-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeStepIndicator"
                          className="absolute inset-0 bg-accent rounded-xl shadow-xs"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <span
                        className={`relative z-10 flex items-center justify-center size-7 rounded-lg shrink-0 transition-colors ${
                          isActive
                            ? "bg-accent-foreground/15 text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="relative z-10 min-w-0 flex flex-col leading-tight">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-mono ${
                            isActive
                              ? "text-accent-foreground/80"
                              : "text-muted-foreground/80"
                          }`}
                        >
                          Step {tab.step}
                        </span>
                        <span className="text-xs truncate font-medium">
                          {tab.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulator Viewport Container */}
            <div className="relative rounded-2xl border border-border/80 bg-background/90 p-4 sm:p-8 shadow-xl overflow-hidden min-h-[460px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {/* 1. TABLE QR VIEW */}
                {activeStepTab === "qr" && (
                  <motion.div
                    key="qr-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-5 space-y-4">
                      <Badge variant="outline" className="text-accent border-accent/30 gap-1 text-[11px]">
                        <QrCode className="size-3.5" />
                        Dining Table Touchpoint
                      </Badge>
                      <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal">
                        Print-Ready QR Cards For Every Dining Table
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We generate customized printable card templates matching your wedding theme.
                        Guests simply point their iPhone or Android camera at the stand — no app install,
                        no account registration, zero barrier to entry.
                      </p>
                      <ul className="space-y-2 text-xs text-foreground/90 pt-1">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>PDF templates ready for A6 acrylic stands & table tents</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Customized couple initials & wedding date stamped</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Works seamlessly for elderly relatives & tech-shy guests</span>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-7 flex justify-center">
                      {/* Physical Card Mockup */}
                      <div className="w-72 sm:w-80 rounded-2xl bg-card border-2 border-border p-6 shadow-2xl text-center space-y-4 relative">
                        <div className="size-2 rounded-full bg-accent mx-auto" />
                        <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground block">
                          Welcome to the Wedding of
                        </span>
                        <h4 className="font-serif text-2xl text-foreground font-normal">
                          Farhan & Dania
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-serif italic">
                          Saturday, 28th February 2026 &bull; Grand Hyatt KL
                        </p>

                        <div className="p-4 bg-background rounded-xl border border-border inline-block shadow-inner my-2">
                          <div className="size-36 bg-foreground/5 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1.5 p-2 mx-auto">
                            <QrCode className="size-24 text-foreground/85" />
                            <span className="text-[9px] font-mono text-muted-foreground">
                              fotokita.com/farhan-dania
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-medium text-foreground">
                          Scan to snap & upload your candid selfies to our big screen!
                        </p>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          No app required &bull; 100% Free
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. GUEST MOBILE VIEW */}
                {activeStepTab === "guest" && (
                  <motion.div
                    key="guest-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-5 space-y-4">
                      <Badge variant="outline" className="text-accent border-accent/30 gap-1 text-[11px]">
                        <Smartphone className="size-3.5" />
                        Guest Mobile Web Experience
                      </Badge>
                      <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal">
                        Digital Polaroid Photobooth in Their Pocket
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Within 2 seconds of scanning, the Fotokita mobile web app opens in Safari or Chrome.
                        Guests can snap live selfies with your personalized Polaroid frame, leave sweet wishes,
                        and tap upload.
                      </p>
                      <ul className="space-y-2 text-xs text-foreground/90 pt-1">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Custom Polaroid frame with couple signatures & date</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Guest name & dining table tagging</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Instant live broadcast confirmation</span>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-7 flex justify-center">
                      {/* Realistic Smartphone Mockup */}
                      <div className="w-72 sm:w-80 rounded-[36px] bg-foreground/5 border-4 border-foreground/20 p-3 shadow-2xl">
                        <div className="rounded-[28px] bg-background border border-border overflow-hidden">
                          {/* Phone Top Notch */}
                          <div className="bg-muted/50 py-1.5 px-4 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>9:41</span>
                            <div className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>fotokita.com</span>
                            </div>
                            <span>100%</span>
                          </div>

                          {/* Guest Camera Preview with Polaroid Frame */}
                          <div className="p-4 space-y-3">
                            <div className="bg-card border border-border rounded-xl p-3 pb-4 shadow-sm text-center">
                              {/* Photo Area */}
                              <div className="aspect-square bg-muted/60 rounded-lg flex flex-col items-center justify-center relative overflow-hidden border border-border/50">
                                <Users className="size-14 text-accent/60" />
                                <span className="text-[11px] text-muted-foreground font-serif italic mt-1">
                                  Table 7 (High School Buddies)
                                </span>
                                <Badge className="absolute top-2 right-2 text-[9px] bg-black/60 text-white border-none py-0.5">
                                  Live Preview
                                </Badge>
                              </div>

                              {/* Polaroid Caption */}
                              <div className="pt-3">
                                <span className="font-serif italic text-base text-foreground font-medium block">
                                  Farhan & Dania
                                </span>
                                <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                                  28.02.2026 &bull; #TheFarhanDaniaLove
                                </span>
                              </div>
                            </div>

                            {/* Wish message snippet */}
                            <div className="p-2.5 rounded-lg bg-card/60 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                              <Heart className="size-3.5 text-accent shrink-0" />
                              <span className="truncate">&ldquo;Wishing you both eternal bliss! - Nadia&rdquo;</span>
                            </div>

                            {/* Send to Big Screen Button */}
                            <Button size="sm" className="w-full text-xs font-semibold uppercase tracking-wider h-10 cursor-pointer">
                              <span>Share to Ballroom Screen</span>
                              <Send data-icon="inline-end" className="size-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. BALLROOM LIVE SCREEN */}
                {activeStepTab === "screen" && (
                  <motion.div
                    key="screen-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-5 space-y-4">
                      <Badge variant="outline" className="text-accent border-accent/30 gap-1 text-[11px]">
                        <Tv className="size-3.5" />
                        Reception Atmosphere
                      </Badge>
                      <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal">
                        Electrify Your Ballroom LED Screen & Projectors
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Connect any laptop via HDMI to the hall projectors. Turn on full-screen
                        slideshow mode. As guests snap photos, the wall updates in real time with
                        delightful transitions, making your crowd roar with excitement!
                      </p>
                      <ul className="space-y-2 text-xs text-foreground/90 pt-1">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Plug & play HDMI connection — zero specialized hardware needed</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Smooth auto-cycling carousel with guest photo highlights</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Displays live QR code in the corner so latecomers can scan anytime</span>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-7">
                      {/* Projector Screen Frame */}
                      <div className="rounded-xl border-4 border-foreground/15 bg-background shadow-2xl p-4 sm:p-5 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-border/80">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-serif uppercase tracking-widest text-foreground font-medium">
                              Live Ballroom Projector
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-accent border-accent/40 font-mono">
                            HDMI Fullscreen 1080p
                          </Badge>
                        </div>

                        {/* Screen Mockup Photo Grid */}
                        <div className="mt-4 grid grid-cols-3 gap-2.5">
                          <div className="aspect-3/4 rounded-lg bg-card border border-border p-2 flex flex-col justify-between">
                            <div className="h-4/5 bg-muted/60 rounded flex items-center justify-center">
                              <Heart className="size-8 text-accent/50" />
                            </div>
                            <span className="text-[10px] font-serif text-muted-foreground truncate">
                              Bride & Bridesmaids
                            </span>
                          </div>

                          <div className="aspect-3/4 rounded-lg bg-card border border-border p-2 flex flex-col justify-between scale-103 shadow-md border-accent/50">
                            <div className="h-4/5 bg-muted/70 rounded flex items-center justify-center">
                              <Camera className="size-8 text-accent" />
                            </div>
                            <span className="text-[10px] font-serif text-accent font-semibold truncate">
                              Just Arrived! (Table 4)
                            </span>
                          </div>

                          <div className="aspect-3/4 rounded-lg bg-card border border-border p-2 flex flex-col justify-between">
                            <div className="h-4/5 bg-muted/60 rounded flex items-center justify-center">
                              <Users className="size-8 text-accent/50" />
                            </div>
                            <span className="text-[10px] font-serif text-muted-foreground truncate">
                              Uncle & Auntie Crew
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 p-2 rounded-lg bg-card/80 border border-border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground text-[11px]">
                            248 photos received from 120 guests
                          </span>
                          <span className="text-accent text-[11px] font-medium font-mono">
                            Auto-syncing every 5s
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. FOREVER CLOUD VAULT */}
                {activeStepTab === "vault" && (
                  <motion.div
                    key="vault-step"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-5 space-y-4">
                      <Badge variant="outline" className="text-accent border-accent/30 gap-1 text-[11px]">
                        <Cloud className="size-3.5" />
                        The Morning After
                      </Badge>
                      <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal">
                        1-Click Bulk High-Res ZIP Archive
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Never chase friends over WhatsApp for forgotten photos. When the reception
                        concludes, log into your couple admin dashboard with your private 4-digit PIN
                        and download every single uncompressed image in one tidy ZIP file.
                      </p>
                      <ul className="space-y-2 text-xs text-foreground/90 pt-1">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Full original sensor resolution — ideal for printed photo albums</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>4-digit Admin PIN to curate, reorder, or delete duplicates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 text-accent" />
                          <span>Cloudflare R2 private storage with zero bandwidth limits</span>
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-7 flex justify-center">
                      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lock className="size-4 text-accent" />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                              Couple Admin Dashboard
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            PIN Protected
                          </Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Total Photographs</span>
                            <span className="font-semibold text-foreground">342 Files</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Original Size</span>
                            <span className="font-semibold text-foreground">2.4 GB (Full HD)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Storage Expiry</span>
                            <span className="font-semibold text-accent">Active for 1 Year</span>
                          </div>
                        </div>

                        <Button className="w-full h-11 text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md">
                          <Download data-icon="inline-start" className="size-4" />
                          <span>Download All Photos (ZIP)</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            "WHY FOTOKITA?" THE PROBLEM VS SOLUTION COMPARISON
            Clear comparison that proves why WhatsApp / Google Drive fail
        ───────────────────────────────────────────────────────────── */}
        <section id="comparison" className="py-20 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="accent" className="mb-2">
                The Frictionless Choice
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Why Couples Choose Fotokita Over WhatsApp & Google Drive
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Collecting wedding photos is usually messy, exhausting, and leads to lost memories.
                Fotokita replaces chaos with pure joy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* WhatsApp Groups */}
              <Card className="bg-background/60 border-border/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <XCircle className="size-5 text-destructive" />
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      WhatsApp Groups
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    The chaotic default that exhausts newlyweds.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-3 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Heavy compression: photos become grainy and blurry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Fills up everyone's personal phone memory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Requires chasing 200+ guests for weeks after the wedding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Zero live excitement or ballroom projector display</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground italic">
                  Result: 70% of candid guest photos are never seen by the couple.
                </div>
              </Card>

              {/* Google Drive / Dropbox */}
              <Card className="bg-background/60 border-border/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <XCircle className="size-5 text-destructive" />
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      Google Drive Links
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    High friction, frustrating for older relatives.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-3 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Requires Gmail login and confusing app permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Elderly uncles and aunties get stuck or give up</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>No fun Polaroid frames or wedding branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive font-bold">&times;</span>
                      <span>Feels like clinical office file sharing, not celebration</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground italic">
                  Result: Only 5-10 tech-savvy friends actually upload anything.
                </div>
              </Card>

              {/* Fotokita Live Gallery */}
              <Card className="bg-card border-2 border-accent p-6 sm:p-7 flex flex-col justify-between shadow-xl relative scale-102">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] uppercase tracking-widest font-bold px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="size-3" />
                  The Joyful Experience
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3 text-accent">
                    <CheckCircle2 className="size-5" />
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Fotokita Live Gallery
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Zero barrier to upload. Live interactive wedding entertainment.
                  </p>
                  <Separator className="mb-4" />
                  <ul className="space-y-3 text-xs text-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span><strong>100% No App Download</strong>: Native browser opens in 2 seconds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span><strong>Original HD Resolution</strong>: Crystal clear uncompressed files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span><strong>Instant Ballroom Display</strong>: Guests love seeing themselves live</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span><strong>1-Click Bulk ZIP</strong>: All photos packaged by midnight</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-accent/30 text-[11px] font-semibold text-accent">
                  Result: Hundreds of joyful candid memories captured effortlessly.
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            CORE FEATURES / SERVICES GRID
            Minimalist, clean, easy to read cards
        ───────────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 bg-card/40 border-y border-border/70 backdrop-blur-xs transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="accent" className="mb-2">
                Crafted With Care
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Everything You Need for a Seamless Celebration
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Engineered for rock-solid stability during high-volume wedding receptions.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Feature 1 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <QrCode className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    Custom Table QR Cards
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Personalized print-ready templates designed for acrylic table stands, welcome easels,
                    and guest registration counters.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Camera className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    Digital Polaroid Frames
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Custom digital frame templates stamped with your wedding date, couple monogram,
                    and digital well-wishes from guests.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 3 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Tv className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    Plug & Play Projector Slideshow
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connect any laptop to venue projectors or grand LED displays via HDMI. Photos
                    auto-cycle smoothly with zero lag.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 4 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Download className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    1-Click Bulk ZIP Download
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Download your full uncompressed photo archive anytime. Every original pixel is
                    preserved for physical album printing.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 5 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    Private 4-Digit PIN Moderation
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Couples or trusted bridesmaids have full administrative power to curate, reorder,
                    or instantly remove any inappropriate photo.
                  </p>
                </Card>
              </motion.div>

              {/* Feature 6 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-background/70 hover:border-accent/50 transition-all p-6 space-y-3">
                  <div className="size-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Cloud className="size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-normal text-foreground">
                    High-Speed Cloud Storage
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hosted on ultra-fast Cloudflare R2 infrastructure with zero egress fees, lightning-fast
                    delivery, and bank-grade SSL security.
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            TRANSPARENT PRICING & SUBSCRIPTION PLANS
            Clear, honest duration-based event packages
        ───────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Title and Scroll Arrows */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 max-w-5xl mx-auto">
              <div>
                <Badge variant="accent" className="mb-2">
                  Flexible Event Packages
                </Badge>
                <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                  Flexible Packages Tailored to Your Celebration
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  Select the ideal event duration for your wedding. Scroll side to side to view all 6 packages.
                </p>
              </div>

              {/* Navigation Controls (Arrows) */}
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  Scroll side to side
                </span>
                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollPricing("left")}
                    disabled={!canScrollLeft}
                    className="size-8 rounded-full cursor-pointer hover:bg-background hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Previous plan"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollPricing("right")}
                    disabled={!canScrollRight}
                    className="size-8 rounded-full cursor-pointer hover:bg-background hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Next plan"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Carousel Container */}
            <div className="relative group max-w-6xl mx-auto">
              {/* Left & Right floating navigation arrow buttons for desktop */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollPricing("left")}
                  aria-label="Scroll left"
                  className="absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/95 border border-border shadow-xl backdrop-blur-md hidden sm:flex items-center justify-center text-foreground hover:text-accent hover:border-accent transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollPricing("right")}
                  aria-label="Scroll right"
                  className="absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/95 border border-border shadow-xl backdrop-blur-md hidden sm:flex items-center justify-center text-foreground hover:text-accent hover:border-accent transition-all cursor-pointer"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}

              {/* Edge Gradient Shadows */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              )}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              )}

              {/* Side-to-side Scroll Track (Scrollbar hidden, controlled via dots & arrows) */}
              <div
                ref={pricingCarouselRef}
                className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-5 px-3 sm:px-4 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
              >
                {PRICING_PLANS.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="w-[285px] sm:w-[325px] md:w-[350px] shrink-0 snap-center sm:snap-start flex flex-col"
                  >
                    <Card
                      className={`h-full p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-300 ${
                        plan.isPopular
                          ? "bg-card border-2 border-accent shadow-xl ring-1 ring-accent/30"
                          : plan.isSpecialPartner
                          ? "bg-accent/5 border-2 border-accent/60 hover:border-accent shadow-md"
                          : "bg-background/60 border-border/80 hover:border-accent/50 shadow-xs"
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] uppercase tracking-widest font-bold px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <Sparkles className="size-3" />
                          Most Popular for Weddings
                        </div>
                      )}

                      {plan.isSpecialPartner && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <Sparkles className="size-3 text-accent" />
                          Special Pro Partner
                        </div>
                      )}

                      <div>
                        <Badge
                          variant={plan.isPopular ? "accent" : "outline"}
                          className={`text-[10px] uppercase font-semibold mb-2 ${
                            plan.isSpecialPartner ? "border-accent/40 text-accent" : ""
                          }`}
                        >
                          {plan.badge}
                        </Badge>
                        <CardTitle className="font-serif text-2xl sm:text-3xl text-foreground mt-1 mb-2 font-normal">
                          {plan.name}
                        </CardTitle>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span
                            className={`font-semibold text-foreground ${
                              plan.isPopular ? "text-4xl" : "text-3xl"
                            }`}
                          >
                            {plan.price}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {plan.duration}
                          </span>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mb-6 leading-relaxed min-h-[38px]">
                          {plan.description}
                        </CardDescription>

                        <Separator className="mb-4" />

                        <ul className="space-y-3 text-xs text-muted-foreground">
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

                      <div className="mt-8 pt-4">
                        <Button
                          size={plan.isPopular ? "lg" : "default"}
                          variant={plan.isPopular ? "default" : plan.isSpecialPartner ? "default" : "outline"}
                          className={`w-full uppercase text-xs tracking-wider font-semibold cursor-pointer transition-colors ${
                            plan.isPopular
                              ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-md gap-1.5"
                              : plan.isSpecialPartner
                              ? "bg-foreground hover:bg-foreground/90 text-background shadow-sm"
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
                          <span>Book Now</span>
                          {plan.isPopular && (
                            <ArrowRight data-icon="inline-end" className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Dot indicators (No scrollbar, pure dot navigation) */}
            <div className="flex flex-col items-center justify-center gap-3 mt-6">
              <div className="flex items-center gap-2">
                {PRICING_PLANS.map((plan, idx) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => scrollToPlanIndex(idx)}
                    aria-label={`View ${plan.name}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activePlanIndex === idx
                        ? "w-8 h-2.5 bg-accent shadow-xs"
                        : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground font-mono sm:hidden">
                &larr; Swipe left / right &rarr;
              </span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            COMMUNITY TESTIMONIALS & FEEDBACK PORTAL
        ───────────────────────────────────────────────────────────── */}
        <section id="testimonials" className="py-20 bg-card/40 border-y border-border/70 backdrop-blur-xs transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="accent" className="mb-2">
                Loved by Newlyweds
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Real Stories From Couples & Guests
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Read authentic wedding experiences from couples who celebrated with Fotokita.
              </p>
            </div>

            {/* Testimonials 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <AnimatePresence>
                {feedbacks.slice(0, 4).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full bg-background/80 border-border/80 p-6 flex flex-col justify-between shadow-2xs hover:border-accent/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: item.rating }).map((_, i) => (
                              <Star key={i} className="size-3.5 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-[11px] text-accent font-medium font-serif italic">
                            {item.date}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed italic mb-4 font-serif">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      </div>

                      <div>
                        <Separator className="mb-3" />
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-foreground">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {item.role} &bull; {item.location}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 gap-1">
                            <CheckCircle2 className="size-3" />
                            Verified Couple
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Feedback Submission Card */}
            <div className="max-w-2xl mx-auto">
              <Card className="bg-background/90 border-border/80 p-6 sm:p-8 shadow-sm">
                <CardHeader className="text-center p-0 mb-6">
                  <Badge variant="accent" className="mx-auto mb-2 gap-1 text-[11px]">
                    <Heart className="size-3" />
                    Share Your Experience
                  </Badge>
                  <CardTitle className="font-serif text-2xl text-foreground font-normal">
                    Attended a Fotokita Wedding or Have Ideas?
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Your thoughts help us continuously innovate and elevate celebrations.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  {feedbackSuccessNotice ? (
                    <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        Thank you! Your testimonial has been recorded.
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Thank you for being part of the Fotokita celebration story.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setFeedbackSuccessNotice(false)}
                        className="text-accent underline text-xs cursor-pointer"
                      >
                        Submit another review &rarr;
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                            Your Name *
                          </label>
                          <Input
                            required
                            placeholder="e.g. Sarah & Danial"
                            value={feedbackAuthor}
                            onChange={(e) => setFeedbackAuthor(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                            Your Role
                          </label>
                          <select
                            value={feedbackRole}
                            onChange={(e) => setFeedbackRole(e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3.5 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 text-foreground"
                          >
                            <option value="Newlyweds">Newlyweds / Bride & Groom</option>
                            <option value="Wedding Guest">Wedding Guest</option>
                            <option value="Official Photographer">Official Photographer</option>
                            <option value="Wedding Planner">Wedding Planner / Emcee</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                            Venue / Location
                          </label>
                          <Input
                            placeholder="e.g. Kuala Lumpur, Malaysia"
                            value={feedbackLocation}
                            onChange={(e) => setFeedbackLocation(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                            Rating
                          </label>
                          <div className="flex items-center gap-1.5 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(star)}
                                className="focus:outline-none cursor-pointer p-0.5"
                              >
                                <Star
                                  className={`size-4.5 transition-colors ${
                                    star <= feedbackRating
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-muted"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-semibold text-accent ml-2">
                              {feedbackRating} / 5 Stars
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                          Your Feedback / Review *
                        </label>
                        <Textarea
                          required
                          placeholder="Tell us what you liked about Fotokita, how guests reacted to the projector feed, or how we can improve..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="w-full h-11 text-xs uppercase tracking-widest font-semibold cursor-pointer"
                      >
                        {isSubmittingFeedback ? (
                          <span>Publishing Feedback...</span>
                        ) : (
                          <>
                            <span>Submit Your Review</span>
                            <Send data-icon="inline-end" className="size-3.5" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            FREQUENTLY ASKED QUESTIONS (FAQ)
            Clear, transparent answers to practical wedding logistics
        ───────────────────────────────────────────────────────────── */}
        <section id="faq" className="py-20 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Badge variant="accent" className="mb-2">
                Frequently Asked Questions
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal">
                Everything You Need to Know
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Got questions about AV setup, moderation, or guest privacy? We have answers.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  q: "Do guests need to install an app from App Store or Google Play?",
                  a: "No app download is needed whatsoever! Guests open their native phone camera, point it at the table stand QR code, and Fotokita opens instantly in their default mobile browser (Safari, Chrome, etc.) within 2 seconds.",
                },
                {
                  q: "How do we connect Fotokita to our ballroom LED screen or projectors?",
                  a: "It requires zero specialized hardware. Simply plug an HDMI cable from any laptop into your venue AV console or projector. Open your wedding URL on the laptop and click 'Slideshow Mode'. New guest photos will automatically stream and cycle seamlessly.",
                },
                {
                  q: "Does photo quality get compressed like on WhatsApp?",
                  a: "Not at all. WhatsApp compresses photos down to 70-80% quality. Fotokita retains full original camera sensor resolution, so you can download uncompressed, crystal-clear images that are fully suitable for printed wedding albums.",
                },
                {
                  q: "What if a guest accidentally uploads a duplicate or blurry photo?",
                  a: "You stay in complete control! Couples are given a confidential 4-digit Admin PIN. You or a designated bridesmaid/groomsman can open the admin panel on your phone to instantly delete or hide any photo with one tap.",
                },
                {
                  q: "How fast do photos appear on the ballroom screen?",
                  a: "Photos typically appear on the live screen within 3 to 5 seconds after a guest taps upload, depending on the venue's mobile data or Wi-Fi connection.",
                },
                {
                  q: "How long is our wedding gallery saved online?",
                  a: "With our Standard Reception plan, your private cloud gallery remains active online for one full year. With our Pro VIP plan, your gallery is archived for a lifetime with zero recurring fees.",
                },
              ].map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <Card
                    key={idx}
                    className="bg-background/80 border-border/80 overflow-hidden gap-0 p-0 shadow-2xs"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <span className="font-serif text-base text-foreground font-medium">
                        {item.q}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChevronDown className="size-4 text-accent shrink-0" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <Separator />
                          <div className="p-4 sm:p-5 text-xs text-muted-foreground leading-relaxed">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            NEWSLETTER / 20% DISCOUNT VOUCHER CALL TO ACTION
        ───────────────────────────────────────────────────────────── */}
        <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <Badge variant="accent" className="mb-2 bg-accent/20 text-accent font-semibold text-[11px]">
              Ready to Celebrate?
            </Badge>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-primary-foreground font-normal">
              Get 20% Off Your Wedding Gallery + Printable QR Guide
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
              Drop your email address below to receive our free wedding day table QR guide,
              printable card design samples, and an exclusive 20% launch voucher code.
            </p>

            {emailSubscribed ? (
              <div className="mt-8 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 max-w-md mx-auto text-center space-y-1">
                <CheckCircle2 className="size-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-emerald-200">
                  You're all set! Thank you for subscribing.
                </p>
                <p className="text-[11px] text-emerald-300/80">
                  Check your inbox for your 20% voucher code and printable table stand guide.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubscribe} className="mt-8 max-w-md mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    required
                    placeholder="Enter your email (e.g. bride@gmail.com)"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  />
                  <Button
                    type="submit"
                    disabled={isSubscribingEmail}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs uppercase tracking-wider px-6 cursor-pointer"
                  >
                    {isSubscribingEmail ? "Saving..." : "Subscribe"}
                  </Button>
                </div>
                <p className="text-[10px] text-primary-foreground/60">
                  Zero spam. Unsubscribe anytime with a single click.
                </p>
              </form>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            MINIMALIST FOOTER
        ───────────────────────────────────────────────────────────── */}
        <footer className="bg-card/60 border-t border-border/80 py-12 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground transition-colors duration-300">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="font-serif tracking-widest text-lg uppercase text-foreground font-medium">
                Fotokita
              </span>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The Live Wedding Guest Gallery & Instant Ballroom Screen Experience.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-wider">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#experience" className="hover:text-foreground transition-colors">
                Simulator
              </a>
              <a href="#pricing" className="hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">
                Reviews
              </a>
              <a
                href="?page=demo"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDemo}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Live Demo
              </a>
              <button
                onClick={() => {
                  if (onNavigateToSubAdmin) {
                    onNavigateToSubAdmin();
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="text-accent font-semibold hover:underline cursor-pointer"
              >
                Sub-Admin Login
              </button>
            </div>

            <div className="text-[11px] text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} Fotokita. All rights reserved.</p>
              <p className="text-[10px] text-accent mt-0.5">
                Preserving timeless wedding moments with love and elegance.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* WHATSAPP PAYMENT & DEALS MODAL */}
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
