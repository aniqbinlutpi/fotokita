import {
  Heart,
  MessageSquare,
  UserPlus,
  RefreshCw,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Weddings &amp; Client Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete lifecycle management: Track WhatsApp inquiries, generate 24-hour onboarding links, and oversee live wedding galleries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {subTab === "weddings" && onTriggerCleanup && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerCleanup}
              disabled={isCleaningUp}
              className="gap-1.5 text-xs h-9 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Scan and delete expired images (past retention period)"
            >
              <Trash2 className="size-3.5" />
              <span>{isCleaningUp ? "Cleaning..." : "Retention Cleanup"}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateInvite}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>Generate Invite</span>
          </Button>
        </div>
      </div>

      {/* 3-Step Lifecycle Pipeline Funnel Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
        {/* Step 1: Inquiries */}
        <Card
          onClick={() => onSubTabChange("inquiries")}
          className={`cursor-pointer transition-all border shadow-xs hover:border-amber-500/50 ${
            subTab === "inquiries"
              ? "bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <CardContent className="p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    1. Inquiries &amp; Leads
                  </span>
                  {pendingInquiriesCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
                      {pendingInquiriesCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {inquiries.length} leads • WhatsApp requests
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0 hidden sm:block opacity-60" />
          </CardContent>
        </Card>

        {/* Step 2: Invites */}
        <Card
          onClick={() => onSubTabChange("invites")}
          className={`cursor-pointer transition-all border shadow-xs hover:border-blue-500/50 ${
            subTab === "invites"
              ? "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <CardContent className="p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    2. Onboarding Invites
                  </span>
                  {activeInvitesCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                      {activeInvitesCount} active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {invites.length} links • 24h validity tokens
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground shrink-0 hidden sm:block opacity-60" />
          </CardContent>
        </Card>

        {/* Step 3: Active Weddings */}
        <Card
          onClick={() => onSubTabChange("weddings")}
          className={`cursor-pointer transition-all border shadow-xs hover:border-emerald-500/50 ${
            subTab === "weddings"
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
              : "bg-card hover:bg-muted/30"
          }`}
        >
          <CardContent className="p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    3. Live Weddings
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles className="size-2.5" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {weddings.length} registered wedding galleries
                </p>
              </div>
            </div>
            <Heart className="size-4 text-emerald-500 shrink-0" />
          </CardContent>
        </Card>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => onSubTabChange("weddings")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            subTab === "weddings"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="size-3.5 text-accent" />
          <span>Live Weddings ({weddings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => onSubTabChange("inquiries")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            subTab === "inquiries"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="size-3.5 text-blue-500" />
          <span>Inquiries ({inquiries.length})</span>
          {pendingInquiriesCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSubTabChange("invites")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            subTab === "invites"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="size-3.5 text-purple-500" />
          <span>Onboarding Invites ({invites.length})</span>
          {activeInvitesCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              {activeInvitesCount}
            </span>
          )}
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
