import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  MessageCircle,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "cn";
import { submitCustomerInquiry, checkInquiryAvailability } from "@/api/admin";
import {
  getPlanDurationLabelEn,
  calculatePlanEndDate,
  validatePlanCoverageEn,
} from "@/lib/planDuration";
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

  const [weddingDate, setWeddingDate] = useState("");
  const [activationDate, setActivationDate] = useState<Date | undefined>(undefined);
  const [activationTime, setActivationTime] = useState("08:00");
  const [planStartDate, setPlanStartDate] = useState("");

  // Popover controls for date pickers
  const [isWeddingPickerOpen, setIsWeddingPickerOpen] = useState(false);
  const [isActivationPickerOpen, setIsActivationPickerOpen] = useState(false);

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
      setWeddingDate("");
      setActivationDate(undefined);
      setActivationTime("08:00");
      setPlanStartDate("");
      setInquiryError("");
      setIsSubmitting(false);
      setUsernameStatus(null);
      setIsCheckingUsername(false);
      setPhoneStatus(null);
      setIsCheckingPhone(false);
      setIsWeddingPickerOpen(false);
      setIsActivationPickerOpen(false);
    }
  }, [isOpen]);

  const handleSelectWeddingDate = (date: Date | undefined) => {
    if (!date) {
      setWeddingDate("");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    setWeddingDate(dateStr);
    if (inquiryError) setInquiryError("");

    const weddingMidnight = new Date(date);
    weddingMidnight.setHours(23, 59, 59, 999);

    // Auto-sync activation date & time to the wedding date if not already set,
    // or if current activationDate is after the new wedding date
    if (!activationDate || activationDate.getTime() > weddingMidnight.getTime()) {
      setActivationDate(date);
      setPlanStartDate(`${dateStr}T${activationTime}`);
    }
  };

  const handleSelectActivationDate = (date: Date | undefined) => {
    setActivationDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      setPlanStartDate(`${dateStr}T${activationTime}`);
    } else {
      setPlanStartDate("");
    }
    if (inquiryError) setInquiryError("");
  };

  const handleActivationTimeChange = (time: string) => {
    setActivationTime(time);
    if (activationDate) {
      const dateStr = format(activationDate, "yyyy-MM-dd");
      setPlanStartDate(`${dateStr}T${time}`);
    }
    if (inquiryError) setInquiryError("");
  };

  const effectiveStartDate = useMemo(() => {
    if (planStartDate) {
      const d = new Date(planStartDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (weddingDate) {
      const d = new Date(`${weddingDate}T08:00`);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [planStartDate, weddingDate]);

  const calculatedEndDate = useMemo(() => {
    return calculatePlanEndDate(plan?.id || "1day", effectiveStartDate);
  }, [plan?.id, effectiveStartDate]);

  const coverageCheck = useMemo(() => {
    return validatePlanCoverageEn(weddingDate, effectiveStartDate, calculatedEndDate);
  }, [weddingDate, effectiveStartDate, calculatedEndDate]);

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
        message: "Only lowercase letters, numbers, underscores, and dots.",
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
            message: res.username.available ? "Username available" : "Username already taken",
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
            message: res.phone.available ? undefined : "Phone already registered",
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
      setInquiryError("Username can only contain lowercase letters, numbers, underscores, and dots.");
      return;
    }

    if (usernameStatus?.checked && !usernameStatus.available) {
      setInquiryError(usernameStatus.message || "Username is taken. Please choose another.");
      return;
    }

    const sanitizedDigits = trimmedPhone.replace(/\D/g, "");
    if (sanitizedDigits.length < 8) {
      setInquiryError("Please enter a valid phone number (at least 8 digits).");
      return;
    }

    if (phoneStatus?.checked && !phoneStatus.available) {
      setInquiryError(phoneStatus.message || "This phone number has already submitted an inquiry.");
      return;
    }

    if (!weddingDate) {
      setInquiryError("Please select your wedding date.");
      return;
    }

    if (!planStartDate) {
      setInquiryError("Please select your gallery activation date & time.");
      return;
    }

    if (!coverageCheck.isValid) {
      const msg = coverageCheck.message || "Plan expiration is before your wedding date.";
      setInquiryError(msg);
      toast.error(msg);
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
        weddingDate,
        planStartDate,
      });

      const planLabel = plan.code || `${plan.name} (${plan.price})`;
      const durationLabel = getPlanDurationLabelEn(plan.id);
      const endFormatted = coverageCheck.endFormatted || format(calculatedEndDate, "PPP p");
      const message = `Hi Fotokita! I'm ${trimmedUsername} (${trimmedPhone}). I would like to book the ${planLabel} package (${durationLabel}).\n\n📅 Wedding Date: ${weddingDate}\n⏱️ Activation: ${planStartDate.replace("T", " ")}\n🏁 Plan Ends: ${endFormatted}\n\nPlease assist with my registration and payment. Thank you!`;
      const waUrl = `https://wa.me/60137848933?text=${encodeURIComponent(message)}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success("Inquiry sent! Connecting you with Fotokita Admin on WhatsApp.");
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to submit inquiry. Please try again.";
      setInquiryError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedWeddingDateObj = useMemo(() => {
    if (!weddingDate) return undefined;
    const parts = weddingDate.split("-").map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return undefined;
  }, [weddingDate]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[92dvh] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl border-border/80 shadow-2xl">
        {/* Top Header */}
        <div className="p-5 pb-3 border-b border-border/40 shrink-0 bg-background/50 backdrop-blur-xs relative">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-3.5 top-3.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer h-7 px-2 rounded-lg"
            >
              <ArrowLeft className="size-3.5" />
              <span>Plans</span>
            </Button>
          )}

          <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="size-5" />
          </div>

          <DialogTitle className="text-center font-serif text-xl sm:text-2xl font-normal text-foreground">
            Get Started via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">
            Reserve your wedding link and get direct activation support.
          </DialogDescription>
        </div>

        {plan && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 overscroll-contain">
              {/* Selected Plan Summary Pill */}
              <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div>
                    <div className="font-serif text-sm font-medium text-foreground leading-tight">
                      {plan.code || plan.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-sans">
                      {getPlanDurationLabelEn(plan.id)}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold border-accent/40 text-accent font-sans px-2.5 py-0.5">
                  {plan.price}
                </Badge>
              </div>

              {/* Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" />
                    <span>Username</span>
                  </label>
                  {usernameStatus?.checked && (
                    <span
                      className={`text-[10px] font-medium flex items-center gap-1 ${
                        usernameStatus.available
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {usernameStatus.available ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <XCircle className="size-3" />
                      )}
                      {usernameStatus.message}
                    </span>
                  )}
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
                    className={`h-10 text-sm font-sans pr-9 transition-colors ${
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
              </div>

              {/* WhatsApp Phone Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span>WhatsApp Number</span>
                  </label>
                  {phoneStatus?.checked && !phoneStatus.available && (
                    <span className="text-[10px] font-medium text-destructive flex items-center gap-1">
                      <XCircle className="size-3" />
                      {phoneStatus.message}
                    </span>
                  )}
                </div>
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
              </div>

              {/* Wedding Event Date — Shadcn UI Date Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  <span>Wedding Date</span>
                </label>
                <Popover open={isWeddingPickerOpen} onOpenChange={setIsWeddingPickerOpen}>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal h-10 px-3 cursor-pointer border-input hover:bg-muted/40",
                      !weddingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {selectedWeddingDateObj
                        ? format(selectedWeddingDateObj, "PPP")
                        : "Select wedding date"}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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

              {/* Gallery Activation Date & Time — Shadcn UI Date Picker + Time Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span>Gallery Activation</span>
                  </label>
                  <span className="text-[10px] text-accent font-medium font-sans">
                    {getPlanDurationLabelEn(plan.id)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-3">
                    <Popover open={isActivationPickerOpen} onOpenChange={setIsActivationPickerOpen}>
                      <PopoverTrigger
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full justify-start text-left font-normal h-10 px-3 cursor-pointer border-input hover:bg-muted/40 font-sans",
                          !activationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-xs">
                          {activationDate ? format(activationDate, "MMM d, yyyy") : "Start date"}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
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
                  <div className="col-span-2">
                    <TimePicker
                      value={activationTime}
                      onChange={handleActivationTimeChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Coverage Status Card */}
              {weddingDate && planStartDate && (
                <div
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    coverageCheck.isValid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between font-medium mb-1">
                    <div className="flex items-center gap-1.5">
                      {coverageCheck.isValid ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="size-3.5 text-destructive shrink-0" />
                      )}
                      <span>
                        {coverageCheck.isValid ? "Coverage Verified" : "Coverage Warning"}
                      </span>
                    </div>
                    <span className="text-[10px] font-sans opacity-80">
                      {getPlanDurationLabelEn(plan.id)}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[11px] opacity-90 mt-1">
                    <div>
                      <span className="opacity-70">Active from:</span>{" "}
                      <span className="font-sans font-medium">
                        {format(effectiveStartDate, "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-70">Until:</span>{" "}
                      <span className="font-sans font-medium">
                        {format(calculatedEndDate, "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                  </div>

                  {!coverageCheck.isValid && (
                    <p className="mt-2 text-[11px] font-medium leading-tight border-t border-destructive/20 pt-1.5">
                      {coverageCheck.message}
                    </p>
                  )}
                </div>
              )}

              {inquiryError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{inquiryError}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 sm:p-5 pt-3 border-t border-border/40 shrink-0 bg-background/50 backdrop-blur-xs space-y-2.5">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isCheckingUsername ||
                  (usernameStatus?.checked && !usernameStatus.available) ||
                  (phoneStatus?.checked && !phoneStatus.available)
                }
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer select-none gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : usernameStatus?.checked && !usernameStatus.available ? (
                  <>
                    <XCircle className="size-4" />
                    <span>Username Taken</span>
                  </>
                ) : phoneStatus?.checked && !phoneStatus.available ? (
                  <>
                    <XCircle className="size-4" />
                    <span>Phone Already Registered</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="size-4.5" />
                    <span>Contact Admin on WhatsApp</span>
                  </>
                )}
              </Button>

              <div className="text-center">
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
                  Already registered? Sign in to Sub-Admin
                </button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
