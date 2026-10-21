import { useState, useEffect } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Tab Sub-pages
import { AdminDashboard } from "./AdminDashboard";
import { AdminInquiries } from "./AdminInquiries";
import { AdminVouchers } from "./AdminVouchers";
import { AdminTenantInvites } from "./AdminTenantInvites";
import { AdminWeddings } from "./AdminWeddings";
import { AdminSystemServices } from "./AdminSystemServices";

// Dialogs
import { CreateInviteDialog, type ReceiptUploadFile } from "./dialogs/CreateInviteDialog";
import { ViewReceiptDialog } from "./dialogs/ViewReceiptDialog";
import { DeleteWeddingDialog } from "./dialogs/DeleteWeddingDialog";

// APIs & Types
import {
  getStoredAdminUser,
  getStoredAdminToken,
  clearStoredAdminSession,
  getAdminStats,
  getAdminInvites,
  createAdminInvite,
  deleteAdminInvite,
  getAdminInquiries,
  updateAdminInquiryStatus,
  deleteAdminInquiry,
  getAdminVouchers,
  createAdminVoucher,
  toggleAdminVoucherStatus,
  deleteAdminVoucher,
  getAdminTenantAccounts,
  toggleAdminPreserveMedia,
  triggerAdminMediaCleanup,
  purgeEntireWedding,
  verifyAdminPassword,
  type AdminUser,
  type AdminStats,
  type AdminInvite,
  type SubscriptionTier,
  type CustomerInquiry,
  type AdminVoucher,
  type AdminTenantAccount,
} from "@/api/admin";
import {
  getWeddings,
} from "@/api/wedding";
import type { Wedding } from "@/types/wedding";

export interface AdminControlPageProps {
  onNavigateHome: () => void;
  onOpenGallery?: (slug: string) => void;
}

