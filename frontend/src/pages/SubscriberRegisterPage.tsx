import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { checkSlugAvailability, createWedding } from "@/api/wedding";
import { verifyInviteToken, redeemInviteToken, type SubscriptionTier } from "@/api/admin";
import { registerTenant, updateTenantCustomization, clearStoredTenantSession } from "@/api/tenant";
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
  ArrowLeft,
  ShieldCheck,
  Globe,
  Database,
  Cloud,
  Clock,
  User,
  AlertTriangle,
  MessageCircle,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Wedding } from "@/types/wedding";

interface SubscriberRegisterPageProps {
  inviteToken?: string;
  initialPlan?: SubscriptionTier;
  onSuccess: (wedding: Wedding) => void;
  onCancel?: () => void;
}

const PLAN_DETAILS: Record<string, { title: string; price: string; duration: string; desc: string }> = {
  "12h": { title: "12 Hours", price: "RM 6", duration: "12 Hours", desc: "Active guest photo uploads & gallery access for 12 hours." },
  "1day": { title: "Whole Day", price: "RM 10", duration: "24 Hours", desc: "Ideal for full-day solemnization & evening wedding banquets." },
  "3days": { title: "3 Days", price: "RM 17", duration: "3 Days", desc: "Full weekend celebration: henna night, ceremony & reception." },
  "1week": { title: "1 Week", price: "RM 23", duration: "7 Days", desc: "Leisurely 7-day extended family photo gathering & sharing." },
  "1month": { title: "1 Month", price: "RM 46", duration: "30 Days", desc: "Relaxed 30-day guest downloads & high-res archive access." },
  "1year": { title: "1 Year Special", price: "RM 189", duration: "365 Days", desc: "Tailored for photographers, wedding planners & banquet halls." },
  standard: { title: "Standard", price: "RM 6", duration: "12 Hours", desc: "High-resolution guest candid gallery." },
  premium: { title: "Pro Studio", price: "RM 10", duration: "24 Hours", desc: "HD photos & quick video clip uploads." },
  vip: { title: "VIP Exclusive", price: "RM 189", duration: "1 Year", desc: "4K video archives & unlimited multi-event support." },
};

