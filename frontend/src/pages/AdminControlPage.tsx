import { useState, useEffect, useMemo } from "react";
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
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Camera,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  getStoredAdminUser,
  getStoredAdminToken,
  clearStoredAdminSession,
  getAdminStats,
  type AdminUser,
  type AdminStats,
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
  const [activeTab, setActiveTab] = useState<"overview" | "weddings" | "system">("overview");

  // Data states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

    // 3. Ping services directly
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
    toast.info("Anda telah log keluar daripada panel Super Admin");
  };

  // Filtered weddings
  const filteredWeddings = useMemo(() => {
    if (!searchQuery.trim()) return weddings;
    const q = searchQuery.toLowerCase();
    return weddings.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.slug.toLowerCase().includes(q)
    );
  }, [weddings, searchQuery]);

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
      setSlugStatus({ available: false, message: "URL slug minimum 3 aksara" });
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
      toast.error("Sila isi semua maklumat majlis.");
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
      toast.success(`Majlis "${created.name}" berjaya dicipta!`);
      setIsCreateOpen(false);
      setNewWeddingName("");
      setNewWeddingSlug("");
      setNewWeddingDate("");
      setSlugStatus(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal mencipta majlis");
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
      toast.success(`Majlis "${weddingToDelete.name}" telah dipadam`);
      setWeddingToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memadam majlis");
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
    toast.success("Pautan galeri disalin ke clipboard!");
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
          toast.success(`Selamat kembali, ${user.name}!`);
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
                      {activeTab === "weddings" && "Pengurusan Majlis"}
                      {activeTab === "system" && "Status Sistem"}
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
                <span className="hidden sm:inline">Kemaskini</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="size-3.5" />
                <span>Cipta Majlis</span>
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
                    Ringkasan data, statistik majlis, dan status infrastruktur servis.
                  </p>
                </div>

                {/* Metric KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Jumlah Majlis
                      </CardTitle>
                      <Heart className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {weddings.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Majlis berdaftar dalam sistem
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Jumlah Media
                      </CardTitle>
                      <Camera className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats?.totalMedia ?? "—"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Foto & video dalam galeri S3
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Status Wedding Service
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
                        Port 3001 &bull; Postgres Drizzle
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Status Media Service
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
                        Port 3000 &bull; AWS S3 Storage
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Weddings Table */}
                <Card className="shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Majlis Terkini
                      </CardTitle>
                      <CardDescription>
                        5 majlis yang paling baru didaftarkan.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("weddings")}
                      className="text-xs"
                    >
                      Lihat Semua ({weddings.length})
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Majlis</TableHead>
                          <TableHead>Slug URL</TableHead>
                          <TableHead>Tarikh</TableHead>
                          <TableHead className="text-right">Tindakan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weddings.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Tiada majlis ditemui. Sila cipta majlis baru.
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
                                {new Date(w.date).toLocaleDateString("ms-MY", {
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
                                    title="Salin Link"
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
                                    title="Buka Galeri"
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

            {/* TAB 2: WEDDINGS MANAGEMENT */}
            {activeTab === "weddings" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      Pengurusan Majlis
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Kawal, pantau, dan urus semua pendaftaran galeri perkahwinan.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="size-4" />
                    <span>Cipta Majlis Baru</span>
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mengikut nama atau slug..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Menunjukkan {filteredWeddings.length} daripada {weddings.length} majlis
                  </span>
                </div>

                {/* Full Weddings Table */}
                <Card className="shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Majlis / Pengantin</TableHead>
                        <TableHead>Pautan Galeri (Slug)</TableHead>
                        <TableHead>Tarikh Majlis</TableHead>
                        <TableHead>Dicipta Pada</TableHead>
                        <TableHead className="text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWeddings.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            Tiada majlis yang sepadan dengan carian anda.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWeddings.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="font-semibold text-sm">
                              {w.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/80 text-foreground">
                                  /{w.slug}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-muted-foreground" />
                                {new Date(w.date).toLocaleDateString("ms-MY", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {w.createdAt
                                ? new Date(w.createdAt).toLocaleDateString("ms-MY")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleCopyLink(w.slug, w.id)}
                                  className="gap-1 h-7"
                                >
                                  {copiedId === w.id ? (
                                    <>
                                      <Check className="size-3 text-emerald-500" />
                                      <span>Disalin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-3" />
                                      <span>Salin</span>
                                    </>
                                  )}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleViewGallery(w.slug)}
                                  className="gap-1 h-7 text-primary hover:text-primary"
                                >
                                  <ExternalLink className="size-3" />
                                  <span>Galeri</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setWeddingToDelete(w)}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Padam Majlis"
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
                </Card>
              </div>
            )}

            {/* TAB 3: SYSTEM HEALTH & ARCHITECTURE */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Status Sistem & Microservices
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Pemantauan status kesihatan backend microservices Fotokita.
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
                        Port 3001 &bull; Pengurusan Metadata & CRUD
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
                        <span>Endpoint Kesihatan:</span>
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
                        Port 3000 &bull; Muat Naik & S3 Presigned URLs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Storan Objek:</span>
                        <span className="font-mono text-foreground">Amazon S3</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Protokol URL:</span>
                        <span className="font-mono text-foreground">Presigned S3</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Endpoint Kesihatan:</span>
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
                        <span>Keselamatan:</span>
                        <span className="font-mono text-foreground">HMAC-SHA256 JWT</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span>Akses Peranan:</span>
                        <span className="font-mono text-foreground">Super Admin</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Endpoint Kesihatan:</span>
                        <span className="font-mono text-foreground">/health</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Infrastructure Details */}
                <Card className="shadow-xs">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Panduan Menjalankan Servis Backend
                    </CardTitle>
                    <CardDescription>
                      Untuk menjalankan kesemua perkhidmatan mikro Fotokita secara serentak di terminal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/60 font-mono text-xs space-y-2 overflow-x-auto">
                      <p className="text-muted-foreground"># 1. Mulakan pangkalan data Postgres</p>
                      <p className="text-foreground">docker compose up -d postgres</p>
                      <p className="text-muted-foreground mt-3"># 2. Mulakan Wedding Service (Port 3001)</p>
                      <p className="text-foreground">cd services/wedding-service && bun run dev</p>
                      <p className="text-muted-foreground mt-3"># 3. Mulakan Media Service (Port 3000)</p>
                      <p className="text-foreground">cd services/media-service && bun run dev</p>
                      <p className="text-muted-foreground mt-3"># 4. Mulakan Admin Service (Port 3002)</p>
                      <p className="text-foreground">cd services/admin-service && bun run dev</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* CREATE WEDDING DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cipta Majlis Baru</DialogTitle>
            <DialogDescription>
              Daftarkan majlis perkahwinan baru ke dalam pangkalan data.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nama Majlis / Pasangan</label>
              <Input
                placeholder="cth: Amir & Nadia"
                value={newWeddingName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL Slug Galeri</label>
              <Input
                placeholder="amir-dan-nadia"
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
              <label className="text-xs font-medium">Tarikh Majlis</label>
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
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreating || Boolean(slugStatus && !slugStatus.available)}
              >
                {isCreating ? "Mencipta..." : "Cipta Majlis"}
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
              <AlertDialogTitle>Padam Majlis Ini?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Adakah anda pasti mahu memadamkan majlis{" "}
              <strong>&ldquo;{weddingToDelete?.name}&rdquo;</strong> (slug: /{weddingToDelete?.slug})?
              Tindakan ini tidak boleh diundur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setWeddingToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteWedding}
              disabled={isDeleting}
            >
              {isDeleting ? "Memadam..." : "Ya, Padam Majlis"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
