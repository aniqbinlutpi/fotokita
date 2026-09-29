import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { checkSlugAvailability, createWedding } from "@/api/wedding";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Lock,
  Heart,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Wedding } from "@/types/wedding";

interface SubscriberRegisterPageProps {
  onSuccess: (wedding: Wedding) => void;
  onCancel?: () => void;
  initialPlan?: "standard" | "premium";
}

export const SubscriberRegisterPage: React.FC<SubscriberRegisterPageProps> = ({
  onSuccess,
  onCancel,
  initialPlan = "standard",
}) => {
  const [coupleName, setCoupleName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [weddingDate, setWeddingDate] = useState(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  });
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [adminPin, setAdminPin] = useState("1234");
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">(initialPlan);

  // Slug check states
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived validation for short slug
  const shortSlugError =
    slug.length > 0 && slug.length < 3
      ? "URL slug must be at least 3 characters long"
      : null;

  const effectiveSlugStatus = shortSlugError
    ? { checked: true, available: false, message: shortSlugError }
    : slugStatus;

  // Helper to format string into slug
  const formatToSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Auto-generate slug from couple name if not manually edited
  const handleCoupleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoupleName(val);
    if (!isSlugManuallyEdited) {
      const generated = formatToSlug(val);
      setSlug(generated);
      if (generated.length >= 3) {
        setIsCheckingSlug(true);
      }
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    const cleaned = formatToSlug(e.target.value);
    setSlug(cleaned);
    if (cleaned.length >= 3) {
      setIsCheckingSlug(true);
    }
  };

  // Debounced slug check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        setSlugStatus({
          checked: true,
          available: res.available,
          message: res.available
            ? "Great news! This URL slug is available."
            : "This URL slug has already been reserved.",
        });
      } catch (err: any) {
        setSlugStatus({
          checked: true,
          available: false,
          message: err?.message || "Failed to check URL slug availability",
        });
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coupleName.trim()) {
      toast.error("Please enter the couple's names.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Please specify a custom gallery URL slug.");
      return;
    }

    if (effectiveSlugStatus && !effectiveSlugStatus.available) {
      toast.error("This URL slug is invalid or already taken.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newWedding = await createWedding({
        name: coupleName.trim(),
        slug: slug.trim(),
        date: new Date(weddingDate).toISOString(),
      });

      // Save admin credentials locally
      try {
        localStorage.setItem(`fotokita_admin_pin_${newWedding.id}`, adminPin);
        localStorage.setItem("fotokita_active_wedding_id", newWedding.id);
        if (subscriberEmail) {
          localStorage.setItem(`fotokita_subscriber_${newWedding.id}`, subscriberEmail);
        }
      } catch {
        // ignore
      }

      toast.success("Congratulations! Your wedding gallery is ready.", {
        description: `Official URL: fotokita.my/${newWedding.slug}`,
      });

      onSuccess(newWedding);
    } catch (err: any) {
      console.error("Failed to register:", err);
      toast.error("Registration failed", {
        description:
          err?.message ||
          "The custom URL might already be taken or server connection was interrupted.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-[11px] uppercase tracking-widest text-accent">
            <Sparkles className="size-3.5" />
            Wedding Gallery Registration
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground tracking-wide font-normal">
            Create Your Wedding Gallery
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Set up an exclusive digital gallery for your celebration. Get your unique custom URL,
            secure zero-egress cloud storage, and personal admin portal.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Globe className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Custom URL</p>
              <p className="text-xs font-medium text-foreground">fotokita.my/slug</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Cloud className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cloudflare R2</p>
              <p className="text-xs font-medium text-foreground">Zero Egress Fees</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Database className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PostgreSQL</p>
              <p className="text-xs font-medium text-foreground">Tenant Isolated</p>
            </div>
          </Card>
        </div>

        {/* Registration Form Card */}
        <Card className="bg-card p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Couple Names */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Couple Names (Bride & Groom) *
              </label>
              <div className="relative">
                <Input
                  required
                  placeholder="e.g. Afiq & Wieam"
                  value={coupleName}
                  onChange={handleCoupleNameChange}
                  className="pr-10"
                />
                <Heart className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
              </div>
            </div>

            {/* 2. Custom URL Slug with Realtime Checking */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  Custom Gallery URL (Must Be Unique) *
                </label>
                <span className="text-[11px] text-accent font-mono">
                  fotokita.my/{slug || "your-slug"}
                </span>
              </div>

              <div className="relative flex rounded-lg shadow-2xs">
                <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-input bg-muted/50 text-xs font-mono text-muted-foreground select-none">
                  fotokita.my/
                </span>
                <input
                  type="text"
                  required
                  placeholder="afiq-and-wieam"
                  value={slug}
                  onChange={handleSlugChange}
                  className="flex-1 px-4 py-2.5 bg-background/50 border border-input rounded-r-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
                <div className="absolute right-3 top-3 flex items-center">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 text-accent animate-spin" />
                  ) : effectiveSlugStatus?.checked ? (
                    effectiveSlugStatus.available ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-rose-500" />
                    )
                  ) : null}
                </div>
              </div>

              {/* Status Feedback */}
              {effectiveSlugStatus && (
                <div
                  className={`mt-2 text-xs flex items-center gap-1.5 ${
                    effectiveSlugStatus.available
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {effectiveSlugStatus.available ? (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0" />
                  )}
                  <span>{effectiveSlugStatus.message}</span>
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lowercase letters, numbers, and dashes (-) only. Will be featured on your table QR cards.
              </p>
            </div>

            {/* 3. Wedding Date */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Wedding Celebration Date *
              </label>
              <div className="relative">
                <Input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="pr-10"
                />
                <Calendar className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
              </div>
            </div>

            {/* 4. Storage Plan */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Selected Storage Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedPlan("standard")}
                  className={`cursor-pointer p-4 rounded-lg border transition-all ${
                    selectedPlan === "standard"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-serif text-sm font-medium">Standard Plan</span>
                    <span className="text-xs font-semibold text-accent">10 GB</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sufficient for ~3,000 high-resolution candid guest photos.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedPlan("premium")}
                  className={`cursor-pointer p-4 rounded-lg border transition-all ${
                    selectedPlan === "premium"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-serif text-sm font-medium">Pro Studio / VIP</span>
                    <span className="text-xs font-semibold text-accent">30 GB</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Ideal for pro photographers, video clips, and lifetime storage.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Sub-Admin PIN & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Subscriber Email
                </label>
                <Input
                  type="email"
                  placeholder="couple@email.com"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Admin PIN (4-Digit) *
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="font-mono tracking-widest pr-10"
                  />
                  <Lock className="size-3.5 absolute right-3 top-3 text-accent/60 pointer-events-none" />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Confidential PIN to moderate photos and update wedding details.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-11 px-5 uppercase text-xs tracking-wider cursor-pointer"
                >
                  Cancel / Back
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (effectiveSlugStatus !== null && !effectiveSlugStatus.available)
                }
                className="w-full sm:flex-1 h-11 uppercase text-xs tracking-widest font-semibold cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Publishing Gallery...
                  </>
                ) : (
                  <>
                    <span>Register & Launch Gallery</span>
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Security Assurance Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Every wedding archive is securely isolated in our indexed database.</span>
        </div>
      </motion.div>
    </div>
  );
};
