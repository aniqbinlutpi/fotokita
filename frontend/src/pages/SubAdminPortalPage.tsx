import React, { useState, useEffect, useMemo } from "react";
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
import {
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/wedding/Gallery";
import { UploadPhotos } from "@/components/wedding/UploadPhotos";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { SubAdminSidebar } from "@/components/tenant/SubAdminSidebar";
import { SubAdminLoginModal } from "@/components/tenant/SubAdminLoginModal";
import {
  getStoredTenantToken,
  getStoredTenantUser,
  setStoredTenantSession,
  clearStoredTenantSession,
  getTenantProfile,
  getTenantCustomization,
  updateTenantCustomization,
  type TenantAccount,
  type TenantCustomization,
} from "@/api/tenant";
import { updateWedding } from "@/api/wedding";
import { deleteMedia } from "@/api/media";
import { useActiveWedding, weddingKeys } from "@/hooks/queries/useWeddings";
import { useMedia, useDeleteMedia } from "@/hooks/queries/useMedia";
import { useQueryClient } from "@tanstack/react-query";
import type { Wedding } from "@/types/wedding";

interface SubAdminPortalPageProps {
  slug?: string;
  weddingId?: string;
  onNavigateHome?: () => void;
  onOpenGallery?: (slug: string) => void;
  onLoginSuccess?: (tenant: TenantAccount) => void;
}

export const SubAdminPortalPage: React.FC<SubAdminPortalPageProps> = ({
  slug: propSlug,
  weddingId: propWeddingId,
  onNavigateHome,
  onOpenGallery,
  onLoginSuccess,
}) => {
  const queryClient = useQueryClient();

  // Read URL search params
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const activeSlug = propSlug || urlParams.get("slug") || undefined;
  const activeWeddingId = propWeddingId || urlParams.get("weddingId") || undefined;

  // Authentication state
  const [tenant, setTenant] = useState<TenantAccount | null>(() => {
    const token = getStoredTenantToken();
    const user = getStoredTenantUser();
    return token && user ? user : null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!tenant);

  // Device frame view switcher ('full' | 'mobile' | 'tablet')
  const [deviceView, setDeviceView] = useState<"full" | "mobile" | "tablet">("full");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Query wedding from PostgreSQL (drizzle orm via wedding-service)
  const {
    data: dbWedding,
    isLoading: isLoadingWedding,
    error: weddingError,
    refetch: refetchWedding,
  } = useActiveWedding({
    slug: activeSlug || tenant?.weddingSlug,
    weddingId: activeWeddingId || tenant?.weddingId,
  });

  // Parse partner names helper
  const parsedPartnerNames = useMemo(() => {
    const name = dbWedding?.name || tenant?.weddingName;
    if (!name) return { p1: "", p2: "" };
    if (name.includes("&")) {
      const parts = name.split("&").map((s) => s.trim());
      return { p1: parts[0] || "", p2: parts[1] || "" };
    }
    if (name.includes("and")) {
      const parts = name.split("and").map((s) => s.trim());
      return { p1: parts[0] || "", p2: parts[1] || "" };
    }
    return { p1: name, p2: "" };
  }, [dbWedding?.name, tenant?.weddingName]);

  // Customization state
  const [customization, setCustomization] = useState<TenantCustomization>(() => ({
    weddingId: tenant?.weddingId || activeWeddingId || "",
    partner1: parsedPartnerNames.p1,
    partner2: parsedPartnerNames.p2,
    weddingDate: "2026-10-30",
    eyebrow: "- WEDDING ARCHIVE -",
    tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
    themePalette: "warmGold",
    fireworksEnabled: true,
    orbStyle: "warmGoldChocolate",
    fontPreset: "editorial-serif",
    slug: activeSlug || tenant?.weddingSlug || "",
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Effective wedding ID and slug
  const targetWeddingId = dbWedding?.id || tenant?.weddingId || customization.weddingId;

  // Media listing from media-service (PostgreSQL & S3)
  const {
    data: mediaList = [],
    isLoading: isLoadingMedia,
    error: mediaQueryError,
    refetch: refetchMedia,
  } = useMedia(targetWeddingId);

  const deleteMutation = useDeleteMedia(targetWeddingId);

  // Fetch initial customization and live tenant profile
  useEffect(() => {
    if (tenant) {
      getTenantProfile()
        .then((updatedTenant) => {
          setTenant(updatedTenant);
          const token = getStoredTenantToken();
          if (token) setStoredTenantSession(token, updatedTenant);
        })
        .catch(() => {});
    }
  }, []);

  // Sync customization whenever dbWedding loads or updates
  useEffect(() => {
    const identifier = dbWedding?.id || activeSlug || tenant?.weddingId;
    if (!identifier) return;

    let isMounted = true;
    getTenantCustomization(identifier)
      .then((data) => {
        if (!isMounted) return;
        setCustomization((prev) => {
          if (hasUnsavedChanges) return prev;
          const fallbackP1 = parsedPartnerNames.p1 || "Afiq";
          const fallbackP2 = parsedPartnerNames.p2 || "Wieam";
          return {
            weddingId: dbWedding?.id || data.weddingId || prev.weddingId,
            partner1: data.partner1 || prev.partner1 || fallbackP1,
            partner2: data.partner2 || prev.partner2 || fallbackP2,
            weddingDate:
              data.weddingDate ||
              (dbWedding?.date ? dbWedding.date.split("T")[0] : prev.weddingDate) ||
              "2026-10-30",
            eyebrow: data.eyebrow || "- WEDDING ARCHIVE -",
            tagline:
              data.tagline ||
              "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
            themePalette: data.themePalette || "warmGold",
            fireworksEnabled:
              typeof data.fireworksEnabled === "boolean" ? data.fireworksEnabled : true,
            orbStyle: data.orbStyle || "warmGoldChocolate",
            fontPreset: data.fontPreset || "editorial-serif",
            slug: data.slug || dbWedding?.slug || activeSlug || tenant?.weddingSlug || prev.slug,
          };
        });
      })
      .catch((err) => {
        console.warn("Could not fetch remote customization, using active wedding data:", err);
        setCustomization((prev) => {
          if (hasUnsavedChanges) return prev;
          return {
            ...prev,
            weddingId: dbWedding?.id || prev.weddingId,
            partner1: prev.partner1 || parsedPartnerNames.p1 || "Afiq",
            partner2: prev.partner2 || parsedPartnerNames.p2 || "Wieam",
            weddingDate: dbWedding?.date ? dbWedding.date.split("T")[0] : prev.weddingDate,
            slug: dbWedding?.slug || activeSlug || tenant?.weddingSlug || prev.slug,
          };
        });
      });

    return () => {
      isMounted = false;
    };
  }, [dbWedding?.id, dbWedding?.name, dbWedding?.slug, dbWedding?.date, activeSlug, parsedPartnerNames]);

  const handleCustomizationChange = (updated: Partial<TenantCustomization>) => {
    setCustomization((prev) => ({
      ...prev,
      ...updated,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    const finalWeddingId = dbWedding?.id || tenant?.weddingId || customization.weddingId;
    if (!finalWeddingId) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const combinedName =
        customization.partner1 && customization.partner2
          ? `${customization.partner1.trim()} & ${customization.partner2.trim()}`
          : customization.partner1?.trim() || dbWedding?.name || "Wedding Archive";

      const targetSlug =
        customization.slug?.trim().toLowerCase() ||
        dbWedding?.slug ||
        tenant?.weddingSlug;

      // 1. Update wedding in wedding-service (PostgreSQL weddings table via Drizzle ORM)
      let syncedSlug = targetSlug;
      try {
        const updatedWedding = await updateWedding(finalWeddingId, {
          name: combinedName,
          slug: targetSlug,
          date: customization.weddingDate
            ? new Date(customization.weddingDate).toISOString()
            : undefined,
        });
        if (updatedWedding?.slug) {
          syncedSlug = updatedWedding.slug;
        }
      } catch (weddingErr) {
        console.warn("Could not directly patch wedding-service, tenant-service will attempt sync:", weddingErr);
      }

      // 2. Persist customization in PostgreSQL tenant_customizations via Drizzle ORM
      const result = await updateTenantCustomization(finalWeddingId, {
        ...customization,
        weddingId: finalWeddingId,
        partner1: customization.partner1.trim(),
        partner2: customization.partner2.trim(),
        slug: syncedSlug,
      });

      const newSlug = result.slug || syncedSlug || customization.slug || tenant?.weddingSlug;
      if (newSlug) {
        setCustomization((prev) => ({ ...prev, slug: newSlug }));
        if (tenant) {
          setTenant((prev) => {
            if (!prev) return null;
            const updatedTenant = {
              ...prev,
              weddingSlug: newSlug,
              weddingName: combinedName,
            };
            const token = getStoredTenantToken();
            if (token) setStoredTenantSession(token, updatedTenant);
            return updatedTenant;
          });
        }

        // Update URL query string to reflect new slug
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("slug", newSlug);
        window.history.replaceState({}, "", newUrl.toString());
      }

      // Invalidate queries to update all gallery views
      queryClient.invalidateQueries({ queryKey: weddingKeys.all });
      await refetchWedding();
      await refetchMedia();

      setHasUnsavedChanges(false);
      toast.success("Perubahan Berjaya Disimpan!", {
        description: `Tetamu boleh melihat perubahan secara langsung di fotokita.my/?slug=${newSlug}`,
      });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error("Gagal Menyimpan Perubahan", {
        description: err?.message || "Sila semak sambungan pangkalan data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearStoredTenantSession();
    setTenant(null);
    setIsLoginModalOpen(true);
    toast.info("Anda telah log keluar daripada portal Sub-Admin.");
  };

  const handleOpenLiveGuestView = () => {
    const slug = customization.slug || dbWedding?.slug || tenant?.weddingSlug || activeSlug || "wedding";
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleDeleteMedia = async (mediaId: string, code?: string) => {
    try {
      if (code) {
        await deleteMedia(mediaId, code);
        await refetchMedia();
      } else {
        await deleteMutation.mutateAsync(mediaId);
      }
      try {
        localStorage.removeItem(`fotokita_secret_${mediaId}`);
      } catch {
        // Ignored
      }
      toast.success("Foto dipadam daripada arkib");
    } catch (err: any) {
      console.error("Failed to delete media:", err);
      toast.error("Gagal memadam foto", {
        description: err?.message || "Sila semak kod rahsia atau sambungan pangkalan data.",
      });
      throw err;
    }
  };

  const handleUploadSuccess = () => {
    refetchMedia();
  };

  // Synthesized active wedding object for Live Guest View components
  const activeWedding: Wedding = useMemo(() => {
    return {
      id: dbWedding?.id || customization.weddingId,
      name:
        customization.partner1 && customization.partner2
          ? `${customization.partner1} & ${customization.partner2}`
          : customization.partner1 || dbWedding?.name || "Wedding Archive",
      slug: customization.slug || dbWedding?.slug || tenant?.weddingSlug || activeSlug || "wedding",
      date: customization.weddingDate || dbWedding?.date || "2026-10-30",
      createdAt: dbWedding?.createdAt || new Date().toISOString(),
    };
  }, [dbWedding, customization, tenant?.weddingSlug, activeSlug]);

  // If not logged in and no session, show login overlay prompt
  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SubAdminLoginModal
          isOpen={isLoginModalOpen}
          onOpenChange={(open) => {
            setIsLoginModalOpen(open);
            if (!open && !tenant) {
              const activeToken = getStoredTenantToken();
              if (!activeToken && onNavigateHome) {
                onNavigateHome();
              }
            }
          }}
          onSuccess={(loggedInTenant) => {
            setTenant(loggedInTenant);
            setIsLoginModalOpen(false);
            if (onLoginSuccess) {
              onLoginSuccess(loggedInTenant);
            }
            getTenantCustomization(loggedInTenant.weddingId)
              .then((data) => {
                setCustomization({
                  ...data,
                  weddingId: loggedInTenant.weddingId,
                  slug: data.slug || loggedInTenant.weddingSlug || "",
                });
              })
              .catch(() => {});
          }}
        />

        <div className="text-center space-y-4 max-w-sm">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock className="size-7" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-foreground">
            Akses Portal Sub-Admin
          </h2>
          <p className="text-xs text-muted-foreground">
            Sila log masuk dengan akaun Sub-Admin anda untuk mengurus dan menyunting galeri perkahwinan ini.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Log Masuk Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Left Sub-Admin Sidebar */}
        <SubAdminSidebar
          tenant={tenant}
          customization={customization}
          onChangeCustomization={handleCustomizationChange}
          onSave={handleSave}
          isSaving={isSaving}
          onLogout={handleLogout}
          onOpenLiveGuestView={handleOpenLiveGuestView}
        />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* Top Bar Header */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/60 backdrop-blur-md px-4 z-20">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 cursor-pointer" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden sm:block">
                    <BreadcrumbLink
                      onClick={onNavigateHome}
                      className="cursor-pointer text-xs"
                    >
                      Fotokita
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink className="text-xs font-medium text-foreground">
                      Sub-Admin Portal
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs text-muted-foreground">
                      Live Guest View Editor
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right Action Controls: Device Mockup Switcher & Save Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Responsive Device View Toggle */}
              <div className="hidden md:flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceView("full")}
                  title="Full Viewport"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    deviceView === "full"
                      ? "bg-background shadow-2xs font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span>Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView("tablet")}
                  title="Tablet Mockup Frame (768px)"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    deviceView === "tablet"
                      ? "bg-background shadow-2xs font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Tablet className="size-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView("mobile")}
                  title="Mobile Mockup Frame (410px)"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    deviceView === "mobile"
                      ? "bg-background shadow-2xs font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* View as Guest link */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLiveGuestView}
                className="hidden sm:inline-flex text-xs h-8 cursor-pointer"
              >
                <Eye className="size-3.5 mr-1 text-muted-foreground" />
                <span>Guest View ↗</span>
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className={`text-xs h-8 shadow-sm cursor-pointer ${
                  hasUnsavedChanges
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground animate-pulse"
                    : ""
                }`}
              >
                <Sparkles className="size-3.5 mr-1" />
                {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes*" : "Saved"}
              </Button>
            </div>
          </header>

          {/* Main Visual Canvas: Live Guest View matching WeddingGalleryPage! */}
          <main className="flex-1 overflow-y-auto bg-[#F8F5F0] dark:bg-[#12100E] p-0 flex items-start justify-center transition-colors">
            <div
              className={`w-full transition-all duration-300 flex flex-col ${
                deviceView === "mobile"
                  ? "max-w-[410px] h-[840px] max-h-[calc(100vh-4.5rem)] my-6 rounded-3xl border-8 border-[#2F2926] shadow-2xl overflow-hidden bg-[#F8F5F0] dark:bg-[#12100E]"
                  : deviceView === "tablet"
                  ? "max-w-[768px] h-[900px] max-h-[calc(100vh-4.5rem)] my-6 rounded-2xl border-4 border-[#2F2926] shadow-2xl overflow-hidden bg-[#F8F5F0] dark:bg-[#12100E]"
                  : "max-w-full min-h-full"
              }`}
            >
              {/* Mobile / Tablet simulated status bar */}
              {deviceView !== "full" && (
                <div className="bg-[#2F2926] text-[#F5EFEB] text-[10px] py-1.5 px-4 flex items-center justify-between select-none shrink-0 z-30">
                  <span>9:41 AM</span>
                  <span className="font-mono text-[9px] text-[#C9AA7C]">fotokita.my/?slug={activeWedding.slug}</span>
                  <span>100%</span>
                </div>
              )}

              {/* Guest View Scrollable Area */}
              <div className={`w-full flex-1 flex flex-col ${deviceView !== "full" ? "overflow-y-auto" : ""}`}>
                {/* Guest Navigation Bar */}
                <nav className="border-b border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8]/80 dark:bg-[#1A1715]/80 backdrop-blur-md sticky top-0 left-0 right-0 z-40 px-6 py-3 transition-colors duration-300">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-serif tracking-widest text-base sm:text-lg font-medium text-[#2F2926] dark:text-[#F5EFEB] uppercase">
                        Fotokita
                      </span>
                      <span className="hidden sm:inline-block w-px h-3.5 bg-[#E7DED5] dark:bg-[#332B25]" />
                      <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-[#7A7069] dark:text-[#A89F97]">
                        Editorial Wedding Gallery
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-xs text-[#7A7069] dark:text-[#A89F97] hidden md:inline-block">
                        Archive: <span className="text-[#2F2926] dark:text-[#F5EFEB] font-medium">{activeWedding.name}</span>
                      </span>

                      <AnimatedThemeToggler
                        variant="circle"
                        duration={450}
                        className="text-[#7A7069] dark:text-[#A89F97] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 cursor-pointer p-1 flex items-center justify-center select-none [&_svg]:size-4"
                        title="Toggle dark / light mode"
                        aria-label="Toggle dark / light mode"
                      />

                      <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        className="text-xs uppercase tracking-widest text-[#A67C6B] hover:text-[#2F2926] dark:hover:text-[#F5EFEB] transition-colors duration-200 font-medium cursor-pointer"
                      >
                        + Upload
                      </button>
                    </div>
                  </div>
                </nav>

                {/* Error / Loading State Banner if any */}
                {weddingError && (
                  <div className="bg-destructive/10 border-b border-destructive/20 text-destructive text-xs px-4 py-2 text-center">
                    Gagal memuat arkib dari pangkalan data: {(weddingError as Error).message}
                  </div>
                )}
                {isLoadingWedding && !dbWedding && (
                  <div className="bg-primary/5 text-muted-foreground text-xs px-4 py-2 text-center animate-pulse">
                    Memuat data arkib majlis dari pangkalan data...
                  </div>
                )}

                {/* Hero Section */}
                <div className="w-full relative">
                  <WeddingHero
                    wedding={activeWedding}
                    photoCount={mediaList.length}
                    onOpenUpload={() => setIsUploadOpen(true)}
                    partner1Name={customization.partner1}
                    partner2Name={customization.partner2}
                    customDate={customization.weddingDate}
                    eyebrow={customization.eyebrow}
                    tagline={customization.tagline}
                    themePalette={customization.themePalette}
                    fireworksEnabled={customization.fireworksEnabled}
                  />
                </div>

                {/* Gallery Section */}
                <div className="w-full flex-1">
                  <Gallery
                    weddingId={activeWedding.id}
                    wedding={activeWedding}
                    mediaList={mediaList}
                    isLoading={isLoadingMedia}
                    error={mediaQueryError ? (mediaQueryError as Error).message : null}
                    onRefresh={refetchMedia}
                    onDeleteMedia={handleDeleteMedia}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                </div>

                {/* Footer Section */}
                <footer className="border-t border-[#E7DED5] dark:border-[#332B25] bg-[#FFFCF8] dark:bg-[#1A1715] py-8 px-6 text-center text-xs text-[#7A7069] dark:text-[#A89F97] transition-colors duration-300 mt-auto">
                  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-serif italic text-sm text-[#2F2926] dark:text-[#F5EFEB]">
                      Fotokita — Preserving timeless wedding memories
                    </p>
                    <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest">
                      <span>Photography & Art Direction</span>
                      <span className="w-1 h-1 rounded-full bg-[#A67C6B]" />
                      <span className="text-[#A67C6B] font-semibold">
                        Live Guest View
                      </span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </main>
        </SidebarInset>

        {/* Upload Modal Dialog for live testing upload */}
        {activeWedding && (
          <UploadPhotos
            weddingId={activeWedding.id}
            wedding={activeWedding}
            isOpen={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default SubAdminPortalPage;
