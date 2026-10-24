import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { checkSlugAvailability, createWedding } from "@/api/wedding";
import { verifyInviteToken, redeemInviteToken, type SubscriptionTier } from "@/api/admin";
import { registerTenant, updateTenantCustomization, clearStoredTenantSession } from "@/api/tenant";
import {
  getPlanDurationLabel,
  calculatePlanEndDate,
  validatePlanCoverage,
} from "@/lib/planDuration";
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
  Clock,
  User,
  AlertTriangle,
  MessageCircle,
  LogIn,
  Eye,
  EyeOff,
  Info,
  Mail,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Wedding } from "@/types/wedding";

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          tabIndex={-1}
          className="text-muted-foreground/60 hover:text-accent cursor-pointer inline-flex items-center justify-center rounded-full transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          <Info className="size-3.5" />
          <span className="sr-only">Information</span>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs leading-relaxed bg-foreground text-background font-normal">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
  const [planStartDate, setPlanStartDate] = useState("");
  const [activationTime, setActivationTime] = useState("08:00");
  const [isWeddingPickerOpen, setIsWeddingPickerOpen] = useState(false);
  const [isActivationPickerOpen, setIsActivationPickerOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(initialPlan);

  const selectedWeddingDateObj = React.useMemo(() => {
    if (!weddingDate) return undefined;
    const parts = weddingDate.split("-").map(Number);
    const [year, month, day] = parts;
    if (year !== undefined && month !== undefined && day !== undefined) {
      return new Date(year, month - 1, day);
    }
    const d = new Date(weddingDate);
    return isNaN(d.getTime()) ? undefined : d;
  }, [weddingDate]);

  const activationDate = React.useMemo(() => {
    if (!planStartDate) return undefined;
    const datePart = planStartDate.split("T")[0];
    if (!datePart) return undefined;
    const parts = datePart.split("-").map(Number);
    const [year, month, day] = parts;
    if (year !== undefined && month !== undefined && day !== undefined) {
      return new Date(year, month - 1, day);
    }
    const d = new Date(planStartDate);
    return isNaN(d.getTime()) ? undefined : d;
  }, [planStartDate]);

  const handleSelectWeddingDate = (date: Date | undefined) => {
    if (!date) {
      setWeddingDate("");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    setWeddingDate(dateStr);

    // If activationDate was previously selected and is now AFTER the new wedding date,
    // clear it so user must pick a valid date on or before the wedding day.
    if (planStartDate) {
      const weddingMidnight = new Date(date);
      weddingMidnight.setHours(23, 59, 59, 999);
      const currentStart = new Date(planStartDate);
      if (currentStart.getTime() > weddingMidnight.getTime()) {
        setPlanStartDate("");
      }
    }
  };

  const handleSelectActivationDate = (date: Date | undefined) => {
    if (!date) {
      setPlanStartDate("");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    setPlanStartDate(`${dateStr}T${activationTime || "08:00"}`);
  };

  const handleActivationTimeChange = (time: string) => {
    setActivationTime(time);
    if (planStartDate) {
      const datePart = planStartDate.split("T")[0];
      setPlanStartDate(`${datePart}T${time}`);
    } else if (weddingDate) {
      setPlanStartDate(`${weddingDate}T${time}`);
    }
  };

  const effectiveStartDate = planStartDate
    ? new Date(planStartDate)
    : weddingDate
    ? new Date(`${weddingDate}T08:00`)
    : new Date();

  const calculatedEndDate = calculatePlanEndDate(selectedPlan, effectiveStartDate);
  const coverageCheck = validatePlanCoverage(weddingDate, effectiveStartDate, calculatedEndDate);

  const formatActivation = () => {
    if (!planStartDate) return { date: "Not scheduled", time: "Pending" };
    try {
      const d = new Date(planStartDate);
      if (isNaN(d.getTime())) return { date: "Not scheduled", time: "Pending" };
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      return { date, time };
    } catch {
      return { date: "Not scheduled", time: "Pending" };
    }
  };

  const formatExpiration = () => {
    try {
      const d = calculatedEndDate;
      if (!d || isNaN(d.getTime())) return { date: "—", time: "—" };
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      return { date, time };
    } catch {
      return { date: "—", time: "—" };
    }
  };

  const activationDisplay = formatActivation();
  const expirationDisplay = formatExpiration();

  // Success view state (NO AUTO LOGIN)
  const [registeredWedding, setRegisteredWedding] = useState<Wedding | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Gallery link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleCopyLink = (urlToCopy: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(urlToCopy)
        .then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
          toast.success("Gallery link copied to clipboard!");
        })
        .catch(() => {
          fallbackCopyText(urlToCopy);
        });
    } else {
      fallbackCopyText(urlToCopy);
    }
  };

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

        // Auto-fill wedding date & plan start date from inquiry invite
        if (res.weddingDate) {
          setWeddingDate(res.weddingDate);
        }
        if (res.planStartDate) {
          setPlanStartDate(res.planStartDate);
          const parts = res.planStartDate.split("T");
          if (parts[1]) {
            setActivationTime(parts[1].slice(0, 5));
          }
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

    if (!planStartDate) {
      toast.error("Please specify when you want to start using your plan.");
      return;
    }

    if (!coverageCheck.isValid) {
      toast.error(
        coverageCheck.message ||
          "Plan expiration precedes your wedding date. Please choose an activation time closer to the event or select a longer plan."
      );
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
          planStartDate: effectiveStartDate.toISOString(),
        });
      } catch (regErr: any) {
        console.warn("Could not register tenant account in tenant-service:", regErr);
      }

      // 3. Initialize customization with separate partner names and real wedding date
      try {
        await updateTenantCustomization(newWedding.id, {
          partner1: groomName.trim(),
          partner2: brideName.trim(),
          weddingDate: weddingDate.trim(),
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
    const galleryFullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/${registeredWedding.slug}`
        : `https://${displayDomain}/${registeredWedding.slug}`;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="p-5 sm:p-8 text-center border-accent/30 shadow-xl space-y-6">
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
              <div className="flex justify-between items-center pb-2 border-b border-border gap-2">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider shrink-0">
                  Couple Names
                </span>
                <span className="font-medium text-foreground text-right truncate">{registeredWedding.name}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 pb-2 border-b border-border">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider shrink-0">
                  Official Gallery URL
                </span>
                <div className="flex items-center justify-between sm:justify-end gap-1.5 min-w-0">
                  <a
                    href={galleryFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline inline-flex items-center gap-1.5 text-xs min-w-0 truncate group transition-colors"
                    title={`Open ${displayDomain}/${registeredWedding.slug} in new tab`}
                  >
                    <span className="truncate">{displayDomain}/{registeredWedding.slug}</span>
                    <ExternalLink className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(galleryFullUrl);
                    }}
                    className="shrink-0 inline-flex items-center justify-center size-7 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors cursor-pointer"
                    title={copiedLink ? "Copied!" : "Copy gallery link"}
                    aria-label="Copy gallery link"
                  >
                    {copiedLink ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-border gap-2">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider shrink-0">
                  Sub-Admin Username
                </span>
                <span className="font-mono font-medium text-foreground text-right truncate">@{username}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground uppercase text-[10px] tracking-wider shrink-0">
                  Subscription Package
                </span>
                <Badge variant="secondary" className="capitalize text-[10px] shrink-0">
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
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl text-foreground tracking-wide font-normal">
            Wedding Gallery Registration
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
            Review your package details and complete the registration below to launch your digital guestbook.
          </p>

          {/* Active 24h Token Banner */}
          {token && tokenRemainingHours !== null && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
              <Clock className="size-3" />
              <span>
                Valid Single-Use Link: <strong>{tokenRemainingHours} hours</strong> remaining
              </span>
            </div>
          )}
        </div>

        {/* Registration Form Card */}
        <Card className="bg-card p-5 sm:p-7 shadow-xs space-y-6">
          {/* ========================================================================= */}
          {/* SECTION A: INFORMATION & PACKAGE OVERVIEW (READ-ONLY)                     */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 sm:p-5 space-y-3.5">
            {/* Header: Plan & Verification Status */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-accent/15">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                    Subscription Package
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base sm:text-lg font-semibold text-foreground">
                      {PLAN_DETAILS[selectedPlan]?.title || selectedPlan}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold text-accent border-accent/40 bg-accent/10">
                      {PLAN_DETAILS[selectedPlan]?.price || ""}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {lockedPlan && (
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background/80 text-muted-foreground border-border/80 gap-1">
                    <Lock className="size-2.5 text-accent" />
                    Locked (Invite Link)
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium gap-1 ${
                    coverageCheck.isValid
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      : "border-destructive/40 text-destructive bg-destructive/10"
                  }`}
                >
                  {coverageCheck.isValid ? (
                    <>
                      <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Event Coverage Verified &bull; {getPlanDurationLabel(selectedPlan)}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-3 text-destructive" />
                      <span>Coverage Warning &bull; {getPlanDurationLabel(selectedPlan)}</span>
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {/* Key Information Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-lg bg-background/80 border border-border/60 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="size-3 text-accent shrink-0" />
                  <span>Wedding Date</span>
                </span>
                <div className="mt-1.5">
                  <div className="font-medium text-xs sm:text-sm text-foreground whitespace-nowrap leading-tight">
                    {coverageCheck.weddingFormatted || (weddingDate ? weddingDate : "Not selected")}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {weddingDate ? "Event Day" : "Select below"}
                  </div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-background/80 border border-border/60 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <Clock className="size-3 text-accent shrink-0" />
                  <span>Activation</span>
                </span>
                <div className="mt-1.5">
                  <div className="font-medium text-xs sm:text-sm text-foreground whitespace-nowrap leading-tight">
                    {activationDisplay.date}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground leading-tight mt-0.5">
                    {activationDisplay.time}
                  </div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-background/80 border border-border/60 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <Clock className="size-3 text-muted-foreground shrink-0" />
                  <span>Expires</span>
                </span>
                <div className="mt-1.5">
                  <div className="font-medium text-xs sm:text-sm text-foreground whitespace-nowrap leading-tight">
                    {expirationDisplay.date}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground leading-tight mt-0.5">
                    {expirationDisplay.time}
                  </div>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-background/80 border border-border/60 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <User className="size-3 text-accent shrink-0" />
                  <span>Sub-Admin</span>
                </span>
                <div className="mt-1.5">
                  <div className="font-mono font-medium text-xs sm:text-sm text-foreground whitespace-nowrap leading-tight truncate">
                    @{username || "To be created"}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {isUsernameLocked ? "Locked" : "Configurable"}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Details if Invalid */}
            {!coverageCheck.isValid && (
              <div className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{coverageCheck.message}</span>
              </div>
            )}

            {/* If Plan is unlocked (self-service / direct flow) */}
            {!lockedPlan && (
              <div className="pt-2 border-t border-accent/15">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">
                  Choose Subscription Duration:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(["12h", "1day", "3days", "1week", "1month", "1year"] as const).map((tierKey) => {
                    const info = PLAN_DETAILS[tierKey];
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => setSelectedPlan(tierKey)}
                        className={`p-1.5 rounded-md border text-center transition-all cursor-pointer ${
                          selectedPlan === tierKey
                            ? "border-accent bg-accent/20 text-accent font-semibold ring-1 ring-accent"
                            : "border-border/60 hover:border-border text-muted-foreground bg-background/70"
                        }`}
                      >
                        <div className="text-[11px] leading-tight">{info.title}</div>
                        <div className="text-[10px] opacity-80">{info.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION B: INTERACTIVE FORM (FIELDS TO BE FILLED)                         */}
          {/* ========================================================================= */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Wedding & Gallery Setup */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                <span className="size-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Wedding &amp; Gallery Details
                </h2>
              </div>

              {/* Couple Names: Groom & Bride */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 block">
                    Groom's Name <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      placeholder="e.g. Alex"
                      value={groomName}
                      onChange={handleGroomNameChange}
                      className="pr-10 h-10 text-xs rounded-lg"
                    />
                    <User className="size-4 absolute right-3 top-3 text-accent/60 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 block">
                    Bride's Name <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      placeholder="e.g. Rihana"
                      value={brideName}
                      onChange={handleBrideNameChange}
                      className="pr-10 h-10 text-xs rounded-lg"
                    />
                    <Heart className="size-4 absolute right-3 top-3 text-accent/60 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Custom URL Slug */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <span>Gallery URL Slug</span>
                    <span className="text-accent">*</span>
                    <InfoTooltip content="Unique web address for your wedding gallery to share with your guests." />
                  </label>
                  <span className="text-[11px] text-accent font-mono truncate max-w-[140px] sm:max-w-[220px]">
                    {displayDomain}/{slug || "your-slug"}
                  </span>
                </div>

                <div className="relative flex rounded-lg shadow-2xs">
                  <span className="inline-flex items-center px-2.5 sm:px-3 rounded-l-lg border border-r-0 border-input bg-muted/50 text-[11px] sm:text-xs font-mono text-muted-foreground select-none shrink-0 max-w-[140px] sm:max-w-none truncate">
                    {displayDomain}/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="alex&rihana"
                    value={slug}
                    onChange={handleSlugChange}
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-r-lg text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all h-10"
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

                {/* Slug Status Feedback */}
                {slugStatus && (
                  <div
                    className={`mt-1.5 text-xs flex items-center gap-1.5 ${
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

              {/* Event Schedule: Wedding Date & Start Activation (Shadcn Date & Time Pickers) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-accent" />
                    <span>Wedding Date</span>
                    <span className="text-accent">*</span>
                    <InfoTooltip content="The official celebration date for your wedding." />
                  </label>
                  <Popover open={isWeddingPickerOpen} onOpenChange={setIsWeddingPickerOpen}>
                    <PopoverTrigger
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-start text-left font-normal h-10 px-3 cursor-pointer border-input bg-background/50 hover:bg-muted/40 text-xs rounded-lg",
                        !weddingDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 size-4 text-accent/70 shrink-0" />
                      <span className="truncate">
                        {selectedWeddingDateObj
                          ? format(selectedWeddingDateObj, "PPP")
                          : "Select wedding date"}
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <ShadcnCalendar
                        mode="single"
                        selected={selectedWeddingDateObj}
                        onSelect={(date) => {
                          handleSelectWeddingDate(date);
                          setIsWeddingPickerOpen(false);
                        }}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-accent" />
                      <span>Start Activation</span>
                      <span className="text-accent">*</span>
                      <InfoTooltip content="The exact date and time your live photo booth and portal will become accessible." />
                    </label>
                    <span className="text-[10px] text-accent font-medium font-mono">
                      {getPlanDurationLabel(selectedPlan)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Popover open={isActivationPickerOpen} onOpenChange={setIsActivationPickerOpen}>
                        <PopoverTrigger
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full justify-start text-left font-normal h-10 px-3 cursor-pointer border-input bg-background/50 hover:bg-muted/40 text-xs rounded-lg",
                            !activationDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 size-4 text-accent/70 shrink-0" />
                          <span className="truncate text-xs">
                            {activationDate ? format(activationDate, "MMM d, yyyy") : "Start date"}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <ShadcnCalendar
                            mode="single"
                            selected={activationDate}
                            onSelect={(date) => {
                              handleSelectActivationDate(date);
                              setIsActivationPickerOpen(false);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const day = new Date(date);
                              day.setHours(0, 0, 0, 0);
                              if (day < today) return true;

                              // Prevent selecting activation date after the wedding date
                              if (selectedWeddingDateObj) {
                                const weddingDay = new Date(selectedWeddingDateObj);
                                weddingDay.setHours(0, 0, 0, 0);
                                if (day > weddingDay) return true;
                              }
                              return false;
                            }}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="w-[125px] shrink-0">
                      <TimePicker
                        value={activationTime}
                        onChange={handleActivationTimeChange}
                        className="h-10 text-xs rounded-lg w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Sub-Admin Login Credentials */}
            <div className="space-y-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                <span className="size-5 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Sub-Admin Account Credentials
                </h2>
              </div>

              {/* Sub-Admin Username & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                      <span>Sub-Admin Username</span>
                      <span className="text-accent">*</span>
                      <InfoTooltip
                        content={
                          isUsernameLocked
                            ? "Your username is assigned to your invitation token and cannot be modified."
                            : "Allowed: lowercase letters, numbers, underscores (_), and dots (.)."
                        }
                      />
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
                      className={`pr-10 font-mono text-xs h-10 rounded-lg ${
                        isUsernameLocked
                          ? "bg-muted/70 cursor-not-allowed select-none text-foreground font-semibold border-dashed"
                          : ""
                      }`}
                    />
                    {isUsernameLocked ? (
                      <Lock className="size-4 absolute right-3 top-3 text-accent pointer-events-none" />
                    ) : (
                      <User className="size-4 absolute right-3 top-3 text-accent/60 pointer-events-none" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <span>Confirmation Email</span>
                    <span className="text-accent">*</span>
                    <InfoTooltip content="Email for portal notifications, receipts, and account support." />
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type="email"
                      placeholder="couple@email.com"
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      className="pr-10 h-10 text-xs rounded-lg"
                    />
                    <Mail className="size-4 absolute right-3 top-3 text-accent/60 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <span>Password</span>
                    <span className="text-accent">*</span>
                    <InfoTooltip content="At least 4 characters to log into your sub-admin portal." />
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pr-10 font-mono text-xs h-10 rounded-lg"
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
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5 block">
                    Confirm Password <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 font-mono text-xs h-10 rounded-lg"
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
            </div>

            {/* Action CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-11 px-5 text-xs font-medium cursor-pointer rounded-lg"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (slugStatus !== null && !slugStatus.available) ||
                  !coverageCheck.isValid
                }
                className="w-full sm:flex-1 h-11 text-xs font-semibold cursor-pointer shadow-sm gap-2 rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Registering Gallery...</span>
                  </>
                ) : (
                  <>
                    <span>Register Sub-Admin Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