export function AdminControlPage({
  onNavigateHome,
  onOpenGallery,
}: AdminControlPageProps) {
  // Authentication state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const token = getStoredAdminToken();
    const user = getStoredAdminUser();
    return token && user ? user : null;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "inquiries" | "vouchers" | "invites" | "weddings" | "system"
  >("overview");

  // Data states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<
    "all" | "pending" | "contacted" | "converted"
  >("all");
  const [isUpdatingInquiryId, setIsUpdatingInquiryId] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Invite generation modal states
  const [isCreateInviteOpen, setIsCreateInviteOpen] = useState(false);
  const [inviteTier, setInviteTier] = useState<SubscriptionTier>("1day");
  const [inviteClientName, setInviteClientName] = useState("");
  const [inviteClientPhone, setInviteClientPhone] = useState("");
  const [inviteWeddingDate, setInviteWeddingDate] = useState("");
  const [invitePlanStartDate, setInvitePlanStartDate] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<ReceiptUploadFile | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState<AdminInvite | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // View receipt modal states
  const [viewReceiptInvite, setViewReceiptInvite] = useState<AdminInvite | null>(null);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);


  // Delete wedding confirmation
  const [weddingToDelete, setWeddingToDelete] = useState<Wedding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied link indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tenant Accounts & Media Retention
  const [tenantAccounts, setTenantAccounts] = useState<Record<string, AdminTenantAccount>>({});
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // System diagnostic pings
  const [systemPings, setSystemPings] = useState<{
    weddingService: "checking" | "online" | "offline";
    mediaService: "checking" | "online" | "offline";
    adminService: "checking" | "online" | "offline";
  }>({
    weddingService: "checking",
    mediaService: "checking",
    adminService: "checking",
  });

  // Load all initial data
  const fetchData = async () => {
    setIsRefreshing(true);

    const handleAuthError = (err: any) => {
      if (err?.status === 401 || err?.code === "UNAUTHORIZED" || err?.code === "INVALID_TOKEN") {
        clearStoredAdminSession();
        setAdminUser(null);
        toast.error("Your admin session has expired. Please log in again.");
        return true;
      }
      return false;
    };

    // 1. Fetch weddings directly or via admin
    try {
      const weddingsData = await getWeddings();
      setWeddings(weddingsData);
    } catch (err) {
      console.warn("Could not fetch weddings directly:", err);
    }

    // 2. Try fetching aggregated stats from admin-service
    try {
      const statsData = await getAdminStats();
      setStats(statsData);
      setSystemPings((prev) => ({
        ...prev,
        adminService: "online",
      }));
    } catch (err: any) {
      if (handleAuthError(err)) {
        setIsRefreshing(false);
        return;
      }
      setSystemPings((prev) => ({
        ...prev,
        adminService: "offline",
      }));
    }

    // 3. Fetch invites from admin-service
    try {
      const invitesData = await getAdminInvites();
      setInvites(invitesData);
    } catch (err: any) {
      if (handleAuthError(err)) {
        setIsRefreshing(false);
        return;
      }
      console.warn("Could not fetch invites:", err);
    }

    // 4. Fetch customer inquiries from admin-service
    try {
      const inquiriesData = await getAdminInquiries();
      setInquiries(inquiriesData);
    } catch (err: any) {
      if (handleAuthError(err)) {
        setIsRefreshing(false);
        return;
      }
      console.warn("Could not fetch customer inquiries:", err);
    }

    // 5. Fetch promotional vouchers from admin-service
    try {
      const vouchersData = await getAdminVouchers();
      setVouchers(vouchersData);
    } catch (err: any) {
      if (handleAuthError(err)) {
        setIsRefreshing(false);
        return;
      }
      console.warn("Could not fetch vouchers:", err);
    }

    // 6. Fetch tenant accounts from tenant-service
    try {
      const accounts = await getAdminTenantAccounts();
      const mapped: Record<string, AdminTenantAccount> = {};
      accounts.forEach((acc) => {
        mapped[acc.weddingId] = acc;
      });
      setTenantAccounts(mapped);
    } catch (err) {
      console.warn("Could not fetch tenant accounts:", err);
    }

    // 6. Ping services directly
    await checkAllServices();

    setIsRefreshing(false);
  };

  const checkAllServices = async () => {
    // Ping wedding service
    try {
      const res = await fetch("/api/weddings/health");
      setSystemPings((prev) => ({
        ...prev,
        weddingService: res.ok ? "online" : "offline",
      }));
    } catch {
      setSystemPings((prev) => ({ ...prev, weddingService: "offline" }));
    }

    // Ping media service
    try {
      const res = await fetch("/api/media/health");
      setSystemPings((prev) => ({
        ...prev,
        mediaService: res.ok ? "online" : "offline",
      }));
    } catch {
      setSystemPings((prev) => ({ ...prev, mediaService: "offline" }));
    }

    // Ping admin service
    try {
      const res = await fetch("/api/admin/health");
      setSystemPings((prev) => ({
        ...prev,
        adminService: res.ok ? "online" : "offline",
      }));
    } catch {
      setSystemPings((prev) => ({ ...prev, adminService: "offline" }));
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchData();
    }
  }, [adminUser]);

  // Handle Logout
  const handleLogout = () => {
    clearStoredAdminSession();
    setAdminUser(null);
    toast.info("You have signed out of the Super Admin panel");
  };

  // Inquiry operations
  const handleUpdateInquiryStatus = async (
    id: string,
    status: "pending" | "contacted" | "converted"
  ) => {
    setIsUpdatingInquiryId(id);
    try {
      const res = await updateAdminInquiryStatus(id, status);
      setInquiries((prev) => prev.map((inq) => (inq.id === id ? res.inquiry : inq)));
      toast.success(`Inquiry status updated to ${status}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update inquiry status");
    } finally {
      setIsUpdatingInquiryId(null);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      await deleteAdminInquiry(id);
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      toast.success("Inquiry deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete inquiry");
    }
  };

  const handleConvertInquiryToInvite = (inquiry: CustomerInquiry) => {
    setInviteClientName(inquiry.username);
    setInviteClientPhone(inquiry.phone || "");
    setInviteWeddingDate(inquiry.weddingDate || "");
    setInvitePlanStartDate(inquiry.planStartDate || "");
    const voucherNote = inquiry.voucherCode
      ? ` • Voucher: ${inquiry.voucherCode} (${inquiry.discountAmount || ""} off, Paid: ${inquiry.finalPrice || inquiry.price})`
      : ` • Price: ${inquiry.price}`;
    setInviteNotes(`Inquiry phone: ${inquiry.phone} • Plan: ${inquiry.planName}${voucherNote}`);
    const validTiers: SubscriptionTier[] = [
      "12h",
      "1day",
      "3days",
      "1week",
      "1month",
      "1year",
      "vip",
      "premium",
      "standard",
    ];
    if (validTiers.includes(inquiry.planId as SubscriptionTier)) {
      setInviteTier(inquiry.planId as SubscriptionTier);
    } else {
      setInviteTier("1day");
    }
    setNewlyCreatedInvite(null);
    setReceiptFile(null);
    setIsCreateInviteOpen(true);
  };

  // Voucher operations
  const handleCreateVoucher = async (data: any) => {
    try {
      const res = await createAdminVoucher(data);
      setVouchers((prev) => [res.voucher, ...prev]);
      toast.success(res.message || "Voucher created successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create voucher");
      throw err;
    }
  };

  const handleToggleVoucherStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await toggleAdminVoucherStatus(id, isActive);
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? res.voucher : v))
      );
      toast.success(res.message || `Voucher ${isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update voucher status");
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      await deleteAdminVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
      toast.success("Voucher deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete voucher");
    }
  };

  // Invite operations
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      toast.error("Please upload payment receipt evidence before generating the link.");
      return;
    }
    setIsCreatingInvite(true);
    try {
      const res = await createAdminInvite({
        tier: inviteTier,
        clientName: inviteClientName.trim() || undefined,
        clientPhone: inviteClientPhone.trim() || undefined,
        weddingDate: inviteWeddingDate.trim() || undefined,
        planStartDate: invitePlanStartDate.trim() || undefined,
        notes: inviteNotes.trim() || undefined,
        receiptData: receiptFile.data,
        receiptFilename: receiptFile.name,
        receiptMimeType: receiptFile.type,
      });
      setInvites((prev) => [res.invite, ...prev]);
      setNewlyCreatedInvite(res.invite);
      toast.success("24-hour single-use invite link created successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create invite link");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await deleteAdminInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invite link deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete invite link");
    }
  };

  const handleCopyInviteUrl = (token: string, id: string) => {
    const url = `${window.location.origin}/register?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteId(id);
    toast.success("24-hour registration link copied to clipboard!");
    setTimeout(() => setCopiedInviteId(null), 2000);
  };


  const confirmDeleteWedding = async (adminPassword: string) => {
    if (!weddingToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Verify Super Admin password before critical destructive purge
      await verifyAdminPassword(adminPassword);

      // 2. Perform full cascade purge
      await purgeEntireWedding(weddingToDelete.id);
      setWeddings((prev) => prev.filter((w) => w.id !== weddingToDelete.id));
      setTenantAccounts((prev) => {
        const next = { ...prev };
        delete next[weddingToDelete.id];
        return next;
      });
      toast.success(
        `Wedding "${weddingToDelete.name}" and all associated storage files & accounts have been permanently purged`
      );
      setWeddingToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to purge wedding data");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (slug: string, id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/${encodeURI(slug)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Gallery link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewGallery = (slug: string) => {
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/${encodeURI(slug)}`, "_blank");
    }
  };

  const handleTogglePreserveMedia = async (weddingId: string, currentVal: boolean) => {
    try {
      const nextVal = !currentVal;
      await toggleAdminPreserveMedia(weddingId, nextVal);
      setTenantAccounts((prev) => {
        if (!prev[weddingId]) return prev;
        return {
          ...prev,
          [weddingId]: {
            ...prev[weddingId],
            preserveMedia: nextVal,
          },
        };
      });
      toast.success(
        nextVal
          ? "Media preserved! Auto-delete disabled for this wedding."
          : "Standard retention restored (3-day auto-purge enabled)."
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update retention setting");
    }
  };

  const handleTriggerCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const res = await triggerAdminMediaCleanup();
      const count = res.cleanedTenants?.length || res.processedCount || 0;
      toast.success(
        `Retention cleanup complete: ${count} expired wedding galleries processed.`
      );
      // Refresh tenant accounts
      const accounts = await getAdminTenantAccounts();
      const mapped: Record<string, AdminTenantAccount> = {};
      accounts.forEach((acc) => {
        mapped[acc.weddingId] = acc;
      });
      setTenantAccounts(mapped);
    } catch (err: any) {
      toast.error(err?.message || "Failed to run retention cleanup");
    } finally {
      setIsCleaningUp(false);
    }
  };

  // If not authenticated, render login page
  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={(user) => {
          setAdminUser(user);
          toast.success(`Welcome back, ${user.name}!`);
        }}
        onBackHome={onNavigateHome}
      />
    );
  }

  return (
    <SidebarProvider className="w-full max-w-full min-w-0 overflow-x-clip">
      <div className="flex min-h-screen w-full max-w-full min-w-0 overflow-x-clip bg-background text-foreground">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          adminUser={adminUser}
          onLogout={handleLogout}
          onBackHome={onNavigateHome}
          pendingInquiriesCount={inquiries.filter((i) => i.status === "pending").length}
          activeVouchersCount={vouchers.filter((v) => v.status === "active").length}
        />

        {/* Inset Main View */}
        <SidebarInset className="flex flex-col flex-1 min-w-0 w-full max-w-full overflow-x-clip">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-1.5 sm:gap-2 border-b bg-background/95 backdrop-blur-sm px-2.5 sm:px-6 w-full max-w-full overflow-x-clip">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
              <SidebarTrigger className="-ml-1 shrink-0 cursor-pointer" />
              <Separator orientation="vertical" className="hidden sm:block mr-2 h-4 shrink-0" />
              {/* Mobile concise label */}
              <span className="text-xs font-semibold truncate sm:hidden">
                {activeTab === "overview" && "Dashboard"}
                {activeTab === "inquiries" && "Inquiries"}
                {activeTab === "vouchers" && "Vouchers"}
                {activeTab === "invites" && "Invites"}
                {activeTab === "weddings" && "Weddings"}
                {activeTab === "system" && "System"}
              </span>
              {/* Desktop breadcrumb */}
              <Breadcrumb className="hidden sm:flex min-w-0">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("overview");
                      }}
                      className="font-medium text-xs cursor-pointer"
                    >
                      Fotokita Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="capitalize text-xs truncate">
                      {activeTab === "overview" && "Dashboard Overview"}
                      {activeTab === "inquiries" && "Customer Inquiries (WhatsApp Leads)"}
                      {activeTab === "vouchers" && "Vouchers & Promotional Deals"}
                      {activeTab === "invites" && "Tenant Invites (24h Single-Use)"}
                      {activeTab === "weddings" && "Weddings Management"}
                      {activeTab === "system" && "System & Services"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isRefreshing}
                className="h-8 w-8 p-0 sm:w-auto sm:px-3 text-xs cursor-pointer shrink-0"
                title="Refresh data"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline ml-1.5">Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewlyCreatedInvite(null);
                  setIsCreateInviteOpen(true);
                }}
                className="h-8 w-8 p-0 sm:w-auto sm:px-3 text-xs border-accent/40 text-accent hover:bg-accent/10 cursor-pointer shrink-0 sm:gap-1.5"
                title="Generate single-use invite link"
                aria-label="Generate invite link"
              >
                <UserPlus className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-clip">
            {activeTab === "overview" && (
              <AdminDashboard
                weddings={weddings}
                inquiries={inquiries}
                invites={invites}
                tenantAccounts={tenantAccounts}
                stats={stats}
                systemPings={systemPings}
                copiedId={copiedId}
                onCopyLink={handleCopyLink}
                onViewGallery={handleViewGallery}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === "inquiries" && (
              <AdminInquiries
                inquiries={inquiries}
                inquiryFilter={inquiryFilter}
                onFilterChange={setInquiryFilter}
                isUpdatingInquiryId={isUpdatingInquiryId}
                onUpdateStatus={handleUpdateInquiryStatus}
                onDeleteInquiry={handleDeleteInquiry}
                onConvertInquiry={handleConvertInquiryToInvite}
                onRefresh={fetchData}
                isRefreshing={isRefreshing}
                onOpenCreateInvite={() => {
                  setNewlyCreatedInvite(null);
                  setIsCreateInviteOpen(true);
                }}
              />
            )}

            {activeTab === "vouchers" && (
              <AdminVouchers
                vouchers={vouchers}
                onRefresh={fetchData}
                isRefreshing={isRefreshing}
                onCreateVoucher={handleCreateVoucher}
                onToggleStatus={handleToggleVoucherStatus}
                onDeleteVoucher={handleDeleteVoucher}
              />
            )}

            {activeTab === "invites" && (
              <AdminTenantInvites
                invites={invites}
                copiedInviteId={copiedInviteId}
                onCopyInviteUrl={handleCopyInviteUrl}
                onDeleteInvite={handleDeleteInvite}
                onOpenCreateInvite={() => {
                  setNewlyCreatedInvite(null);
                  setReceiptFile(null);
                  setIsCreateInviteOpen(true);
                }}
                onViewReceipt={(inv) => {
                  setViewReceiptInvite(inv);
                  setIsViewReceiptOpen(true);
                }}
              />
            )}

            {activeTab === "weddings" && (
              <AdminWeddings
                weddings={weddings}
                tenantAccounts={tenantAccounts}
                copiedId={copiedId}
                onCopyLink={handleCopyLink}
                onViewGallery={handleViewGallery}
                onDeleteWedding={(w) => setWeddingToDelete(w)}
                onTogglePreserveMedia={handleTogglePreserveMedia}
                onTriggerCleanup={handleTriggerCleanup}
                isCleaningUp={isCleaningUp}
              />
            )}

            {activeTab === "system" && (
              <AdminSystemServices systemPings={systemPings} />
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <CreateInviteDialog
        open={isCreateInviteOpen}
        onOpenChange={(open) => {
          setIsCreateInviteOpen(open);
          if (!open) {
            setReceiptFile(null);
          }
        }}
        inviteTier={inviteTier}
        onInviteTierChange={setInviteTier}
        inviteClientName={inviteClientName}
        onInviteClientNameChange={setInviteClientName}
        inviteClientPhone={inviteClientPhone}
        onInviteClientPhoneChange={setInviteClientPhone}
        inviteWeddingDate={inviteWeddingDate}
        onInviteWeddingDateChange={setInviteWeddingDate}
        invitePlanStartDate={invitePlanStartDate}
        onInvitePlanStartDateChange={setInvitePlanStartDate}
        inviteNotes={inviteNotes}
        onInviteNotesChange={setInviteNotes}
        receiptFile={receiptFile}
        onReceiptFileChange={setReceiptFile}
        isCreatingInvite={isCreatingInvite}
        onSubmit={handleCreateInvite}
        newlyCreatedInvite={newlyCreatedInvite}
        onResetNewlyCreated={() => {
          setNewlyCreatedInvite(null);
          setInviteClientName("");
          setInviteClientPhone("");
          setInviteWeddingDate("");
          setInvitePlanStartDate("");
          setInviteNotes("");
          setReceiptFile(null);
        }}
        copiedInviteId={copiedInviteId}
        onCopyInviteUrl={handleCopyInviteUrl}
      />

      <ViewReceiptDialog
        open={isViewReceiptOpen}
        onOpenChange={setIsViewReceiptOpen}
        invite={viewReceiptInvite}
      />


      <DeleteWeddingDialog
        wedding={weddingToDelete}
        onClose={() => setWeddingToDelete(null)}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteWedding}
      />
    </SidebarProvider>
  );
}
