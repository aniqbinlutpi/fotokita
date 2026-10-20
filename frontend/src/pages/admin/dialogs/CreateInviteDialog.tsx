import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Sparkles,
  Clock,
  Check,
  Copy,
  MessageCircle,
  Receipt,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  Phone,
  ExternalLink,
  Calendar,
} from "lucide-react";
import type { AdminInvite, SubscriptionTier } from "@/api/admin";
import {
  formatTierLabel,
  getWhatsAppShareUrl,
  getWhatsAppMessageText,
  formatWhatsAppPhone,
  extractPhoneFromText,
} from "../utils";
import { toast } from "sonner";

export interface ReceiptUploadFile {
  data: string;
  name: string;
  type: string;
  size: number;
}

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteTier: SubscriptionTier;
  onInviteTierChange: (tier: SubscriptionTier) => void;
  inviteClientName: string;
  onInviteClientNameChange: (name: string) => void;
  inviteClientPhone: string;
  onInviteClientPhoneChange: (phone: string) => void;
  inviteWeddingDate?: string;
  onInviteWeddingDateChange?: (date: string) => void;
  invitePlanStartDate?: string;
  onInvitePlanStartDateChange?: (date: string) => void;
  inviteNotes: string;
  onInviteNotesChange: (notes: string) => void;
  receiptFile: ReceiptUploadFile | null;
  onReceiptFileChange: (file: ReceiptUploadFile | null) => void;
  isCreatingInvite: boolean;
  onSubmit: (e: React.FormEvent) => void;
  newlyCreatedInvite: AdminInvite | null;
  onResetNewlyCreated: () => void;
  copiedInviteId: string | null;
  onCopyInviteUrl: (token: string, id: string) => void;
}

