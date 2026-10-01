import React from "react";
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
import { UserPlus, Sparkles, Clock, Check, Copy, MessageCircle } from "lucide-react";
import type { AdminInvite, SubscriptionTier } from "@/api/admin";
import { formatTierLabel, getWhatsAppShareUrl } from "../utils";

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteTier: SubscriptionTier;
  onInviteTierChange: (tier: SubscriptionTier) => void;
  inviteClientName: string;
  onInviteClientNameChange: (name: string) => void;
  inviteNotes: string;
  onInviteNotesChange: (notes: string) => void;
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
  inviteNotes,
  onInviteNotesChange,
  isCreatingInvite,
  onSubmit,
  newlyCreatedInvite,
  onResetNewlyCreated,
  copiedInviteId,
  onCopyInviteUrl,
}: CreateInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-accent" />
            <span>Jana Link Pendaftaran Tenant</span>
          </DialogTitle>
          <DialogDescription>
            Hasilkan pautan pendaftaran 24 jam berserta pakej langganan yang dikunci khas untuk pelanggan selepas mereka membuat bayaran QR.
          </DialogDescription>
        </DialogHeader>

        {!newlyCreatedInvite ? (
          <form onSubmit={onSubmit} className="space-y-5 py-2">
            {/* 1. Subscription Tier Selection */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Select Subscription Plan *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div
                  onClick={() => onInviteTierChange("12h")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "12h"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">12 Hours</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 6</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Short event &amp; ceremony
                  </div>
                </div>

                <div
                  onClick={() => onInviteTierChange("1day")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "1day"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">Whole Day</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 10</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Full-day wedding banquet
                  </div>
                </div>

                <div
                  onClick={() => onInviteTierChange("3days")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "3days"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">3 Days</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 17</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Weekend solemnization &amp; reception
                  </div>
                </div>

                <div
                  onClick={() => onInviteTierChange("1week")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "1week"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">1 Week</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 23</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Full week multi-event coverage
                  </div>
                </div>

                <div
                  onClick={() => onInviteTierChange("1month")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "1month"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">1 Month</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 46</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Relaxed access &amp; downloads
                  </div>
                </div>

                <div
                  onClick={() => onInviteTierChange("1year")}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    inviteTier === "1year"
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">1 Year Special</div>
                  <div className="text-xs text-accent font-medium mt-0.5">RM 189</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Photographer, Hall &amp; Organizer
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tenant Username (Locked for Tenant Registration) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Tenant Username (Auto-filled &amp; Locked)
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  letters, numbers, _ and .
                </span>
              </div>
              <Input
                placeholder="e.g. ainafarhana"
                value={inviteClientName}
                onChange={(e) =>
                  onInviteClientNameChange(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                  )
                }
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                This username will be locked to the link and non-modifiable during tenant registration.
              </p>
            </div>

            {/* 3. Internal Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Internal Notes / Payment Reference (Optional)
              </label>
              <Input
                placeholder="e.g. DuitNow QR RM10 (Verified on WhatsApp)"
                value={inviteNotes}
                onChange={(e) => onInviteNotesChange(e.target.value)}
              />
            </div>

            {/* Safety notice */}
            <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground flex items-start gap-2">
              <Clock className="size-4 text-accent shrink-0 mt-0.5" />
              <span>
                <strong>24-Hour Expiry &amp; Single-Use:</strong> This link automatically expires after 24 hours and is burned immediately once the client registers.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreatingInvite}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingInvite}
                className="gap-2 cursor-pointer"
              >
                <Sparkles className="size-4" />
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

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <a
                href={getWhatsAppShareUrl(newlyCreatedInvite)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <MessageCircle className="size-4" />
                <span>Send to Client via WhatsApp</span>
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={onResetNewlyCreated}
                className="text-xs uppercase tracking-wider"
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
