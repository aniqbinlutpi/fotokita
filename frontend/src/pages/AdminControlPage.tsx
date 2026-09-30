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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  Plus,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  UserPlus,
  Clock,
  MessageCircle,
  Trash2,
  User,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WeddingsDataTable } from "@/components/admin/WeddingsDataTable";
import {
  getStoredAdminUser,
  getStoredAdminToken,
  clearStoredAdminSession,
  getAdminStats,
  getAdminInvites,
  createAdminInvite,
  deleteAdminInvite,
  type AdminUser,
  type AdminStats,
  type AdminInvite,
  type SubscriptionTier,
} from "@/api/admin";
import {
  getWeddings,
  createWedding,
  deleteWedding,
  checkSlugAvailability,
} from "@/api/wedding";
import type { Wedding } from "@/types/wedding";

interface AdminControlPageProps {
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
  const [activeTab, setActiveTab] = useState<"overview" | "invites" | "weddings" | "system">("overview");

  // Data states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
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

  // Create wedding modal
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
      // If admin-service is not running or offline, we fallback
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

    // 4. Ping services directly
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

  // Handle invite operations
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
      toast.success("Link jemputan sah 24 jam berjaya dihasilkan!");
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghasilkan link jemputan");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await deleteAdminInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Link jemputan berjaya dipadamkan");
    } catch (err: any) {
      toast.error(err?.message || "Gagal memadam link jemputan");
    }
  };

  const handleCopyInviteUrl = (token: string, id: string) => {
    const url = `${window.location.origin}/register?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteId(id);
    toast.success("Link pendaftaran 24 jam disalin!");
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const formatTierLabel = (tier: string) => {
    switch (tier) {
      case "12h":
        return "12 Hours (RM6)";
      case "1day":
        return "Whole Day (RM10)";
      case "3days":
        return "3 Days (RM17)";
      case "1week":
        return "1 Week (RM23)";
      case "1month":
        return "1 Month (RM46)";
      case "1year":
        return "1 Year Special (RM189)";
      case "vip":
        return "VIP (100GB)";
      case "premium":
        return "Pro Studio (30GB)";
      case "standard":
        return "Standard (10GB)";
      default:
        return tier;
    }
  };

  const getWhatsAppShareUrl = (invite: AdminInvite) => {
    const url = `${window.location.origin}/register?token=${encodeURIComponent(invite.token)}`;
    const clientGreeting = invite.clientName ? `Hi ${invite.clientName}` : "Hi";
    const tierName = formatTierLabel(invite.tier);
    const message = `${clientGreeting}! Thank you for your payment for the Fotokita ${tierName} package.\n\nPlease use this official link to register your Sub-Admin account and launch your wedding gallery:\n${url}\n\n⚠️ Notice: This link is valid for 24 hours only and is single-use. Please complete your registration before expiry.`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
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

  // Auto-slug generator when typing name
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

  // Real-time slug availability check
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

  // Create wedding submit
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

  // Delete wedding action
  const confirmDeleteWedding = async () => {
    if (!weddingToDelete) return;
    setIsDeleting(true);
    try {
      await deleteWedding(weddingToDelete.id);
      setWeddings((prev) => prev.filter((w) => w.id !== weddingToDelete.id));
      toast.success(`Wedding "${weddingToDelete.name}" has been deleted`);
      setWeddingToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete wedding");
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy gallery link
  const handleCopyLink = (slug: string, id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/?slug=${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Gallery link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // View gallery in new tab or route
  const handleViewGallery = (slug: string) => {
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank");
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
                className="gap-1.5 text-xs h-8"
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
                className="gap-1.5 text-xs h-8 border-accent/40 text-accent hover:bg-accent/10"
              >
                <UserPlus className="size-3.5" />
                <span>Generate Invite</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="size-3.5" />
                <span>Create Wedding</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Super Admin Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Data summary, weddings statistics, and microservice infrastructure health.
                  </p>
                </div>

                {/* Metric KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Weddings
                      </CardTitle>
                      <Heart className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {weddings.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active registered weddings
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Media
                      </CardTitle>
                      <Camera className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats?.totalMedia ?? "—"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Photos & videos in S3 storage
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Wedding Service Status
                      </CardTitle>
                      <Radio
                        className={`size-4 ${
                          systemPings.weddingService === "online"
                            ? "text-emerald-500 animate-pulse"
                            : "text-rose-500"
                        }`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            systemPings.weddingService === "online"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="text-lg font-semibold uppercase text-xs">
                          {systemPings.weddingService}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Port 3001 &bull; PostgreSQL Drizzle
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Media Service Status
                      </CardTitle>
                      <Radio
                        className={`size-4 ${
                          systemPings.mediaService === "online"
                            ? "text-emerald-500 animate-pulse"
                            : "text-rose-500"
                        }`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            systemPings.mediaService === "online"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="text-lg font-semibold uppercase text-xs">
                          {systemPings.mediaService}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Port 3000 &bull; Cloudflare R2 Storage
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Weddings Table */}
                <Card className="shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Recent Weddings
                      </CardTitle>
                      <CardDescription>
                        Latest 5 registered wedding events.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("weddings")}
                      className="text-xs"
                    >
                      View All ({weddings.length})
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Wedding Name</TableHead>
                          <TableHead>URL Slug</TableHead>
                          <TableHead>Event Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weddings.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No weddings found. Create your first wedding.
                            </TableCell>
                          </TableRow>
                        ) : (
                          weddings.slice(0, 5).map((w) => (
                            <TableRow key={w.id}>
                              <TableCell className="font-medium">
                                {w.name}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                                  /{w.slug}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(w.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleCopyLink(w.slug, w.id)}
                                    title="Copy Link"
                                  >
                                    {copiedId === w.id ? (
                                      <Check className="size-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleViewGallery(w.slug)}
                                    title="Open Gallery"
                                  >
                                    <ExternalLink className="size-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: TENANT INVITES (24H SINGLE-USE) */}
            {activeTab === "invites" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Tenant Invites & Onboarding
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Generate exclusive registration links (24h validity &amp; single-use) based on client's chosen subscription package after payment.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setNewlyCreatedInvite(null);
                      setIsCreateInviteOpen(true);
                    }}
                    className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <UserPlus className="size-4" />
                    <span>Generate New Link</span>
                  </Button>
                </div>

                {/* Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Jumlah Link Dijana
                      </CardTitle>
                      <Sparkles className="size-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{invites.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rekod keseluruhan jemputan
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Link Aktif (Sah 24 Jam)
                      </CardTitle>
                      <Clock className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {invites.filter((i) => i.status === "active").length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Menunggu pelanggan mendaftar
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Berjaya Didaftarkan
                      </CardTitle>
                      <CheckCircle2 className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {invites.filter((i) => i.status === "used").length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Token terbakar (Single-use)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Tamat Tempoh
                      </CardTitle>
                      <AlertTriangle className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {invites.filter((i) => i.status === "expired").length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Melebihi had 24 jam
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Invites Table */}
                <Card className="shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Senarai Link Pendaftaran Tenant
                    </CardTitle>
                    <CardDescription>
                      Maklumat pakej langganan, status single-use token, dan data yang diisi oleh tenant.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client / Notes</TableHead>
                          <TableHead>Subscription Plan</TableHead>
                          <TableHead>Token Status (24h)</TableHead>
                          <TableHead>Tenant Registration Details</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invites.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
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
                                        onClick={() => handleCopyInviteUrl(inv.token, inv.id)}
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

                                      <a
                                        href={getWhatsAppShareUrl(inv)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                                        title="Send to WhatsApp"
                                      >
                                        <MessageCircle className="size-3.5" />
                                        <span className="hidden sm:inline">WhatsApp</span>
                                      </a>
                                    </>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleDeleteInvite(inv.id)}
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
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: WEDDINGS MANAGEMENT */}
            {activeTab === "weddings" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Weddings Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Monitor, manage, and configure all wedding gallery registrations.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="size-4" />
                    <span>Create Wedding</span>
                  </Button>
                </div>

                {/* Full Weddings Table powered by TanStack Table */}
                <WeddingsDataTable
                  data={weddings}
                  copiedId={copiedId}
                  onCopyLink={handleCopyLink}
                  onViewGallery={handleViewGallery}
                  onDelete={(w) => setWeddingToDelete(w)}
                />
              </div>
            )}

            {/* TAB 3: SYSTEM HEALTH & ARCHITECTURE */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    System & Microservices Status
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Live operational health and telemetry across Fotokita backend microservices.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Wedding Service */}
                  <Card className="shadow-xs">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          Wedding Service
                        </CardTitle>
                        <Badge
                          variant={
                            systemPings.weddingService === "online"
                              ? "default"
                              : "destructive"
                          }
                          className="capitalize text-xs"
                        >
                          {systemPings.weddingService}
                        </Badge>
                      </div>
                      <CardDescription>
                        Port 3001 &bull; Metadata Management & CRUD
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Database:</span>
                        <span className="font-mono text-foreground">PostgreSQL</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>ORM:</span>
                        <span className="font-mono text-foreground">Drizzle ORM</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Health Endpoint:</span>
                        <span className="font-mono text-foreground">/health</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Media Service */}
                  <Card className="shadow-xs">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          Media Service
                        </CardTitle>
                        <Badge
                          variant={
                            systemPings.mediaService === "online"
                              ? "default"
                              : "destructive"
                          }
                          className="capitalize text-xs"
                        >
                          {systemPings.mediaService}
                        </Badge>
                      </div>
                      <CardDescription>
                        Port 3000 &bull; Uploads & S3 Presigned URLs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Object Storage:</span>
                        <span className="font-mono text-foreground">Amazon S3</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>URL Protocol:</span>
                        <span className="font-mono text-foreground">Presigned S3</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Health Endpoint:</span>
                        <span className="font-mono text-foreground">/health</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Admin Service */}
                  <Card className="shadow-xs">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          Admin Service
                        </CardTitle>
                        <Badge
                          variant={
                            systemPings.adminService === "online"
                              ? "default"
                              : "outline"
                          }
                          className="capitalize text-xs"
                        >
                          {systemPings.adminService}
                        </Badge>
                      </div>
                      <CardDescription>
                        Port 3002 &bull; Auth & Super Admin Aggregation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Security:</span>
                        <span className="font-mono text-foreground">HMAC-SHA256 JWT</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Access Role:</span>
                        <span className="font-mono text-foreground">Super Admin</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Health Endpoint:</span>
                        <span className="font-mono text-foreground">/health</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Infrastructure Details */}
                <Card className="shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Running Backend Microservices
                    </CardTitle>
                    <CardDescription>
                      Commands to start all Fotokita services concurrently in your terminal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/60 font-mono text-xs space-y-2 overflow-x-auto">
                      <p className="text-muted-foreground"># 1. Start PostgreSQL database container</p>
                      <p className="text-foreground">docker compose up -d postgres</p>
                      <p className="text-muted-foreground mt-3"># 2. Start Wedding Service (Port 3001)</p>
                      <p className="text-foreground">cd services/wedding-service && bun run dev</p>
                      <p className="text-muted-foreground mt-3"># 3. Start Media Service (Port 3000)</p>
                      <p className="text-foreground">cd services/media-service && bun run dev</p>
                      <p className="text-muted-foreground mt-3"># 4. Start Admin Service (Port 3002)</p>
                      <p className="text-foreground">cd services/admin-service && bun run dev</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* GENERATE INVITE LINK DIALOG */}
      <Dialog open={isCreateInviteOpen} onOpenChange={setIsCreateInviteOpen}>
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
            <form onSubmit={handleCreateInvite} className="space-y-5 py-2">
              {/* 1. Subscription Tier Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Select Subscription Plan *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setInviteTier("12h")}
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
                    onClick={() => setInviteTier("1day")}
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
                    onClick={() => setInviteTier("3days")}
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
                    onClick={() => setInviteTier("1week")}
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
                    onClick={() => setInviteTier("1month")}
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
                    onClick={() => setInviteTier("1year")}
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

              {/* 2. Client / Couple Name (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Nama Pasangan / Pelanggan (Pilihan)
                </label>
                <Input
                  placeholder="cth. Farid & Nurul"
                  value={inviteClientName}
                  onChange={(e) => setInviteClientName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Nama ini akan dipaparkan secara automatik dalam borang pendaftaran mereka.
                </p>
              </div>

              {/* 3. Internal Notes (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Nota Bayaran / Rujukan (Pilihan)
                </label>
                <Input
                  placeholder="cth. Maybank QR RM150 (Resit verified)"
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                />
              </div>

              {/* Safety notice */}
              <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground flex items-start gap-2">
                <Clock className="size-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Had Masa 24 Jam &amp; Sekali Guna:</strong> Pautan ini akan tamat tempoh secara automatik selepas 24 jam dan terbakar serta-merta apabila pelanggan berjaya mendaftar.
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateInviteOpen(false)}
                  disabled={isCreatingInvite}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingInvite}
                  className="gap-2 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>{isCreatingInvite ? "Menjana..." : "Jana Link 24 Jam"}</span>
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
                    onClick={() => handleCopyInviteUrl(newlyCreatedInvite.token, newlyCreatedInvite.id)}
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
                  onClick={() => {
                    setNewlyCreatedInvite(null);
                    setInviteClientName("");
                    setInviteNotes("");
                  }}
                  className="text-xs uppercase tracking-wider"
                >
                  Jana Satu Lagi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE WEDDING DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Wedding</DialogTitle>
            <DialogDescription>
              Register a new wedding event into the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Wedding / Couple Name</label>
              <Input
                placeholder="e.g. Amir & Nadia"
                value={newWeddingName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Gallery URL Slug</label>
              <Input
                placeholder="amir-and-nadia"
                value={newWeddingSlug}
                onChange={(e) => {
                  setNewWeddingSlug(e.target.value);
                  checkSlug(e.target.value);
                }}
                required
              />
              {slugStatus && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    slugStatus.available ? "text-emerald-500" : "text-destructive"
                  }`}
                >
                  {slugStatus.available ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  <span>{slugStatus.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Event Date</label>
              <Input
                type="date"
                value={newWeddingDate}
                onChange={(e) => setNewWeddingDate(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || Boolean(slugStatus && !slugStatus.available)}
              >
                {isCreating ? "Creating..." : "Create Wedding"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog
        open={!!weddingToDelete}
        onOpenChange={(open) => !open && setWeddingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete this Wedding?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{weddingToDelete?.name}&rdquo;</strong> (slug: /{weddingToDelete?.slug})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setWeddingToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteWedding}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Wedding"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
