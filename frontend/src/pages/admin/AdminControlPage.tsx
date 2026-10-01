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
import { RefreshCw, UserPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Tab Sub-pages
import { AdminDashboard } from "./AdminDashboard";
import { AdminInquiries } from "./AdminInquiries";
import { AdminTenantInvites } from "./AdminTenantInvites";
import { AdminWeddings } from "./AdminWeddings";
import { AdminSystemServices } from "./AdminSystemServices";

// Dialogs
import { CreateInviteDialog } from "./dialogs/CreateInviteDialog";
import { CreateWeddingDialog } from "./dialogs/CreateWeddingDialog";
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
  type AdminTenantAccount,
} from "@/api/admin";
import {
  getWeddings,
  createWedding,
  deleteWedding,
  checkSlugAvailability,
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
    "overview" | "inquiries" | "invites" | "weddings" | "system"
  >("overview");

  // Data states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
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
  const [inviteNotes, setInviteNotes] = useState("");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState<AdminInvite | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Create wedding modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWeddingName, setNewWeddingName] = useState("");
  const [newWeddingSlug, setNewWeddingSlug] = useState("");
  const [newWeddingDate, setNewWeddingDate] = useState("");
  const [slugStatus, setSlugStatus] = useState<{ available?: boolean; message?: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    } catch {
      setSystemPings((prev) => ({
        ...prev,
        adminService: "offline",
      }));
    }

    // 3. Fetch invites from admin-service
    try {
      const invitesData = await getAdminInvites();
      setInvites(invitesData);
    } catch (err) {
      console.warn("Could not fetch invites:", err);
    }

    // 4. Fetch customer inquiries from admin-service
    try {
      const inquiriesData = await getAdminInquiries();
      setInquiries(inquiriesData);
    } catch (err) {
      console.warn("Could not fetch customer inquiries:", err);
    }

    // 5. Fetch tenant accounts from tenant-service
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
    setInviteNotes(`Inquiry phone: ${inquiry.phone} • Plan: ${inquiry.planName}`);
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
    setIsCreateInviteOpen(true);
  };

  // Invite operations
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingInvite(true);
    try {
      const res = await createAdminInvite({
        tier: inviteTier,
        clientName: inviteClientName.trim() || undefined,
        notes: inviteNotes.trim() || undefined,
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

  // Wedding operations
  const handleNameChange = (name: string) => {
    setNewWeddingName(name);
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewWeddingSlug(generatedSlug);
    if (generatedSlug) {
      checkSlug(generatedSlug);
    } else {
      setSlugStatus(null);
    }
  };

  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus({ available: false, message: "URL slug must be at least 3 characters" });
      return;
    }
    try {
      const res = await checkSlugAvailability(slug);
      setSlugStatus(res);
    } catch {
      setSlugStatus(null);
    }
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeddingName || !newWeddingSlug || !newWeddingDate) {
      toast.error("Please fill in all wedding details.");
      return;
    }

    setIsCreating(true);
    try {
      const created = await createWedding({
        name: newWeddingName.trim(),
        slug: newWeddingSlug.trim(),
        date: new Date(newWeddingDate).toISOString(),
      });

      setWeddings((prev) => [created, ...prev]);
      toast.success(`Wedding "${created.name}" created successfully!`);
      setIsCreateOpen(false);
      setNewWeddingName("");
      setNewWeddingSlug("");
      setNewWeddingDate("");
      setSlugStatus(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to create wedding");
    } finally {
      setIsCreating(false);
    }
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
    const url = `${origin}/?slug=${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Gallery link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewGallery = (slug: string) => {
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank");
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
      const count = res.data?.cleanedTenants?.length || 0;
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          adminUser={adminUser}
          onLogout={handleLogout}
          onBackHome={onNavigateHome}
          pendingInquiriesCount={inquiries.filter((i) => i.status === "pending").length}
        />

        {/* Inset Main View */}
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab("overview");
                      }}
                      className="font-medium"
                    >
                      Fotokita Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">
                      {activeTab === "overview" && "Dashboard Overview"}
                      {activeTab === "inquiries" && "Customer Inquiries (WhatsApp Leads)"}
                      {activeTab === "invites" && "Tenant Invites (24h Single-Use)"}
                      {activeTab === "weddings" && "Weddings Management"}
                      {activeTab === "system" && "System & Services"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isRefreshing}
                className="gap-1.5 text-xs h-8 cursor-pointer"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewlyCreatedInvite(null);
                  setIsCreateInviteOpen(true);
                }}
                className="gap-1.5 text-xs h-8 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
              >
                <UserPlus className="size-3.5" />
                <span>Generate Invite</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="gap-1.5 text-xs h-8 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Create Wedding</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {activeTab === "overview" && (
              <AdminDashboard
                weddings={weddings}
                inquiries={inquiries}
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

            {activeTab === "invites" && (
              <AdminTenantInvites
                invites={invites}
                copiedInviteId={copiedInviteId}
                onCopyInviteUrl={handleCopyInviteUrl}
                onDeleteInvite={handleDeleteInvite}
                onOpenCreateInvite={() => {
                  setNewlyCreatedInvite(null);
                  setIsCreateInviteOpen(true);
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
                onOpenCreateWedding={() => setIsCreateOpen(true)}
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
        onOpenChange={setIsCreateInviteOpen}
        inviteTier={inviteTier}
        onInviteTierChange={setInviteTier}
        inviteClientName={inviteClientName}
        onInviteClientNameChange={setInviteClientName}
        inviteNotes={inviteNotes}
        onInviteNotesChange={setInviteNotes}
        isCreatingInvite={isCreatingInvite}
        onSubmit={handleCreateInvite}
        newlyCreatedInvite={newlyCreatedInvite}
        onResetNewlyCreated={() => {
          setNewlyCreatedInvite(null);
          setInviteClientName("");
          setInviteNotes("");
        }}
        copiedInviteId={copiedInviteId}
        onCopyInviteUrl={handleCopyInviteUrl}
      />

      <CreateWeddingDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        weddingName={newWeddingName}
        onWeddingNameChange={handleNameChange}
        weddingSlug={newWeddingSlug}
        onWeddingSlugChange={(slug) => {
          setNewWeddingSlug(slug);
          checkSlug(slug);
        }}
        weddingDate={newWeddingDate}
        onWeddingDateChange={setNewWeddingDate}
        slugStatus={slugStatus}
        isCreating={isCreating}
        onSubmit={handleCreateWedding}
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
