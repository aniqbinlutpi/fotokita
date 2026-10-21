import { cn } from "@/lib/utils";
import {
  Heart,
  MessageSquare,
  UserPlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeddingsDataTable } from "@/components/admin/WeddingsDataTable";
import { AdminInquiries } from "./AdminInquiries";
import { AdminTenantInvites } from "./AdminTenantInvites";
import type { Wedding } from "@/types/wedding";
import type {
  AdminTenantAccount,
  AdminInvite,
  CustomerInquiry,
  InquiryStatus,
} from "@/api/admin";

export type WeddingsHubSubTab = "weddings" | "inquiries" | "invites";

interface AdminWeddingsHubProps {
  subTab: WeddingsHubSubTab;
  onSubTabChange: (tab: WeddingsHubSubTab) => void;
  // Weddings props
  weddings: Wedding[];
  tenantAccounts?: Record<string, AdminTenantAccount>;
  copiedId: string | null;
  onCopyLink: (slug: string, id: string) => void;
  onViewGallery: (slug: string) => void;
  onDeleteWedding: (wedding: Wedding) => void;
  onTogglePreserveMedia?: (weddingId: string, currentVal: boolean) => Promise<void>;
  onTriggerCleanup?: () => Promise<void>;
  isCleaningUp?: boolean;
  // Inquiries props
  inquiries: CustomerInquiry[];
  inquiryFilter: "all" | "pending" | "contacted" | "sent" | "registered" | "converted";
  onInquiryFilterChange: (filter: "all" | "pending" | "contacted" | "sent" | "registered" | "converted") => void;
  isUpdatingInquiryId: string | null;
  onUpdateInquiryStatus: (id: string, status: InquiryStatus) => void;
  onDeleteInquiry: (id: string) => void;
  onConvertInquiry: (inquiry: CustomerInquiry) => void;
  // Invites props
  invites: AdminInvite[];
  copiedInviteId: string | null;
  onCopyInviteUrl: (token: string, id: string) => void;
  onDeleteInvite: (id: string) => void;
  onViewReceipt: (invite: AdminInvite) => void;
  // Global actions
  onOpenCreateInvite: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AdminWeddingsHub({
  subTab,
  onSubTabChange,
  weddings,
  tenantAccounts,
  copiedId,
  onCopyLink,
  onViewGallery,
  onDeleteWedding,
  onTogglePreserveMedia,
  onTriggerCleanup,
  isCleaningUp,
  inquiries,
  inquiryFilter,
  onInquiryFilterChange,
  isUpdatingInquiryId,
  onUpdateInquiryStatus,
  onDeleteInquiry,
  onConvertInquiry,
  invites,
  copiedInviteId,
  onCopyInviteUrl,
  onDeleteInvite,
  onViewReceipt,
  onOpenCreateInvite,
  onRefresh,
  isRefreshing,
}: AdminWeddingsHubProps) {
  const pendingInquiriesCount = inquiries.filter((i) => i.status === "pending").length;
  const activeInvitesCount = invites.filter((i) => i.status === "active").length;

  return (
    <div className="space-y-4 sm:space-y-5 w-full max-w-full min-w-0 overflow-x-clip">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Weddings &amp; Clients
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track WhatsApp inquiries, issue 24-hour onboarding links, and oversee live wedding galleries.
          </p>
        </div>
        {subTab === "weddings" && onTriggerCleanup && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerCleanup}
            disabled={isCleaningUp}
            className="h-8 gap-1.5 text-xs cursor-pointer text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0"
            title="Scan and delete expired images (past retention period)"
          >
            <Trash2 className="size-3.5" />
            <span>{isCleaningUp ? "Cleaning..." : "Retention Cleanup"}</span>
          </Button>
        )}
      </div>

      {/* Sleek, Compact 3-Step Lifecycle Card Bar (Acts as the View Selector) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0">
        {/* Step 1: Inquiries & Leads */}
        <button
          type="button"
          onClick={() => onSubTabChange("inquiries")}
          className={cn(
            "flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-lg border text-left transition-all cursor-pointer",
            subTab === "inquiries"
              ? "bg-background border-amber-500/50 shadow-xs ring-1 ring-amber-500/20"
              : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-[11px] font-bold shrink-0 transition-colors",
                subTab === "inquiries"
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              1
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                Inquiries &amp; Leads
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {inquiries.length} {inquiries.length === 1 ? "lead" : "leads"}
              </div>
            </div>
          </div>
          {pendingInquiriesCount > 0 ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
              {pendingInquiriesCount} new
            </span>
          ) : (
            <MessageSquare className="size-3.5 text-muted-foreground/60 shrink-0" />
          )}
        </button>

        {/* Step 2: Onboarding Invites */}
        <button
          type="button"
          onClick={() => onSubTabChange("invites")}
          className={cn(
            "flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-lg border text-left transition-all cursor-pointer",
            subTab === "invites"
              ? "bg-background border-blue-500/50 shadow-xs ring-1 ring-blue-500/20"
              : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-[11px] font-bold shrink-0 transition-colors",
                subTab === "invites"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              2
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                Onboarding Invites
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {invites.length} {invites.length === 1 ? "link" : "links"}
              </div>
            </div>
          </div>
          {activeInvitesCount > 0 ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
              {activeInvitesCount} active
            </span>
          ) : (
            <UserPlus className="size-3.5 text-muted-foreground/60 shrink-0" />
          )}
        </button>

        {/* Step 3: Live Weddings */}
        <button
          type="button"
          onClick={() => onSubTabChange("weddings")}
          className={cn(
            "flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-lg border text-left transition-all cursor-pointer",
            subTab === "weddings"
              ? "bg-background border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20"
              : "bg-muted/20 border-border/40 hover:bg-muted/40 hover:border-border"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-[11px] font-bold shrink-0 transition-colors",
                subTab === "weddings"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              3
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                Live Weddings
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {weddings.length} {weddings.length === 1 ? "gallery" : "galleries"}
              </div>
            </div>
          </div>
          <Heart
            className={cn(
              "size-3.5 shrink-0 transition-colors",
              subTab === "weddings" ? "text-emerald-500" : "text-muted-foreground/60"
            )}
          />
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="min-w-0 w-full">
        {subTab === "weddings" && (
          <WeddingsDataTable
            data={weddings}
            tenantAccounts={tenantAccounts}
            copiedId={copiedId}
            onCopyLink={onCopyLink}
            onViewGallery={onViewGallery}
            onDelete={onDeleteWedding}
            onTogglePreserveMedia={onTogglePreserveMedia}
          />
        )}

        {subTab === "inquiries" && (
          <AdminInquiries
            hideHeader
            inquiries={inquiries}
            invites={invites}
            inquiryFilter={inquiryFilter}
            onFilterChange={onInquiryFilterChange}
            isUpdatingInquiryId={isUpdatingInquiryId}
            onUpdateStatus={onUpdateInquiryStatus}
            onDeleteInquiry={onDeleteInquiry}
            onConvertInquiry={onConvertInquiry}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onCopyInviteUrl={onCopyInviteUrl}
            onOpenCreateInvite={onOpenCreateInvite}
          />
        )}

        {subTab === "invites" && (
          <AdminTenantInvites
            hideHeader
            invites={invites}
            copiedInviteId={copiedInviteId}
            onCopyInviteUrl={onCopyInviteUrl}
            onDeleteInvite={onDeleteInvite}
            onOpenCreateInvite={onOpenCreateInvite}
            onViewReceipt={onViewReceipt}
          />
        )}
      </div>
    </div>
  );
}
