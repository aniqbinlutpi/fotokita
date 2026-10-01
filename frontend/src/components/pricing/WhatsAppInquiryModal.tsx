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
  ArrowLeft,
} from "lucide-react";
import { submitCustomerInquiry } from "@/api/admin";
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

  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setPhone("");
      setInquiryError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

    const sanitizedDigits = trimmedPhone.replace(/\D/g, "");
    if (sanitizedDigits.length < 8) {
      setInquiryError("Please enter a valid phone number (at least 8 digits).");
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
                  className="h-10 text-sm font-mono"
                  disabled={isSubmitting}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-[11px] text-muted-foreground">
                  This username will be locked and assigned to your registration link.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>WhatsApp Phone Number</span>
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="e.g. 012-3456789"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (inquiryError) setInquiryError("");
                  }}
                  className="h-10 text-sm"
                  disabled={isSubmitting}
                />
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
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-widest transition-all shadow-md hover:shadow-lg cursor-pointer select-none gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting Inquiry...</span>
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