export function CreateInviteDialog({
  open,
  onOpenChange,
  inviteTier,
  onInviteTierChange,
  inviteClientName,
  onInviteClientNameChange,
  inviteClientPhone,
  onInviteClientPhoneChange,
  inviteWeddingDate = "",
  onInviteWeddingDateChange,
  invitePlanStartDate = "",
  onInvitePlanStartDateChange,
  inviteNotes,
  onInviteNotesChange,
  receiptFile,
  onReceiptFileChange,
  isCreatingInvite,
  onSubmit,
  newlyCreatedInvite,
  onResetNewlyCreated,
  copiedInviteId,
  onCopyInviteUrl,
}: CreateInviteDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState(inviteClientPhone || "");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isWeddingPickerOpen, setIsWeddingPickerOpen] = useState(false);
  const [isActivationPickerOpen, setIsActivationPickerOpen] = useState(false);

  const selectedWeddingDateObj = React.useMemo(() => {
    if (!inviteWeddingDate) return undefined;
    const parts = inviteWeddingDate.split("-").map(Number);
    const [y, m, d] = parts;
    if (y && m && d) return new Date(y, m - 1, d);
    const date = new Date(inviteWeddingDate);
    return isNaN(date.getTime()) ? undefined : date;
  }, [inviteWeddingDate]);

  const activationDate = React.useMemo(() => {
    if (!invitePlanStartDate) return undefined;
    const datePart = invitePlanStartDate.split("T")[0];
    if (!datePart) return undefined;
    const parts = datePart.split("-").map(Number);
    const [y, m, d] = parts;
    if (y && m && d) return new Date(y, m - 1, d);
    const date = new Date(invitePlanStartDate);
    return isNaN(date.getTime()) ? undefined : date;
  }, [invitePlanStartDate]);

  const activationTime = React.useMemo(() => {
    if (!invitePlanStartDate) return "08:00";
    const parts = invitePlanStartDate.split("T");
    return parts[1] ? parts[1].slice(0, 5) : "08:00";
  }, [invitePlanStartDate]);

  const handleSelectWeddingDate = (date: Date | undefined) => {
    if (!date) {
      onInviteWeddingDateChange?.("");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    onInviteWeddingDateChange?.(dateStr);

    if (invitePlanStartDate) {
      const weddingMidnight = new Date(date);
      weddingMidnight.setHours(23, 59, 59, 999);
      const currentStart = new Date(invitePlanStartDate);
      if (currentStart.getTime() > weddingMidnight.getTime()) {
        onInvitePlanStartDateChange?.("");
      }
    }
  };

  const handleSelectActivationDate = (date: Date | undefined) => {
    if (!date) {
      onInvitePlanStartDateChange?.("");
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    onInvitePlanStartDateChange?.(`${dateStr}T${activationTime}`);
  };

  const handleActivationTimeChange = (time: string) => {
    if (invitePlanStartDate) {
      const datePart = invitePlanStartDate.split("T")[0];
      onInvitePlanStartDateChange?.(`${datePart}T${time}`);
    } else if (inviteWeddingDate) {
      onInvitePlanStartDateChange?.(`${inviteWeddingDate}T${time}`);
    }
  };

  useEffect(() => {
    if (newlyCreatedInvite) {
      const extracted =
        newlyCreatedInvite.clientPhone ||
        inviteClientPhone ||
        extractPhoneFromText(newlyCreatedInvite.notes);
      setTargetPhone(extracted || "");
    } else {
      setTargetPhone(inviteClientPhone || "");
    }
  }, [newlyCreatedInvite, inviteClientPhone]);

  const processFile = (file: File) => {
    setUploadError(null);
    const validExtensions = /\.(png|jpe?g|webp|heic|pdf)$/i;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf && !validExtensions.test(file.name)) {
      setUploadError("Please upload an image (PNG, JPG, WEBP) or PDF receipt.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Receipt file exceeds 10MB size limit. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onReceiptFileChange({
        data: reader.result as string,
        name: file.name,
        type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        size: file.size,
      });
    };
    reader.onerror = () => {
      setUploadError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setUploadError("Payment receipt is required before generating an invite link.");
      return;
    }
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="size-4 text-accent" />
            <span>Generate Invite Link</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure subscription tier, client details, and activation schedule for this single-use link.
          </DialogDescription>
        </DialogHeader>

        {!newlyCreatedInvite ? (
          <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
            {/* 1. Subscription Tier Selection */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Subscription Plan *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { tier: "12h", name: "12 Hours", price: "RM 6" },
                  { tier: "1day", name: "Whole Day", price: "RM 10" },
                  { tier: "3days", name: "3 Days", price: "RM 17" },
                  { tier: "1week", name: "1 Week", price: "RM 23" },
                  { tier: "1month", name: "1 Month", price: "RM 46" },
                  { tier: "1year", name: "1 Year Special", price: "RM 189" },
                ].map((item) => (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => onInviteTierChange(item.tier as SubscriptionTier)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      inviteTier === item.tier
                        ? "border-accent bg-accent/10 ring-1 ring-accent text-accent font-semibold"
                        : "border-border hover:border-accent/40 bg-card/60 text-foreground"
                    }`}
                  >
                    <div className="text-xs font-semibold leading-tight">{item.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Client Details (Username & WhatsApp in a clean 2-col row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Username *
                </label>
                <Input
                  placeholder="e.g. ainafarhana"
                  value={inviteClientName}
                  onChange={(e) =>
                    onInviteClientNameChange(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                    )
                  }
                  className="font-mono text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Phone className="size-3 text-accent" />
                  <span>WhatsApp</span>
                </label>
                <Input
                  placeholder="e.g. 0123456789"
                  value={inviteClientPhone}
                  onChange={(e) => onInviteClientPhoneChange(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>
            </div>

            {/* 3. Event & Start Time (Matching Wedding & Activation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-accent" />
                  <span>Wedding Date</span>
                </label>
                <Popover open={isWeddingPickerOpen} onOpenChange={setIsWeddingPickerOpen}>
                  <PopoverTrigger
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal h-9 px-3 cursor-pointer border-input bg-background/50 hover:bg-muted/40 text-xs rounded-md",
                      !inviteWeddingDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 size-3.5 text-accent/70 shrink-0" />
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

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-accent" />
                  <span>Activation Time</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Popover open={isActivationPickerOpen} onOpenChange={setIsActivationPickerOpen}>
                      <PopoverTrigger
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full justify-start text-left font-normal h-9 px-3 cursor-pointer border-input bg-background/50 hover:bg-muted/40 text-xs rounded-md",
                          !activationDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 size-3.5 text-accent/70 shrink-0" />
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
                      className="h-9 text-xs rounded-md w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Payment Receipt Upload */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="size-3 text-accent" />
                  <span>Payment Receipt *</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Image / PDF (Max 10MB)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {!receiptFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    isDragging
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50 hover:bg-muted/30"
                  }`}
                >
                  <UploadCloud className="size-4 text-accent shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Click to upload payment receipt (QR / Bank Transfer)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    {receiptFile.type.includes("pdf") ? (
                      <div className="size-7 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <FileText className="size-4" />
                      </div>
                    ) : (
                      <img
                        src={receiptFile.data}
                        alt="Receipt preview"
                        className="size-7 rounded object-cover border shrink-0 bg-background"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate max-w-[220px] sm:max-w-[280px]">
                        {receiptFile.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(receiptFile.size / 1024).toFixed(0)} KB • Receipt ready for audit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs px-2"
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onReceiptFileChange(null)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* 5. Internal Notes (Optional) */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Notes / Reference (Optional)
              </label>
              <Input
                placeholder="e.g. DuitNow QR RM10"
                value={inviteNotes}
                onChange={(e) => onInviteNotesChange(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreatingInvite}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingInvite || !receiptFile || !inviteClientName.trim()}
                className="h-8 text-xs gap-1.5"
              >
                <Sparkles className="size-3.5" />
                <span>{isCreatingInvite ? "Generating..." : "Generate 24h Link"}</span>
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Newly Created Link View */
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                24-Hour Registration Link Generated Successfully!
              </h3>
              <p className="text-xs text-muted-foreground">
                Package <strong>{formatTierLabel(newlyCreatedInvite.tier)}</strong> is locked to this link.
              </p>
              {(newlyCreatedInvite.receiptFilename || receiptFile?.name) && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Receipt className="size-3" />
                  <span>
                    Receipt saved: {newlyCreatedInvite.receiptFilename || receiptFile?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Official Registration Link
              </label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/register?token=${newlyCreatedInvite.token}`}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button
                  type="button"
                  onClick={() =>
                    onCopyInviteUrl(newlyCreatedInvite.token, newlyCreatedInvite.id)
                  }
                  className="shrink-0 gap-1.5 text-xs"
                >
                  {copiedInviteId === newlyCreatedInvite.id ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>Copy</span>
                </Button>
              </div>
            </div>

            {/* WhatsApp Direct Share Section */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Send Invitation via WhatsApp
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Direct WhatsApp chat with pre-filled package details and 24h link
                    </p>
                  </div>
                </div>
              </div>

              {/* Client WhatsApp Number Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Phone className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Client WhatsApp Number</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    e.g. 0123456789
                  </span>
                </div>
                <Input
                  placeholder="e.g. 0123456789 or 60123456789"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="font-mono text-xs bg-background"
                />
                <div className="text-[10px] flex items-center justify-between">
                  <span>
                    {formatWhatsAppPhone(targetPhone) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Will open chat with +{formatWhatsAppPhone(targetPhone)}
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        ⚠️ Enter phone number to pre-fill message in WhatsApp
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">Format: 01xxxxxxxx</span>
                </div>
              </div>

              {/* Live Message Preview */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Message Preview
                </label>
                <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/10 text-[11px] font-sans leading-relaxed text-foreground whitespace-pre-wrap select-all">
                  {getWhatsAppMessageText(newlyCreatedInvite)}
                </div>
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    const cleanPhone = formatWhatsAppPhone(targetPhone);
                    const message = getWhatsAppMessageText(newlyCreatedInvite);

                    // Always copy message to clipboard as a fallback
                    navigator.clipboard.writeText(message);

                    if (!cleanPhone) {
                      toast.error(
                        "Please enter client's WhatsApp phone number above to open direct chat, or paste the copied message!",
                        { duration: 4000 }
                      );
                      return;
                    }

                    const shareUrl = getWhatsAppShareUrl(newlyCreatedInvite, cleanPhone);
                    window.open(shareUrl, "_blank", "noopener,noreferrer");
                    toast.success(
                      `Opening WhatsApp for +${cleanPhone}! (Full message also copied to clipboard)`,
                      { duration: 3500 }
                    );
                  }}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider h-10 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span>Send to Client via WhatsApp</span>
                  <ExternalLink className="size-3.5 opacity-70" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const message = getWhatsAppMessageText(newlyCreatedInvite);
                    navigator.clipboard.writeText(message);
                    setCopiedMessage(true);
                    toast.success("Full WhatsApp message copied to clipboard!");
                    setTimeout(() => setCopiedMessage(false), 2000);
                  }}
                  className="gap-1.5 text-xs h-10 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                >
                  {copiedMessage ? (
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedMessage ? "Message Copied!" : "Copy Full Message"}</span>
                </Button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onResetNewlyCreated}
                className="w-full text-xs uppercase tracking-wider cursor-pointer"
              >
                Generate Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
