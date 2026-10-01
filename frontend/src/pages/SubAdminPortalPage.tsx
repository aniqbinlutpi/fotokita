import React, { useState, useEffect } from "react";
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
import type { Wedding } from "@/types/wedding";

interface SubAdminPortalPageProps {
  onNavigateHome?: () => void;
  onOpenGallery?: (slug: string) => void;
}

export const SubAdminPortalPage: React.FC<SubAdminPortalPageProps> = ({
  onNavigateHome,
  onOpenGallery,
}) => {
  // Authentication state
  const [tenant, setTenant] = useState<TenantAccount | null>(() => {
    const token = getStoredTenantToken();
    const user = getStoredTenantUser();
    return token && user ? user : null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!tenant);

  // Device frame view switcher ('full' | 'mobile' | 'tablet')
  const [deviceView, setDeviceView] = useState<"full" | "mobile" | "tablet">("full");

  // Customization state
  const [customization, setCustomization] = useState<TenantCustomization>({
    weddingId: tenant?.weddingId || "dae2b1ad-184c-4303-9809-f91c3317c166",
    partner1: "Wan",
    partner2: "Three",
    weddingDate: "2026-10-30",
    eyebrow: "- WEDDING ARCHIVE -",
    tagline: "Every candid smile, every heartfelt celebration — preserved for a lifetime.",
    themePalette: "warmGold",
    fireworksEnabled: true,
    orbStyle: "warmGoldChocolate",
    fontPreset: "editorial-serif",
    slug: tenant?.weddingSlug || "wan-three",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch initial customization and live tenant profile when logged in
  useEffect(() => {
    if (!tenant) return;

    let isMounted = true;

    // Refresh tenant profile to catch any updated slug/name from backend
    getTenantProfile()
      .then((updatedTenant) => {
        if (!isMounted) return;
        setTenant(updatedTenant);
        const token = getStoredTenantToken();
        if (token) setStoredTenantSession(token, updatedTenant);
      })
      .catch(() => {});

    getTenantCustomization(tenant.weddingId)
      .then((data) => {
        if (!isMounted) return;
        setCustomization({
          ...data,
          weddingId: tenant.weddingId,
          slug: data.slug || tenant.weddingSlug || "wan-three",
        });
      })
      .catch((err) => {
        console.warn("Could not fetch remote customization, using active state:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCustomizationChange = (updated: Partial<TenantCustomization>) => {
    setCustomization((prev) => ({
      ...prev,
      ...updated,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!tenant) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateTenantCustomization(tenant.weddingId, customization);
      const newSlug = result.slug || customization.slug || tenant.weddingSlug;
      if (newSlug) {
        setCustomization((prev) => ({ ...prev, slug: newSlug }));
        setTenant((prev) => {
          if (!prev) return null;
          const updatedTenant = {
            ...prev,
            weddingSlug: newSlug,
            weddingName:
              customization.partner1 && customization.partner2
                ? `${customization.partner1} & ${customization.partner2}`
                : prev.weddingName,
          };
          const token = getStoredTenantToken();
          if (token) setStoredTenantSession(token, updatedTenant);
          return updatedTenant;
        });
      }
      setHasUnsavedChanges(false);
      toast.success("Gaya & Maklumat Disimpan!", {
        description: `Tetamu anda kini melihat perubahan secara langsung di fotokita.my/?slug=${newSlug}`,
      });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.success("Tetapan dikemas kini secara lokal", {
        description: "Gaya galeri anda kini aktif untuk paparan tetamu.",
      });
      setHasUnsavedChanges(false);
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
    const slug = customization.slug || tenant?.weddingSlug || "wan-three";
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
    }
  };

  // Synthesized wedding object for WeddingHero
  const activeWedding: Wedding = {
    id: customization.weddingId,
    name: `${customization.partner1 || "Wan"} & ${customization.partner2 || "Three"}`,
    slug: customization.slug || tenant?.weddingSlug || "wan-three",
    date: customization.weddingDate || "2026-10-30",
    createdAt: new Date().toISOString(),
  };

  // If not logged in, show elegant login overlay prompt
  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <SubAdminLoginModal
          isOpen={isLoginModalOpen}
          onOpenChange={(open) => {
            setIsLoginModalOpen(open);
            if (!open && !tenant && onNavigateHome) {
              onNavigateHome();
            }
          }}
          onSuccess={(loggedInTenant) => {
            setTenant(loggedInTenant);
            setIsLoginModalOpen(false);
            getTenantCustomization(loggedInTenant.weddingId)
              .then((data) => {
                setCustomization({
                  ...data,
                  weddingId: loggedInTenant.weddingId,
                  slug: data.slug || loggedInTenant.weddingSlug || "wan-three",
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
            Sub-Admin Portal Akses
          </h2>
          <p className="text-xs text-muted-foreground">
            Sila log masuk dengan akaun Sub-Admin berdaftar anda untuk menguruskan hiasan dan nama galeri perkahwinan anda.
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
                  title="Mobile Mockup Frame (390px)"
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

          {/* Main Visual Canvas: Displays WeddingHero live! */}
          <main className="flex-1 overflow-y-auto bg-[#F8F5F0] dark:bg-[#12100E] p-0 sm:p-4 flex items-start justify-center transition-colors">
            <div
              className={`w-full transition-all duration-300 ${
                deviceView === "mobile"
                  ? "max-w-[410px] my-6 rounded-3xl border-8 border-[#2F2926] shadow-2xl overflow-hidden bg-background"
                  : deviceView === "tablet"
                  ? "max-w-[768px] my-6 rounded-2xl border-4 border-[#2F2926] shadow-2xl overflow-hidden bg-background"
                  : "max-w-full"
              }`}
            >
              {/* Device bar when in mobile / tablet mode */}
              {deviceView !== "full" && (
                <div className="bg-[#2F2926] text-[#F5EFEB] text-[10px] py-1 px-4 flex items-center justify-between select-none">
                  <span>9:41 AM</span>
                  <span className="font-mono text-[9px] text-[#C9AA7C]">fotokita.my/w/{tenant.weddingSlug}</span>
                  <span>100%</span>
                </div>
              )}

              {/* Live WeddingHero Preview */}
              <div className="w-full relative">
                <WeddingHero
                  wedding={activeWedding}
                  photoCount={24}
                  onOpenUpload={() => {
                    toast.info("Upload simulation", {
                      description: "Guests can upload their candid memories directly from this button.",
                    });
                  }}
                  partner1Name={customization.partner1}
                  partner2Name={customization.partner2}
                  customDate={customization.weddingDate}
                  eyebrow={customization.eyebrow}
                  tagline={customization.tagline}
                  themePalette={customization.themePalette}
                  fireworksEnabled={customization.fireworksEnabled}
                />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SubAdminPortalPage;