export const SubscriberRegisterPage: React.FC<SubscriberRegisterPageProps> = ({
  inviteToken: propToken,
  initialPlan = "1day",
  onSuccess,
  onCancel,
}) => {
  const displayDomain = typeof window !== "undefined" ? window.location.host : "fotokita.com";

  // Read token from props or URL
  const [token] = useState<string | null>(() => {
    if (propToken) return propToken;
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || null;
  });

  // Token verification states
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenRemainingHours, setTokenRemainingHours] = useState<number | null>(null);
  const [lockedPlan, setLockedPlan] = useState<SubscriptionTier | null>(null);

  // Form states - Separate names for Groom (Guy) and Bride (Lady)
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [weddingDate, setWeddingDate] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(initialPlan);

  // Success view state (NO AUTO LOGIN)
  const [registeredWedding, setRegisteredWedding] = useState<Wedding | null>(null);

  // Slug check states
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
    isError?: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Verify token on mount if provided
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    verifyInviteToken(token)
      .then((res) => {
        if (!isMounted) return;
        setLockedPlan(res.tier);
        setSelectedPlan(res.tier);

        // Auto-fill and lock username registered from inquiry
        if (res.clientName) {
          const lockedUsername = res.clientName.toLowerCase().replace(/[^a-z0-9_.]/g, "");
          setUsername(lockedUsername);
          setIsUsernameLocked(true);
        }

        const hoursLeft = Math.max(0, Math.ceil(res.remainingMs / (1000 * 60 * 60)));
        setTokenRemainingHours(hoursLeft);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setTokenError(
          err?.message ||
            "This invitation link is invalid, has already been used, or has expired after 24 hours."
        );
      })
      .finally(() => {
        if (isMounted) setIsVerifyingToken(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Format string into clean slug (letters, numbers, hyphens, and '&')
  const formatToSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-&]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-*&-*/g, "&")
      .replace(/&+/g, "&")
      .replace(/^[-&]+|[-&]+$/g, "");
  };

  // Auto-generate slug from groom and bride names if not manually edited
  const updateSlugFromNames = (groom: string, bride: string) => {
    if (isSlugManuallyEdited) return;
    const parts: string[] = [];
    if (groom.trim()) parts.push(groom.trim());
    if (bride.trim()) parts.push(bride.trim());
    const combined = parts.join("&");
    const generated = formatToSlug(combined);
    setSlug(generated);
    if (generated.length >= 3) {
      setIsCheckingSlug(true);
    }
  };

  const handleGroomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGroomName(val);
    updateSlugFromNames(val, brideName);
  };

  const handleBrideNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrideName(val);
    updateSlugFromNames(groomName, val);
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
      setSlugStatus(null);
      setIsCheckingSlug(false);
      return;
    }

    let active = true;
    setIsCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const res = await checkSlugAvailability(slug);
        if (!active) return;
        setSlugStatus({
          checked: true,
          available: res.available,
          message: res.message,
        });
      } catch (err: any) {
        if (!active) return;
        console.warn("Failed to check slug availability:", err);
        setSlugStatus({
          checked: true,
          available: false,
          isError: true,
          message:
            err?.message?.includes("Failed to fetch") || err?.status === 502 || err?.status === 504
              ? "Cannot connect to wedding service. Please ensure the backend is running."
              : err?.message || "Failed to verify URL slug availability.",
        });
      } finally {
        if (active) {
          setIsCheckingSlug(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [slug]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groomName.trim()) {
      toast.error("Please enter the groom's name.");
      return;
    }

    if (!brideName.trim()) {
      toast.error("Please enter the bride's name.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Please specify a gallery URL (slug).");
      return;
    }

    if (!weddingDate) {
      toast.error("Please select your wedding event date.");
      return;
    }

    if (slugStatus && !slugStatus.available) {
      if (slugStatus.isError) {
        toast.error("Unable to verify URL slug. Please check connection to wedding service.");
      } else {
        toast.error(slugStatus.message || "This URL slug is invalid or already taken.");
      }
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter a username for your Sub-Admin account.");
      return;
    }

    if (!adminPassword || adminPassword.length < 4) {
      toast.error("Sub-Admin password must be at least 4 characters.");
      return;
    }

    if (adminPassword !== confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    const coupleFullName = `${groomName.trim()} & ${brideName.trim()}`;

    setIsSubmitting(true);
    try {
      // 1. Create Wedding in wedding-service
      const newWedding = await createWedding({
        name: coupleFullName,
        slug: slug.trim(),
        date: new Date(weddingDate).toISOString(),
      });

      // 2. Register Sub-Admin Tenant account in PostgreSQL tenant-service!
      try {
        await registerTenant({
          username: username.trim(),
          email: subscriberEmail.trim() || `${username.trim()}@fotokita.com`,
          password: adminPassword.trim(),
          weddingId: newWedding.id,
          weddingSlug: newWedding.slug,
          weddingName: newWedding.name,
          planTier: selectedPlan,
        });
      } catch (regErr: any) {
        console.warn("Could not register tenant account in tenant-service:", regErr);
      }

      // 3. Initialize customization with separate partner names
      try {
        await updateTenantCustomization(newWedding.id, {
          partner1: groomName.trim(),
          partner2: brideName.trim(),
        });
      } catch {
        // non-blocking
      }

      // 4. If an invite token was used, redeem it in admin-service (Single-use token burned!)
      if (token) {
        try {
          await redeemInviteToken({
            token,
            username: username.trim(),
            email: subscriberEmail.trim() || `${username.trim()}@fotokita.com`,
            weddingId: newWedding.id,
            weddingSlug: newWedding.slug,
            weddingName: newWedding.name,
          });
        } catch (redeemErr: any) {
          console.warn("Could not redeem invite token in admin-service:", redeemErr);
        }
      }

      // 5. Ensure NO session or credentials are saved so user must key in all credentials explicitly
      try {
        clearStoredTenantSession();
        localStorage.removeItem("fotokita_registered_username");
        localStorage.removeItem(`fotokita_admin_pin_${newWedding.id}`);
        localStorage.removeItem(`fotokita_admin_password_${newWedding.id}`);
        localStorage.removeItem(`fotokita_subadmin_user_${newWedding.id}`);
        localStorage.setItem(`fotokita_partner1_${newWedding.id}`, groomName.trim());
        localStorage.setItem(`fotokita_partner2_${newWedding.id}`, brideName.trim());
        localStorage.setItem("fotokita_active_wedding_id", newWedding.id);
        if (subscriberEmail) {
          localStorage.setItem(`fotokita_subscriber_${newWedding.id}`, subscriberEmail.trim());
        }
      } catch {
        // ignore
      }

      toast.success("Registration successful!", {
        description: `Your gallery is ready to launch at ${displayDomain}/${newWedding.slug}`,
      });

      // NO AUTO LOGIN: Transition to login prompt view
      setRegisteredWedding(newWedding);
    } catch (err: any) {
      console.error("Failed to register:", err);
      toast.error("Registration failed", {
        description:
          err?.message || "URL slug might already be in use or a server connection error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // State: Token Verifying Loader
  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="size-8 text-accent animate-spin mx-auto" />
          <h2 className="text-lg font-serif">Verifying Invitation Link...</h2>
          <p className="text-xs text-muted-foreground">
            The system is verifying your registration token status and subscription package.
          </p>
        </div>
      </div>
    );
  }

  // State: Token Error (Expired >24h or Already Used)
  if (token && tokenError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center border-rose-500/20 shadow-lg space-y-5">
            <div className="size-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-7" />
            </div>

            <div>
              <h2 className="text-xl font-serif font-medium text-foreground">
                Invalid Registration Link
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {tokenError}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/40 border text-left text-xs space-y-1.5 text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="size-3.5 text-accent" />
                <span>Token Security Policy:</span>
              </div>
              <p>&bull; Link is valid for only <strong>24 hours</strong> from generation by admin.</p>
              <p>&bull; Each link is <strong>single-use only (Single-Use Token)</strong>.</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  "Hi Fotokita Admin, my registration link has expired or is invalid. Could I get a new link?"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="size-4" />
                <span>Contact Admin on WhatsApp</span>
              </a>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-10 text-xs uppercase tracking-wider cursor-pointer"
                >
                  Back to Home
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // State: Registration Success Screen (NO AUTO LOGIN -> Navigate to Sub-Admin Login)
  if (registeredWedding) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="p-8 text-center border-accent/30 shadow-xl space-y-6">
            <div className="size-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="text-[11px] uppercase tracking-widest text-accent">
                Registration Successful
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
                Your Gallery Is Ready!
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your Sub-Admin account and wedding gallery archive have been successfully registered.
              </p>
            </div>

            {/* Account Summary Card */}
            <div className="p-4 rounded-xl bg-card/60 border border-border text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Couple Names
                </span>
                <span className="font-medium text-foreground">{registeredWedding.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Official Gallery URL
                </span>
                <span className="font-mono text-accent">{displayDomain}/{registeredWedding.slug}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Sub-Admin Username
                </span>
                <span className="font-mono font-medium text-foreground">@{username}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
                  Subscription Package
                </span>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {PLAN_DETAILS[selectedPlan]?.title || selectedPlan} ({PLAN_DETAILS[selectedPlan]?.price || ""})
                </Badge>
              </div>
            </div>

            {/* Instruction requiring manual login */}
            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-start gap-2 text-left">
              <Lock className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                For account security, please log in again using your Sub-Admin password to start managing your gallery.
              </span>
            </div>

            {/* Action button to proceed to Sub-Admin Login */}
            <Button
              type="button"
              onClick={() => onSuccess(registeredWedding)}
              className="w-full h-12 text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-md gap-2"
            >
              <LogIn className="size-4" />
              <span>Proceed to Sub-Admin Login</span>
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Normal Registration Form
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Navigation Bar */}
        {onCancel && (
          <div className="mb-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Home</span>
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-[11px] uppercase tracking-widest text-accent">
            <Sparkles className="size-3.5" />
            Gallery Sub-Admin Registration
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground tracking-wide font-normal">
            Register Your Wedding Gallery
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Complete the details below to launch your exclusive digital wedding gallery.
          </p>

          {/* Active 24h Token Banner */}
          {token && tokenRemainingHours !== null && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <Clock className="size-3.5" />
              <span>
                Valid Link: Approximately <strong>{tokenRemainingHours} hours</strong> remaining (Single-Use)
              </span>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Globe className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Custom URL</p>
              <p className="text-xs font-medium text-foreground">{displayDomain}/slug</p>
            </div>
          </Card>

          <Card className="p-3 bg-card/60 flex items-center gap-2.5 flex-row">
            <Cloud className="size-4 text-accent shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cloud Storage</p>
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
            {/* 1. Couple Names: Groom (Guy) & Bride (Lady) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Groom's Name (Guy) *
                </label>
                <div className="relative">
                  <Input
                    required
                    placeholder="e.g. Alex"
                    value={groomName}
                    onChange={handleGroomNameChange}
                    className="pr-10"
                  />
                  <User className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Bride's Name (Lady) *
                </label>
                <div className="relative">
                  <Input
                    required
                    placeholder="e.g. Rihana"
                    value={brideName}
                    onChange={handleBrideNameChange}
                    className="pr-10"
                  />
                  <Heart className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 2. Custom URL Slug with Realtime Checking */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  Gallery URL Slug (Must be unique) *
                </label>
                <span className="text-[11px] text-accent font-mono">
                  {displayDomain}/{slug || "your-slug"}
                </span>
              </div>

              <div className="relative flex rounded-lg shadow-2xs">
                <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-input bg-muted/50 text-xs font-mono text-muted-foreground select-none">
                  {displayDomain}/
                </span>
                <input
                  type="text"
                  required
                  placeholder="alex&rihana"
                  value={slug}
                  onChange={handleSlugChange}
                  className="flex-1 px-4 py-2.5 bg-background/50 border border-input rounded-r-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                />
                <div className="absolute right-3 top-3 flex items-center">
                  {isCheckingSlug ? (
                    <Loader2 className="size-4 text-accent animate-spin" />
                  ) : slugStatus?.checked ? (
                    slugStatus.available ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : slugStatus.isError ? (
                      <AlertTriangle className="size-4 text-amber-500" />
                    ) : (
                      <XCircle className="size-4 text-rose-500" />
                    )
                  ) : null}
                </div>
              </div>

              {/* Status Feedback */}
              {slugStatus && (
                <div
                  className={`mt-2 text-xs flex items-center gap-1.5 ${
                    slugStatus.available
                      ? "text-emerald-600 dark:text-emerald-400"
                      : slugStatus.isError
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {slugStatus.available ? (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  ) : slugStatus.isError ? (
                    <AlertTriangle className="size-3.5 shrink-0" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0" />
                  )}
                  <span>
                    {slugStatus.message ||
                      (slugStatus.available
                        ? "This URL slug is available!"
                        : "This URL slug has already been taken. Please choose another.")}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Wedding Date */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                Wedding Event Date *
              </label>
              <div className="relative">
                <Input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <Calendar className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
              </div>
            </div>

            {/* 4. Storage Plan based on Tier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                  Subscription Package
                </label>
                {lockedPlan && (
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    Locked by Admin (24h Token)
                  </Badge>
                )}
              </div>

              {lockedPlan ? (
                <div className="p-4 rounded-xl border border-accent/40 bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-foreground">
                        {PLAN_DETAILS[selectedPlan]?.title || selectedPlan}
                      </span>
                      <Badge variant="outline" className="text-xs text-accent font-semibold border-accent/40 bg-accent/5">
                        {PLAN_DETAILS[selectedPlan]?.price || ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {PLAN_DETAILS[selectedPlan]?.desc || "Verified and locked subscription package."}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Verified &bull; {PLAN_DETAILS[selectedPlan]?.duration || "Active"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(["12h", "1day", "3days", "1week", "1month", "1year"] as const).map((tierKey) => {
                    const info = PLAN_DETAILS[tierKey];
                    return (
                      <div
                        key={tierKey}
                        onClick={() => setSelectedPlan(tierKey)}
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                          selectedPlan === tierKey
                            ? "border-accent bg-accent/10 ring-1 ring-accent"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <div className="font-serif text-sm font-semibold">{info.title}</div>
                        <div className="text-xs text-accent font-medium mt-0.5">{info.price}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                          {info.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Sub-Admin Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground">
                    Sub-Admin Username *
                  </label>
                  {isUsernameLocked && (
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono gap-1 text-muted-foreground">
                      <Lock className="size-2.5 text-accent" />
                      Locked
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    required
                    readOnly={isUsernameLocked}
                    placeholder="e.g. ainafarhana"
                    value={username}
                    onChange={(e) => {
                      if (!isUsernameLocked) {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
                      }
                    }}
                    className={`pr-10 font-mono text-sm ${
                      isUsernameLocked
                        ? "bg-muted/70 cursor-not-allowed select-none text-foreground font-semibold"
                        : ""
                    }`}
                  />
                  {isUsernameLocked ? (
                    <Lock className="size-4 absolute right-3.5 top-3 text-accent pointer-events-none" />
                  ) : (
                    <User className="size-4 absolute right-3.5 top-3 text-accent/60 pointer-events-none" />
                  )}
                </div>
                {isUsernameLocked ? (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Username is locked to your reservation and cannot be modified.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Allowed: lowercase letters, numbers, underscores (_), and dots (.).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Confirmation Email *
                </label>
                <Input
                  required
                  type="email"
                  placeholder="couple@email.com"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                />
              </div>
            </div>

            {/* 6. Sub-Admin Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Sub-Admin Password *
                </label>
                <div className="relative">
                  <Input
                    required
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="size-4 text-accent" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4 text-accent" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
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
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (slugStatus !== null && !slugStatus.available)
                }
                className="w-full sm:flex-1 h-11 uppercase text-xs tracking-widest font-semibold cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registering Gallery...
                  </>
                ) : (
                  <>
                    <span>Register Sub-Admin Account</span>
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
          <span>Your account is protected with encrypted authentication and an isolated database tenant.</span>
        </div>
      </motion.div>
    </div>
  );
};
