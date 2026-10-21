import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  Check,
  Copy,
  MessageCircle,
  Trash2,
  Receipt,
} from "lucide-react";
import type { AdminInvite } from "@/api/admin";
import {
  formatTierLabel,
  getWhatsAppMessageText,
  formatWhatsAppPhone,
  extractPhoneFromText,
} from "./utils";
import { toast } from "sonner";

interface AdminTenantInvitesProps {
  hideHeader?: boolean;
  invites: AdminInvite[];
  copiedInviteId: string | null;
  onCopyInviteUrl: (token: string, id: string) => void;
  onDeleteInvite: (id: string) => void;
  onOpenCreateInvite: () => void;
  onViewReceipt: (invite: AdminInvite) => void;
}

export function AdminTenantInvites({
  hideHeader = false,
  invites,
  copiedInviteId,
  onCopyInviteUrl,
  onDeleteInvite,
  onOpenCreateInvite,
  onViewReceipt,
}: AdminTenantInvitesProps) {
  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tenant Invites &amp; Onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate exclusive registration links (24h validity &amp; single-use) based on client&apos;s chosen subscription package after payment.
            </p>
          </div>
          <Button
            onClick={onOpenCreateInvite}
            className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="size-4" />
            <span>Generate New Link</span>
          </Button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Total Links
            </CardTitle>
            <Sparkles className="size-3.5 sm:size-4 text-accent shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{invites.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              All records
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Active Links
            </CardTitle>
            <Clock className="size-3.5 sm:size-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {invites.filter((i) => i.status === "active").length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              24h Window
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Registered
            </CardTitle>
            <CheckCircle2 className="size-3.5 sm:size-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {invites.filter((i) => i.status === "used").length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Used tokens
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Expired
            </CardTitle>
            <AlertTriangle className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {invites.filter((i) => i.status === "expired").length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Past 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invites Table */}
      <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
        <CardHeader className="min-w-0">
          <CardTitle className="text-base font-semibold">
            Tenant Registration Links Directory
          </CardTitle>
          <CardDescription>
            Subscription packages, single-use token validity, and registered tenant profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client / Notes</TableHead>
                <TableHead>Subscription Plan</TableHead>
                <TableHead>Token Status (24h)</TableHead>
                <TableHead>Payment Receipt</TableHead>
                <TableHead>Tenant Registration Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No invite links found. Click &quot;Generate New Link&quot; to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="align-top">
                      <div className="font-medium text-foreground">
                        {inv.clientName || "Unnamed Client"}
                      </div>
                      {inv.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {inv.notes}
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-muted-foreground mt-1">
                        Token: {inv.token.slice(0, 12)}...
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs font-medium border-accent/40 text-accent bg-accent/10"
                      >
                        {formatTierLabel(inv.tier)}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top">
                      {inv.status === "active" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active ({Math.ceil(inv.remainingMinutes / 60)}h left)</span>
                        </div>
                      )}
                      {inv.status === "used" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>Registered</span>
                        </div>
                      )}
                      {inv.status === "expired" && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          <Clock className="size-3" />
                          <span>Expired (&gt;24h)</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      {inv.hasReceipt ? (
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewReceipt(inv)}
                            className="h-7 text-xs gap-1.5 border-accent/40 hover:border-accent text-foreground hover:bg-accent/10 cursor-pointer"
                            title="View payment receipt evidence"
                          >
                            <Receipt className="size-3 text-accent" />
                            <span>Audit Receipt</span>
                          </Button>
                          {inv.receiptFilename && (
                            <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                              {inv.receiptFilename}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No receipt
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      {inv.registrationDetails ? (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1 text-foreground font-mono">
                            <User className="size-3 text-accent" />
                            <span>@{inv.registrationDetails.username}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {inv.registrationDetails.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">Gallery:</span>
                            <a
                              href={`/w/${inv.registrationDetails.weddingSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:underline font-mono text-[11px]"
                            >
                              <span>/{inv.registrationDetails.weddingSlug}</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Awaiting registration
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === "active" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCopyInviteUrl(inv.token, inv.id)}
                              className="h-8 text-xs gap-1.5"
                              title="Copy Registration Link"
                            >
                              {copiedInviteId === inv.id ? (
                                <Check className="size-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              <span className="hidden sm:inline">Copy Link</span>
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const phone =
                                  inv.clientPhone || extractPhoneFromText(inv.notes);
                                const formattedPhone = formatWhatsAppPhone(phone);
                                const message = getWhatsAppMessageText(inv);
                                navigator.clipboard.writeText(message);

                                if (formattedPhone) {
                                  window.open(
                                    `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                  toast.success(
                                    `Opening WhatsApp for +${formattedPhone}! (Full message also copied)`
                                  );
                                } else {
                                  toast.info(
                                    "Full WhatsApp message copied to clipboard! (Paste it directly into WhatsApp)"
                                  );
                                  window.open(
                                    `https://wa.me/?text=${encodeURIComponent(message)}`,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
                              title="Send or Copy WhatsApp Invitation"
                            >
                              <MessageCircle className="size-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteInvite(inv.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer"
                          title="Delete Link"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
