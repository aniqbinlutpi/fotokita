import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PRICING_PLANS, type PricingPlanItem } from "@/data/pricingPlans";
import { WhatsAppInquiryModal } from "@/components/pricing/WhatsAppInquiryModal";

interface PricingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToSubAdmin?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onOpenChange,
  onNavigateToSubAdmin,
}) => {
  const [selectedPlanForWhatsApp, setSelectedPlanForWhatsApp] = useState<PricingPlanItem | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // Carousel ref & scroll states matching LandingPage.tsx
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activePlanIndex, setActivePlanIndex] = useState(1); // Default to Whole Day Pass (popular)

  const checkScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScrollLeft = scrollWidth - clientWidth;

    // Boundary flags: only show arrows when there is room to scroll
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScrollLeft - 10);

    if (maxScrollLeft <= 0) {
      setActivePlanIndex(0);
      return;
    }

    // Edge check: start of carousel (first plan)
    if (scrollLeft <= 15) {
      setActivePlanIndex(0);
      return;
    }

    // Edge check: end of carousel (last plan)
    if (scrollLeft >= maxScrollLeft - 20) {
      setActivePlanIndex(PRICING_PLANS.length - 1);
      return;
    }

    // Position-based active dot calculation
    const cards = el.querySelectorAll<HTMLElement>("[data-plan-card]");
    if (cards && cards.length > 0) {
      const containerRect = el.getBoundingClientRect();
      const anchorX = containerRect.left + containerRect.width * 0.35;
      let closestIdx = 0;
      let minDistance = Infinity;

      cards.forEach((card, idx) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(cardCenter - anchorX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      setActivePlanIndex(closestIdx);
    } else {
      const progress = scrollLeft / maxScrollLeft;
      const targetIndex = Math.round(progress * (PRICING_PLANS.length - 1));
      setActivePlanIndex(Math.min(Math.max(0, targetIndex), PRICING_PLANS.length - 1));
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM is mounted and measured properly
    const timer = setTimeout(() => {
      const el = carouselRef.current;
      if (!el) return;
      checkScroll();
      // Scroll to popular plan (index 1: Whole Day Pass) initially if first open
      scrollToPlanIndex(1);
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [isOpen]);

  const scrollToPlanIndex = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;

    if (index === 0) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      setActivePlanIndex(0);
      return;
    }

    const { scrollWidth, clientWidth } = el;
    const maxScrollLeft = scrollWidth - clientWidth;

    if (index === PRICING_PLANS.length - 1) {
      el.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      setActivePlanIndex(index);
      return;
    }

    const cards = el.querySelectorAll<HTMLElement>("[data-plan-card]");
    if (cards && cards[index]) {
      const card = cards[index];
      const containerRect = el.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = cardRect.left - containerRect.left - 24;
      el.scrollBy({ left: offset, behavior: "smooth" });
    } else {
      const targetLeft = (maxScrollLeft / (PRICING_PLANS.length - 1)) * index;
      el.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
    setActivePlanIndex(index);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScrollLeft = scrollWidth - clientWidth;
    if (maxScrollLeft <= 0) return;

    const cards = el.querySelectorAll<HTMLElement>("[data-plan-card]");
    const cardStep = cards[0] ? cards[0].offsetWidth + 18 : 290;

    const target =
      direction === "left"
        ? Math.max(0, scrollLeft - cardStep)
        : Math.min(maxScrollLeft, scrollLeft + cardStep);

    el.scrollTo({ left: target, behavior: "smooth" });
  };

  const handleSelectPlan = (plan: PricingPlanItem) => {
    setSelectedPlanForWhatsApp(plan);
    onOpenChange(false);
    setIsInquiryModalOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl p-0 overflow-hidden bg-card border-border shadow-2xl font-sans max-h-[92vh] flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-2 sm:pb-2.5 border-b border-border/80 bg-background/50 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pr-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#A67C6B]/15 text-[#A67C6B] text-[9.5px] uppercase tracking-widest font-semibold mb-1">
                  <Sparkles className="size-3" />
                  <span>Wedding Packages & Passes</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl text-foreground font-normal">
                  Choose Your Wedding Pass
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  Select your event duration.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 relative">
            {/* Floating Left Navigation Arrow Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                aria-label="Scroll left"
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-background/95 border border-border shadow-md backdrop-blur-md hidden sm:flex items-center justify-center text-foreground hover:text-[#A67C6B] hover:border-[#A67C6B] transition-all cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            )}

            {/* Floating Right Navigation Arrow Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                aria-label="Scroll right"
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full bg-background/95 border border-border shadow-md backdrop-blur-md hidden sm:flex items-center justify-center text-foreground hover:text-[#A67C6B] hover:border-[#A67C6B] transition-all cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            )}

            {/* Horizontal Scroll Track */}
            <div
              ref={carouselRef}
              onScroll={checkScroll}
              className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-5 px-6 sm:px-8 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
            >
              {PRICING_PLANS.map((plan) => (
                <motion.div
                  key={plan.id}
                  data-plan-card
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="w-[260px] sm:w-[285px] pt-1 shrink-0 snap-center sm:snap-start flex flex-col"
                >
                  <div
                    className={`h-full rounded-xl border p-4 sm:p-5 flex flex-col justify-between relative transition-all duration-200 ${
                      plan.isPopular
                        ? "bg-card border-2 border-[#A67C6B] shadow-md ring-1 ring-[#A67C6B]/20"
                        : plan.isSpecialPartner
                        ? "bg-[#A67C6B]/5 border border-[#A67C6B]/50 hover:border-[#A67C6B] shadow-2xs"
                        : "bg-background/60 border-border/80 hover:border-[#A67C6B]/40 shadow-2xs"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-[#A67C6B] text-white text-[9.5px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Sparkles className="size-2.5" />
                        <span>Most Popular</span>
                      </div>
                    )}

                    {/* Special Partner Badge */}
                    {plan.isSpecialPartner && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-[9.5px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Sparkles className="size-2.5 text-[#A67C6B]" />
                        <span>Partner Pass</span>
                      </div>
                    )}

                    <div>
                      <div className="mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium block truncate">
                          {plan.badge}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-normal text-foreground leading-tight">
                        {plan.name}
                      </h3>

                      <div className="mt-1 mb-2 flex items-baseline gap-1">
                        <span
                          className={`font-serif font-bold text-foreground ${
                            plan.isPopular ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                          }`}
                        >
                          {plan.price}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {plan.duration}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-snug mb-2.5 line-clamp-2 min-h-[30px]">
                        {plan.description}
                      </p>

                      <div className="w-full h-px bg-border/60 mb-2.5" />

                      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-tight">
                            <Check className="size-3 text-[#A67C6B] shrink-0 mt-0.5" />
                            <span className={feat.highlight ? "text-foreground font-medium" : ""}>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <Button
                        size="sm"
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full text-[11px] uppercase tracking-wider font-semibold h-8.5 rounded-lg cursor-pointer transition-all shadow-xs ${
                          plan.isPopular
                            ? "bg-[#2F2926] hover:bg-[#4A3728] text-white dark:bg-[#F5EFEB] dark:text-[#12100E] dark:hover:bg-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        <span>Book Now</span>
                        <ArrowRight className="size-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Carousel Dot Indicators */}
            <div className="flex flex-col items-center justify-center gap-1.5 mt-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                {PRICING_PLANS.map((plan, idx) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => scrollToPlanIndex(idx)}
                    aria-label={`View ${plan.name}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activePlanIndex === idx
                        ? "w-6 h-1.5 bg-[#A67C6B] shadow-xs"
                        : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-muted/30 border-t border-border/60 text-center shrink-0">
            <p className="text-[11px] text-muted-foreground">
              Need a custom package or banquet hall partnership? WhatsApp us directly at{" "}
              <a
                href="https://wa.me/60137848933"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A67C6B] hover:underline font-medium"
              >
                +60 13-784 8933
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared WhatsApp Deals & Inquiry Modal */}
      <WhatsAppInquiryModal
        isOpen={isInquiryModalOpen}
        onOpenChange={setIsInquiryModalOpen}
        plan={selectedPlanForWhatsApp}
        onNavigateToSubAdmin={onNavigateToSubAdmin}
        onBack={() => {
          setIsInquiryModalOpen(false);
          onOpenChange(true);
        }}
      />
    </>
  );
};
