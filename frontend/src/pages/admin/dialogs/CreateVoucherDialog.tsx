import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Sparkles, Loader2, DollarSign, Percent, Calendar as CalendarIcon, Users } from "lucide-react";
import type { VoucherDiscountType } from "@/api/admin";
import { toast } from "sonner";
import { cn } from "cn";

interface CreateVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    code: string;
    discountType: VoucherDiscountType;
    discountValue: number;
    usageLimit: number | null;
    expiresAt: string | null;
    description: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateVoucherDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateVoucherDialogProps) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<VoucherDiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState("5");
  const [isLimited, setIsLimited] = useState(true);
  const [usageLimit, setUsageLimit] = useState("10");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = () => {
    setCode("");
    setDiscountType("fixed");
    setDiscountValue("5");
    setIsLimited(true);
    setUsageLimit("10");
    setHasExpiry(false);
    setExpiresAt("");
    setDescription("");
    setErrorMsg("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    if (!cleanCode || cleanCode.length < 2) {
      setErrorMsg("Voucher code must be at least 2 characters.");
      return;
    }

    const valueNum = parseFloat(discountValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setErrorMsg("Discount value must be greater than 0.");
      return;
    }

    if (discountType === "percentage" && valueNum > 100) {
      setErrorMsg("Percentage discount cannot exceed 100%.");
      return;
    }

    let parsedLimit: number | null = null;
    if (isLimited) {
      const l = parseInt(usageLimit, 10);
      if (isNaN(l) || l <= 0) {
        setErrorMsg("Please enter a valid usage limit (at least 1 user).");
        return;
      }
      parsedLimit = l;
    }

    let parsedExpiry: string | null = null;
    if (hasExpiry && expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        setErrorMsg("Please choose a valid expiration date.");
        return;
      }
      parsedExpiry = expDate.toISOString();
    }

    setErrorMsg("");

    try {
      await onSubmit({
        code: cleanCode,
        discountType,
        discountValue: valueNum,
        usageLimit: parsedLimit,
        expiresAt: parsedExpiry,
        description: description.trim(),
      });
      handleReset();
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to create voucher");
      toast.error(err?.message || "Failed to create voucher");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleReset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
            <Ticket className="size-4.5" />
          </div>
          <DialogTitle className="text-xl font-bold">Create Voucher Code</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure promo codes with fixed RM discounts or percentage off, and enforce per-user usage limits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          {/* Voucher Code */}
          <div className="space-y-1.5">
            <label htmlFor="voucher-code" className="text-xs font-semibold block text-foreground">
              Voucher Code
            </label>
            <div className="relative">
              <Input
                id="voucher-code"
                type="text"
                required
                placeholder="e.g. FOTOKITA5 or RAYA10"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg("");
                }}
                disabled={isSubmitting}
                className="font-mono uppercase tracking-wider text-sm font-bold"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Couples enter this code during checkout/inquiry to redeem savings.
            </p>
          </div>

          {/* Discount Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block text-foreground">Discount Type</label>
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg gap-1 border">
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={cn(
                  "text-xs py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  discountType === "fixed"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <DollarSign className="size-3.5" />
                <span>Fixed Amount (RM)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType("percentage");
                  if (parseFloat(discountValue) > 100) {
                    setDiscountValue("10");
                  }
                }}
                className={cn(
                  "text-xs py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  discountType === "percentage"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Percent className="size-3.5" />
                <span>Percentage (%)</span>
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div className="space-y-1.5">
            <label htmlFor="discount-value" className="text-xs font-semibold block text-foreground">
              {discountType === "fixed" ? "Discount Amount (RM)" : "Discount Percentage (%)"}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-semibold text-muted-foreground">
                {discountType === "fixed" ? "RM" : "%"}
              </span>
              <Input
                id="discount-value"
                type="number"
                min="0.1"
                step={discountType === "fixed" ? "0.5" : "1"}
                max={discountType === "percentage" ? "100" : undefined}
                required
                placeholder={discountType === "fixed" ? "5" : "10"}
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                disabled={isSubmitting}
                className="pl-10 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Usage Limit Section */}
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Users className="size-3.5 text-muted-foreground" />
                <span>Usage Limit (Max Redemptions)</span>
              </label>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!isLimited}
                  onChange={(e) => setIsLimited(!e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-3.5"
                />
                <span>Unlimited Users</span>
              </label>
            </div>

            {isLimited && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required={isLimited}
                  placeholder="e.g. 10"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  first couples only
                </span>
              </div>
            )}
          </div>

          {/* Expiration Date Section */}
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span>Expiration Date</span>
              </label>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-3.5"
                />
                <span>Set Expiry</span>
              </label>
            </div>

            {hasExpiry && (
              <Input
                type="date"
                required={hasExpiry}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              />
            )}
          </div>

          {/* Description / Notes */}
          <div className="space-y-1.5 pt-1 border-t">
            <label htmlFor="voucher-desc" className="text-xs font-semibold block text-foreground">
              Campaign Notes (Optional)
            </label>
            <Input
              id="voucher-desc"
              type="text"
              placeholder="e.g. Flash sale for IG campaign or promo for 10 users"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !code.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs cursor-pointer gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Create Voucher</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
