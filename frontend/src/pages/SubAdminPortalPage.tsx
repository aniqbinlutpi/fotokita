import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  RotateCcw,
  QrCode,
  Copy,
  Check,
  X,
  Apple,
} from "lucide-react";
import { toast } from "sonner";
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
import { useActiveWedding, weddingKeys } from "@/hooks/queries/useWeddings";
import { useQueryClient } from "@tanstack/react-query";

export interface PhoneProfile {
  id: string;
  name: string;
  brand: "Apple" | "Android";
  category?: "phone" | "tablet";
  width: number;
  height: number;
  resolutionLabel: string;
}

export const PHONE_PROFILES: PhoneProfile[] = [
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    brand: "Apple",
    category: "phone",
    width: 393,
    height: 852,
    resolutionLabel: "393 × 852 px",
  },
  {
    id: "iphone-16-promax",
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    category: "phone",
    width: 430,
    height: 932,
    resolutionLabel: "430 × 932 px",
  },
  {
    id: "iphone-se",
    name: "iPhone SE / 13 mini",
    brand: "Apple",
    category: "phone",
    width: 375,
    height: 720,
    resolutionLabel: "375 × 720 px",
  },
  {
    id: "ipad-air",
    name: "iPad Air / 11″",
    brand: "Apple",
    category: "tablet",
    width: 820,
    height: 1180,
    resolutionLabel: "820 × 1180 px",
  },
  {
    id: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Android",
    category: "phone",
    width: 412,
    height: 915,
    resolutionLabel: "412 × 915 px",
  },
  {
    id: "google-pixel-9",
    name: "Google Pixel 9",
    brand: "Android",
    category: "phone",
    width: 412,
    height: 892,
    resolutionLabel: "412 × 892 px",
  },
];

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // View Mode: 'desktop' | 'mobile'
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("mobile");
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("iphone-16-pro");
  const [zoomLevel, setZoomLevel] = useState<"fit" | "100" | "85" | "75" | "65">("fit");
  const [windowHeight, setWindowHeight] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedPhone = useMemo(
    () => PHONE_PROFILES.find((p) => p.id === selectedPhoneId) || PHONE_PROFILES[0]!,
    [selectedPhoneId]
  );

  const totalPhoneHeight = selectedPhone.height;
  const fitScale = useMemo(() => {
    // Header is 56px, canvas padding and breathing room is ~130px
    const availableH = Math.max(380, windowHeight - 130);
    const heightScale = availableH / totalPhoneHeight;
    // For wider devices like iPad (820px wide), ensure it also fits comfortably horizontally beside control dock
    const widthScale = 520 / selectedPhone.width;
    const calculated =
      selectedPhone.category === "tablet"
        ? Math.min(heightScale, widthScale)
        : heightScale;
    // Cap fit scale between 0.42 and 0.78 so it comfortably fits any screen
    return Math.min(0.78, Math.max(0.42, Number(calculated.toFixed(3))));
  }, [windowHeight, totalPhoneHeight, selectedPhone.width, selectedPhone.category]);

  const activeScale =
    zoomLevel === "100"
      ? 1
      : zoomLevel === "85"
      ? 0.85
      : zoomLevel === "75"
      ? 0.75
      : zoomLevel === "65"
      ? 0.65
      : fitScale;

  // Query wedding from PostgreSQL (drizzle orm via wedding-service)
  const {
    data: dbWedding,
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

  // Synchronize live changes with iframe simulator via postMessage
  const syncCustomizationWithIframe = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "FOTOKITA_PREVIEW_SYNC",
          customization,
        },
        "*"
      );
    } catch {
      // ignore
    }
  }, [customization]);

  useEffect(() => {
    syncCustomizationWithIframe();
  }, [syncCustomizationWithIframe]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === "FOTOKITA_PREVIEW_READY") {
        syncCustomizationWithIframe();
      }
    };
    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [syncCustomizationWithIframe]);

  const handleCustomizationChange = (updated: Partial<TenantCustomization>) => {
    setCustomization((prev) => {
      const next = { ...prev, ...updated };
      return next;
    });
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
      syncCustomizationWithIframe();

      setHasUnsavedChanges(false);
      toast.success("Changes Saved Successfully!", {
        description: `Guests can view live updates at fotokita.my/?slug=${newSlug}`,
      });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error("Failed to Save Changes", {
        description: err?.message || "Please check your database connection.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    clearStoredTenantSession();
    setTenant(null);
    setIsLoginModalOpen(true);
    toast.info("You have been signed out from the Sub-Admin portal.");
  };

  const handleOpenLiveGuestView = () => {
    const slug = customization.slug || dbWedding?.slug || tenant?.weddingSlug || activeSlug || "wedding";
    if (onOpenGallery) {
      onOpenGallery(slug);
    } else {
      window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank", "noopener,noreferrer");
    }
  };

  // Preview URL pointing to WeddingGalleryPage inside iframe
  const currentSlug = customization.slug || dbWedding?.slug || tenant?.weddingSlug || activeSlug || "wedding";
  const finalWeddingId = dbWedding?.id || tenant?.weddingId || customization.weddingId || activeWeddingId;
  const previewIframeUrl = `/?slug=${encodeURIComponent(currentSlug)}${finalWeddingId ? `&weddingId=${encodeURIComponent(finalWeddingId)}` : ""}&preview=subadmin`;

  const guestPublicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?slug=${encodeURIComponent(currentSlug)}`;

  const handleRefreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewIframeUrl;
      toast.info("Refreshing preview...");
    }
  };

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
            Sub-Admin Portal Access
          </h2>
          <p className="text-xs text-muted-foreground">
            Please sign in with your Sub-Admin account to customize this wedding gallery.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Sign In Now
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

            {/* Right Action Controls: Mode Switcher, Phone Selector, Zoom & Tools */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Desktop vs Mobile Toggle */}
              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === "desktop"
                      ? "bg-background shadow-xs font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mobile")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === "mobile"
                      ? "bg-background shadow-xs font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* Refresh Preview Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshPreview}
                title="Refresh preview"
                className="size-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
              >
                <RotateCcw className="size-3.5" />
              </Button>

              {/* Scan on Phone / QR Code */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQrModalOpen(true)}
                title="Scan QR code to test on real phone"
                className="hidden sm:inline-flex text-xs h-8 cursor-pointer gap-1.5 shrink-0"
              >
                <QrCode className="size-3.5 text-muted-foreground" />
                <span>Test Phone</span>
              </Button>

              {/* View as Guest link */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenLiveGuestView}
                className="hidden sm:inline-flex text-xs h-8 cursor-pointer shrink-0"
              >
                <Eye className="size-3.5 mr-1 text-muted-foreground" />
                <span>Guest View ↗</span>
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className={`text-xs h-8 shadow-sm cursor-pointer shrink-0 ${
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

          {/* Main Visual Canvas: Responsive Desktop or Scaled Mobile Phone Simulator */}
          <main className="flex-1 overflow-auto bg-[#F2EDE4] dark:bg-[#0D0B0A] p-4 sm:p-6 flex items-center justify-center transition-colors relative">
            {viewMode === "desktop" ? (
              <div className="w-full h-full rounded-lg border border-border shadow-xs overflow-hidden bg-background">
                <iframe
                  ref={iframeRef}
                  src={previewIframeUrl}
                  key="desktop-preview"
                  title="Live Guest View Simulator - Desktop"
                  onLoad={() => syncCustomizationWithIframe()}
                  className="w-full h-full border-0 bg-[#F8F5F0] dark:bg-[#12100E]"
                />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-h-full">
                {/* Clean Mobile Viewport (Tanpa Fake Bezel / Status Bar) */}
                <div
                  style={{
                    width: `${Math.round(selectedPhone.width * activeScale)}px`,
                    height: `${Math.round(totalPhoneHeight * activeScale)}px`,
                  }}
                  className="relative shrink-0 rounded-2xl shadow-2xl border border-border/80 overflow-hidden bg-background ring-1 ring-black/5 dark:ring-white/10"
                >
                  <div
                    style={{
                      width: `${selectedPhone.width}px`,
                      height: `${totalPhoneHeight}px`,
                      transform: `scale(${activeScale})`,
                      transformOrigin: "top left",
                    }}
                    className="absolute top-0 left-0 transition-transform duration-200"
                  >
                    {/* Live Guest View Iframe (100% Full Mobile Viewport) */}
                    <iframe
                      ref={iframeRef}
                      src={previewIframeUrl}
                      key={selectedPhone.id}
                      title="Live Guest View Simulator"
                      onLoad={() => {
                        syncCustomizationWithIframe();
                      }}
                      className="w-full h-full border-0 bg-[#F8F5F0] dark:bg-[#12100E]"
                    />
                  </div>
                </div>

                {/* Side Device Controller (Beside Device) */}
                <div className="flex flex-col gap-3 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-2xl p-3.5 w-60 shrink-0 text-xs animate-in fade-in-50">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-border/50">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                      {selectedPhone.category === "tablet" ? (
                        <Tablet className="size-3.5 text-primary" />
                      ) : (
                        <Smartphone className="size-3.5 text-primary" />
                      )}
                      <span>Select Device</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                      {selectedPhone.resolutionLabel}
                    </span>
                  </div>

                  {/* Device List */}
                  <div className="space-y-1">
                    {PHONE_PROFILES.map((phone) => {
                      const isSelected = selectedPhoneId === phone.id;
                      return (
                        <button
                          key={phone.id}
                          type="button"
                          onClick={() => setSelectedPhoneId(phone.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
                            isSelected
                              ? "bg-foreground text-background font-medium shadow-xs"
                              : "hover:bg-muted/70 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {phone.category === "tablet" ? (
                              <Tablet
                                className={`size-3.5 shrink-0 ${
                                  isSelected ? "text-background" : "text-blue-500 dark:text-blue-400"
                                }`}
                              />
                            ) : phone.brand === "Apple" ? (
                              <Apple
                                className={`size-3.5 shrink-0 ${
                                  isSelected ? "text-background" : "text-foreground"
                                }`}
                              />
                            ) : (
                              <Smartphone
                                className={`size-3.5 shrink-0 ${
                                  isSelected ? "text-emerald-300" : "text-emerald-500"
                                }`}
                              />
                            )}
                            <span className="truncate">{phone.name}</span>
                          </div>
                          {isSelected && (
                            <Check className="size-3.5 shrink-0 ml-1 text-primary-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* Zoom Scale Switcher */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Display Zoom
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {Math.round(activeScale * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/50 text-[11px]">
                      {(["fit", "65", "75", "100"] as const).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setZoomLevel(z)}
                          className={`py-1 rounded text-center transition-colors cursor-pointer capitalize ${
                            zoomLevel === z
                              ? "bg-background shadow-xs font-semibold text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {z === "fit" ? "Fit" : `${z}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions (Refresh / Test Phone) */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPreview}
                      className="flex-1 text-xs h-7.5 cursor-pointer gap-1.5"
                    >
                      <RotateCcw className="size-3" />
                      <span>Refresh</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQrModalOpen(true)}
                      className="flex-1 text-xs h-7.5 cursor-pointer gap-1.5"
                    >
                      <QrCode className="size-3" />
                      <span>QR Code</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>

        {/* Test on Phone QR Modal */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
              <div className="text-center space-y-1">
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Test on Real Phone
                </h3>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code below with your phone camera to preview live guest view directly on your device.
                </p>
              </div>
              <div className="flex justify-center p-3 bg-white rounded-xl border border-border shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(guestPublicUrl)}`}
                  alt="Guest Gallery QR Code"
                  className="size-48 object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/40 border border-border text-xs">
                <span className="truncate flex-1 font-mono text-[11px] text-muted-foreground">
                  {guestPublicUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(guestPublicUrl);
                    setCopiedQrLink(true);
                    setTimeout(() => setCopiedQrLink(false), 2000);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="shrink-0 p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {copiedQrLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <Button
                type="button"
                onClick={() => {
                  window.open(guestPublicUrl, "_blank", "noopener,noreferrer");
                  setIsQrModalOpen(false);
                }}
                variant="outline"
                className="w-full text-xs cursor-pointer"
              >
                <Eye className="size-3.5 mr-1.5" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};

export default SubAdminPortalPage;
