import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { submitCustomerInquiry, checkInquiryAvailability } from "@/api/admin";
import { toast } from "sonner";

export interface WhatsAppInquiryPlan {
  id: string;
  name: string;
  price: string;
  code?: string;
  duration?: string;
  description?: string;
}

export interface WhatsAppInquiryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  plan: WhatsAppInquiryPlan | null;
  onNavigateToSubAdmin?: () => void;
  onBack?: () => void;
}

export const WhatsAppInquiryModal: React.FC<WhatsAppInquiryModalProps> = ({
  isOpen,
  onOpenChange,
  plan,
  onNavigateToSubAdmin,
  onBack,
}) => {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState("");

  // Real-time username availability states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  } | null>(null);

  // Real-time phone uniqueness states
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setPhone("");
      setInquiryError("");
      setIsSubmitting(false);
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      setPhoneStatus(null);
      setIsCheckingPhone(false);
    }
  }, [isOpen]);

  // Real-time debounced username availability check
  useEffect(() => {
    let active = true;
    const trimmed = username.trim().toLowerCase();

    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(trimmed)) {
      setUsernameStatus({
        checked: true,
        available: false,
        message:
          "Username can only contain lowercase letters, numbers, underscores (_), and dots (.). No spaces.",
      });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkInquiryAvailability({ username: trimmed });
        if (active && res.username) {
          setUsernameStatus({
            checked: true,
            available: res.username.available,
            message: res.username.message,
          });
        }
      } catch (err: any) {
        if (active) {
          console.warn("Failed to check username availability:", err);
        }
      } finally {
        if (active) {
          setIsCheckingUsername(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  // Real-time debounced phone uniqueness check
  useEffect(() => {
    let active = true;
    const trimmed = phone.trim();
    const digits = trimmed.replace(/\D/g, "");

    if (!digits || digits.length < 8) {
      setPhoneStatus(null);
      setIsCheckingPhone(false);
      return;
    }

    setIsCheckingPhone(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkInquiryAvailability({ phone: digits });
        if (active && res.phone) {
          setPhoneStatus({
            checked: true,
            available: res.phone.available,
            message: res.phone.message,
          });
        }
      } catch (err: any) {
        if (active) {
          console.warn("Failed to check phone availability:", err);
        }
      } finally {
        if (active) {
          setIsCheckingPhone(false);
        }
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setInquiryError("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(trimmedUsername)) {
      setInquiryError(
        "Username can only contain lowercase letters, numbers, underscores (_), and dots (.). No spaces."
      );
      return;
    }

    // Verify username availability before proceeding
    if (usernameStatus?.checked && !usernameStatus.available) {
      setInquiryError(usernameStatus.message || "Username is already taken. Please choose another.");
      return;
    }

    const sanitizedDigits = trimmedPhone.replace(/\D/g, "");
    if (sanitizedDigits.length < 8) {
      setInquiryError("Please enter a valid phone number (at least 8 digits).");
      return;
    }

    // Verify phone uniqueness before proceeding
    if (phoneStatus?.checked && !phoneStatus.available) {
      setInquiryError(phoneStatus.message || "This phone number has already submitted an inquiry.");
      return;
    }

    setInquiryError("");
    setIsSubmitting(true);

    try {
      await submitCustomerInquiry({
        username: trimmedUsername,
        phone: trimmedPhone,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
      });

      const planLabel = plan.code || `${plan.name} (${plan.price})`;
      const message = `Hi Fotokita! I am ${trimmedUsername} (${trimmedPhone}). I am interested in the ${planLabel} package for payment & deals.`;
      const waUrl = `https://wa.me/60137848933?text=${encodeURIComponent(message)}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success("Details received! Connecting you to Fotokita Admin on WhatsApp.");
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to submit inquiry. Please try again.";
      setInquiryError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-4 top-4 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer h-8 px-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>Plans</span>
          </Button>
        )}

        <DialogHeader>
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="size-6" />
          </div>
          <DialogTitle className="text-center font-serif text-2xl font-normal text-foreground">
            Get Started via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Please enter your details below. Our admin team will receive your inquiry and assist you directly on WhatsApp with deals and payment.
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Selected Plan Summary Card */}
            <div className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Selected Package
                </div>
                <div className="font-serif text-base font-medium text-foreground">
                  {plan.code || plan.name}
                </div>
              </div>
              <Badge variant="outline" className="text-sm font-semibold border-accent/40 text-accent font-mono">
                {plan.price}
              </Badge>
            </div>

            {/* Input Fields */}
            <div className="space-y-3">
              {/* Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    <span>Username</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Letters, numbers, _ and .
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    required
                    placeholder="e.g. ainafarhana"
                    value={username}
                    onChange={(e) => {
                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                      setUsername(cleaned);
                      if (inquiryError) setInquiryError("");
                    }}
                    className={`h-10 text-sm font-mono pr-9 transition-colors ${
                      usernameStatus?.checked
                        ? usernameStatus.available
                          ? "border-emerald-500/70 focus-visible:ring-emerald-500/30"
                          : "border-destructive/80 focus-visible:ring-destructive/30"
                        : ""
                    }`}
                    disabled={isSubmitting}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="absolute right-3 top-3 flex items-center pointer-events-none">
                    {isCheckingUsername ? (
                      <Loader2 className="size-4 text-accent animate-spin" />
                    ) : usernameStatus?.checked ? (
                      usernameStatus.available ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )
                    ) : null}
                  </div>
                </div>

                {/* Direct Username Availability Feedback */}
                {usernameStatus?.checked && (
                  <div
                    className={`text-[11px] flex items-center gap-1.5 transition-all ${
                      usernameStatus.available
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-destructive font-medium"
                    }`}
                  >
                    {usernameStatus.available ? (
                      <CheckCircle2 className="size-3.5 shrink-0" />
                    ) : (
                      <XCircle className="size-3.5 shrink-0" />
                    )}
                    <span>
                      {usernameStatus.message ||
                        (usernameStatus.available
                          ? "Username is available!"
                          : "Username is already taken. Please choose another.")}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  This username will be locked and assigned to your registration link.
                </p>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>WhatsApp Phone Number</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="tel"
                    required
                    placeholder="e.g. 012-3456789"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (inquiryError) setInquiryError("");
                    }}
                    className={`h-10 text-sm pr-9 transition-colors ${
                      phoneStatus?.checked && !phoneStatus.available
                        ? "border-destructive/80 focus-visible:ring-destructive/30"
                        : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-3 top-3 flex items-center pointer-events-none">
                    {isCheckingPhone ? (
                      <Loader2 className="size-4 text-accent animate-spin" />
                    ) : phoneStatus?.checked ? (
                      phoneStatus.available ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )
                    ) : null}
                  </div>
                </div>

                {/* Direct Phone Duplication Feedback */}
                {phoneStatus?.checked && !phoneStatus.available && (
                  <div className="text-[11px] flex items-center gap-1.5 text-destructive font-medium">
                    <XCircle className="size-3.5 shrink-0" />
                    <span>
                      {phoneStatus.message || "This phone number has already submitted an inquiry."}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  Used to identify your order and connect with you on WhatsApp.
                </p>
              </div>
            </div>

            {inquiryError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {inquiryError}
              </div>
            )}

            {/* Privacy Notice */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your inquiry will be logged directly into our Admin Portal first, followed by opening WhatsApp to finalize payment &amp; issue your 24-hour single-use activation link.
              </span>
            </div>

            {/* Direct WhatsApp Action Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isCheckingUsername ||
                (usernameStatus?.checked && !usernameStatus.available) ||
                (phoneStatus?.checked && !phoneStatus.available)
              }
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer select-none gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting Inquiry...</span>
                </>
              ) : usernameStatus?.checked && !usernameStatus.available ? (
                <>
                  <XCircle className="size-4" />
                  <span>Username Already Taken</span>
                </>
              ) : phoneStatus?.checked && !phoneStatus.available ? (
                <>
                  <XCircle className="size-4" />
                  <span>Phone Already Registered</span>
                </>
              ) : (
                <>
                  <MessageCircle className="size-5" />
                  <span>Contact Admin on WhatsApp</span>
                </>
              )}
            </Button>

            {/* Sub-Admin portal login shortcut */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  if (onNavigateToSubAdmin) {
                    onNavigateToSubAdmin();
                  } else {
                    window.location.href = "/subadmin";
                  }
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
              >
                Already registered? Login to Sub-Admin Portal
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
