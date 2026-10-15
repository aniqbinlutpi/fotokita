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
  Smartphone,
  Monitor,
  Eye,
  Lock,
  RotateCcw,
  QrCode,
  Copy,
  Check,
  X,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { FotokitaLogo } from "@/components/common/FotokitaLogo";
import { InvitationEditor } from "@/components/tenant/InvitationEditor";
import { SubAdminSidebar } from "@/components/tenant/SubAdminSidebar";
import { SubAdminLoginModal } from "@/components/tenant/SubAdminLoginModal";
import { SubAdminDesktopCanvas } from "@/components/tenant/SubAdminDesktopCanvas";
import { SubAdminMobileCanvas } from "@/components/tenant/SubAdminMobileCanvas";
import { SubAdminLayoutGuideModal } from "@/components/tenant/SubAdminLayoutGuideModal";
import { SubAdminMediaDashboard } from "@/components/tenant/SubAdminMediaDashboard";
import { useMedia } from "@/hooks/queries/useMedia";
import { formatBytes } from "@/lib/mediaZip";
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
    if (!token || !user) return null;
    // If activeSlug is specified in the URL and does not match the stored user's wedding, require login for this wedding
    if (activeSlug && user.weddingSlug && user.weddingSlug !== activeSlug) {
      return null;
    }
    return user;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!tenant);

  // Active View: 'editor' | 'dashboard'
  const [activeView, setActiveView] = useState<"editor" | "dashboard" | "invitation">("editor");

  // View Mode: 'desktop' | 'mobile'
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop"
  );
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("iphone-16-pro");
  const [zoomLevel, setZoomLevel] = useState<"fit" | "100" | "85" | "75" | "65">("fit");
  const [showAlignmentGuides, setShowAlignmentGuides] = useState<boolean>(true);
  const [showMobileBoundary, setShowMobileBoundary] = useState<boolean>(true);
  const [windowHeight, setWindowHeight] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedPhone = useMemo(
    () => PHONE_PROFILES.find((p) => p.id === selectedPhoneId) || PHONE_PROFILES[0]!,
    [selectedPhoneId]
  );

  const totalPhoneHeight = selectedPhone.height;
  const fitScale = useMemo(() => {
    const isMobileViewport = windowWidth < 768;
    // On mobile (<768), controls are floating at bottom (~60px) + padding (~32px)
    // On desktop, side dock is ~260px wide + padding (~48px)
    const availableW = isMobileViewport
      ? Math.max(220, windowWidth - 24)
      : Math.max(320, windowWidth - 280);
    const availableH = isMobileViewport
      ? Math.max(260, windowHeight - 140)
      : Math.max(360, windowHeight - 120);

    const widthScale = availableW / selectedPhone.width;
    const heightScale = availableH / totalPhoneHeight;
    const calculated = Math.min(widthScale, heightScale);
    return Math.min(1.0, Math.max(0.28, Number(calculated.toFixed(3))));
  }, [windowWidth, windowHeight, totalPhoneHeight, selectedPhone.width]);

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

  // Media query for guest uploads & downloads stats
  const activeWeddingIdentifier = dbWedding?.id || activeWeddingId || tenant?.weddingId || "";
  const { data: mediaList = [] } = useMedia(activeWeddingIdentifier);
  const mediaCount = mediaList.length;
  const totalMediaBytes = useMemo(
    () => mediaList.reduce((sum, item) => sum + (Number(item.size) || 0), 0),
    [mediaList]
  );
  const totalMediaSize = useMemo(() => formatBytes(totalMediaBytes), [totalMediaBytes]);

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
    partnerFont: "cormorant",
    partnerSize: "72",
    eyebrowFont: "inter",
    eyebrowSize: "12",
    dateFont: "inter",
    dateSize: "13",
    quoteFont: "cormorant",
    quoteSize: "18",
    ampersandSize: "380",
    orbSize: "130",
    textPositions: null,
    mobileTextPositions: null,
    slug: activeSlug || tenant?.weddingSlug || "",
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPostSaveGuideOpen, setIsPostSaveGuideOpen] = useState(false);
  const [isLayoutGuideOpen, setIsLayoutGuideOpen] = useState(false);
  const [postSaveSavedMode, setPostSaveSavedMode] = useState<"desktop" | "mobile">("desktop");
  const [dontShowAgainSession, setDontShowAgainSession] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("fotokita_skip_layout_guide") === "true";
    }
    return false;
  });

  const handleToggleDontShowAgain = (checked: boolean) => {
    setDontShowAgainSession(checked);
    if (typeof window !== "undefined") {
      if (checked) {
        sessionStorage.setItem("fotokita_skip_layout_guide", "true");
      } else {
        sessionStorage.removeItem("fotokita_skip_layout_guide");
      }
    }
  };

  // Fetch initial customization and live tenant profile
  useEffect(() => {
    if (tenant) {
      getTenantProfile()
        .then((updatedTenant) => {
          if (activeSlug && updatedTenant.weddingSlug && updatedTenant.weddingSlug !== activeSlug) {
            clearStoredTenantSession();
            setTenant(null);
            setIsLoginModalOpen(true);
            toast.info(`Please log in with credentials for the ${activeSlug} gallery.`);
            return;
          }
          setTenant(updatedTenant);
          const token = getStoredTenantToken();
          if (token) setStoredTenantSession(token, updatedTenant);
        })
        .catch((err: any) => {
          console.warn("Sub-admin session validation failed or expired:", err);
          clearStoredTenantSession();
          setTenant(null);
          setIsLoginModalOpen(true);
          toast.error("Your sub-admin session has expired. Please log in again.");
        });
    } else {
      setIsLoginModalOpen(true);
    }
  }, [activeSlug]);

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
            partnerFont: data.partnerFont || prev.partnerFont || "cormorant",
            partnerSize: data.partnerSize || prev.partnerSize || "72",
            eyebrowFont: data.eyebrowFont || prev.eyebrowFont || "inter",
            eyebrowSize: data.eyebrowSize || prev.eyebrowSize || "12",
            dateFont: data.dateFont || prev.dateFont || "inter",
            dateSize: data.dateSize || prev.dateSize || "13",
            quoteFont: data.quoteFont || prev.quoteFont || "cormorant",
            quoteSize: data.quoteSize || prev.quoteSize || "18",
            ampersandSize: data.ampersandSize || prev.ampersandSize || "380",
            orbSize: data.orbSize || prev.orbSize || "130",
            textPositions: data.textPositions || prev.textPositions || null,
            mobileTextPositions: data.mobileTextPositions || prev.mobileTextPositions || null,
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
          deviceView: viewMode === "mobile" ? "mobile" : "full",
          guides: {
            showAlignmentGuides,
            showMobileBoundary: viewMode === "desktop" ? showMobileBoundary : false,
          },
        },
        "*"
      );
    } catch {
      // ignore
    }
  }, [customization, showAlignmentGuides, showMobileBoundary, viewMode]);

  useEffect(() => {
    syncCustomizationWithIframe();
  }, [syncCustomizationWithIframe]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === "FOTOKITA_PREVIEW_READY") {
        syncCustomizationWithIframe();
      } else if (event.data?.type === "FOTOKITA_PREVIEW_POSITION_CHANGE" && event.data.textPositions) {
        const key = event.data.targetKey || (viewMode === "mobile" ? "mobileTextPositions" : "textPositions");
        handleCustomizationChange({
          [key]: event.data.textPositions,
        });
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
      const savedMode = viewMode;
      setPostSaveSavedMode(savedMode);

      toast.success("Changes Saved Successfully!", {
        description:
          savedMode === "desktop"
            ? "Desktop layout saved! Remember to double-check Mobile view."
            : "Mobile layout saved! Guests on smartphones will see live updates.",
        action: {
          label: savedMode === "desktop" ? "View Mobile" : "View Desktop",
          onClick: () => setViewMode(savedMode === "desktop" ? "mobile" : "desktop"),
        },
      });

      // Prompt user with guide reminder if not muted for this session
      if (!dontShowAgainSession) {
        setIsPostSaveGuideOpen(true);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.code === "UNAUTHORIZED" || err?.code === "INVALID_TOKEN") {
        clearStoredTenantSession();
        setTenant(null);
        setIsLoginModalOpen(true);
        toast.error("Your sub-admin session has expired. Please sign in again to save changes.");
        return;
      }
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
      window.open(`/${encodeURI(slug)}`, "_blank", "noopener,noreferrer");
    }
  };

  // Preview URL pointing to WeddingGalleryPage inside iframe
  const currentSlug = customization.slug || dbWedding?.slug || tenant?.weddingSlug || activeSlug || "wedding";
  const finalWeddingId = dbWedding?.id || tenant?.weddingId || customization.weddingId || activeWeddingId;
  const previewIframeUrl = `/${encodeURI(currentSlug)}?preview=subadmin&deviceView=${viewMode === "mobile" ? "mobile" : "full"}${finalWeddingId ? `&weddingId=${encodeURIComponent(finalWeddingId)}` : ""}`;

  const guestPublicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${encodeURI(currentSlug)}`;

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
          defaultIdentifier={activeSlug || ""}
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
          showAlignmentGuides={showAlignmentGuides}
          onToggleAlignmentGuides={() => setShowAlignmentGuides((v) => !v)}
          showMobileBoundary={showMobileBoundary}
          onToggleMobileBoundary={() => setShowMobileBoundary((v) => !v)}
          viewMode={viewMode}
          onSwitchViewMode={setViewMode}
          activeView={activeView}
          onSelectView={setActiveView}
          mediaCount={mediaCount}
          totalMediaSize={totalMediaSize}
        />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* Top Bar Header */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-1.5 sm:gap-2 border-b border-border bg-card/60 backdrop-blur-md px-2 sm:px-4 z-20 overflow-x-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <SidebarTrigger className="-ml-1 cursor-pointer shrink-0" />
              <Separator orientation="vertical" className="hidden sm:block mr-2 h-4 shrink-0" />
              {/* Mobile compact title */}
              <span className="text-xs font-medium text-foreground truncate max-w-[85px] xs:max-w-[120px] sm:hidden">
                {activeView === "dashboard" ? "Dashboard" : activeView === "invitation" ? "Jemputan" : "Editor"}
              </span>
              {/* Desktop / Tablet Breadcrumbs */}
              <Breadcrumb className="hidden sm:flex min-w-0">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={onNavigateHome}
                      className="cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <FotokitaLogo variant="mark" size="xs" />
                      <span>Fotokita</span>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink className="text-xs font-medium text-foreground">
                      Sub-Admin Portal
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="text-xs text-muted-foreground truncate">
                      {activeView === "dashboard"
                        ? "Guest Media & Downloads Dashboard"
                        : activeView === "invitation"
                          ? "Digital Invitation Card"
                          : "Live Guest View Editor"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {activeView === "dashboard" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView("editor")}
                    className="text-xs h-8 cursor-pointer gap-1.5 shrink-0 px-2 sm:px-3"
                  >
                    <Sliders className="size-3.5 text-muted-foreground" />
                    <span>Live Editor</span>
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
                </>
              ) : activeView === "invitation" ? null : (
                <>
                  {/* Desktop vs Mobile Toggle */}
                  <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode("desktop")}
                      className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === "desktop"
                          ? "bg-background shadow-xs font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Desktop preview"
                    >
                      <Monitor className="size-3.5" />
                      <span className="hidden sm:inline">Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("mobile")}
                      className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        viewMode === "mobile"
                          ? "bg-background shadow-xs font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Mobile preview"
                    >
                      <Smartphone className="size-3.5" />
                      <span className="hidden sm:inline">Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLayoutGuideOpen(true)}
                      className="hidden sm:block px-1.5 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-background/60"
                      title="Learn why Desktop and Mobile layouts are separate"
                      aria-label="Responsive layout guide"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </div>

                  {/* Refresh Preview Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefreshPreview}
                    title="Refresh preview"
                    className="size-7.5 sm:size-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>

                  {/* Scan on Phone / QR Code */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQrModalOpen(true)}
                    title="Scan QR code to test on real phone"
                    className="hidden md:inline-flex text-xs h-8 cursor-pointer gap-1.5 shrink-0"
                  >
                    <QrCode className="size-3.5 text-muted-foreground" />
                    <span>Test Phone</span>
                  </Button>

                  {/* View as Guest link */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenLiveGuestView}
                    className="hidden lg:inline-flex text-xs h-8 cursor-pointer shrink-0"
                  >
                    <Eye className="size-3.5 mr-1 text-muted-foreground" />
                    <span>Guest View ↗</span>
                  </Button>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    variant={hasUnsavedChanges ? "default" : "outline"}
                    className={`text-xs h-8 shadow-xs cursor-pointer shrink-0 px-2.5 sm:px-3.5 font-medium transition-all ${
                      hasUnsavedChanges
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        : "bg-background hover:bg-muted text-foreground border-border"
                    }`}
                  >
                    {isSaving ? (
                      "Saving..."
                    ) : hasUnsavedChanges ? (
                      <>
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    ) : (
                      "Saved"
                    )}
                  </Button>
                </>
              )}
            </div>
          </header>

          {/* Main Visual Canvas or Media Dashboard */}
          <main className="flex-1 overflow-auto bg-[#F2EDE4] dark:bg-[#0D0B0A] flex flex-col transition-colors relative">
            {activeView === "dashboard" ? (
              <SubAdminMediaDashboard
                weddingId={activeWeddingIdentifier}
                wedding={dbWedding}
                customization={customization}
                onSwitchToEditor={() => setActiveView("editor")}
                onOpenGuestView={handleOpenLiveGuestView}
              />
            ) : activeView === "invitation" ? (
              <InvitationEditor weddingId={activeWeddingIdentifier} slug={currentSlug} />
            ) : (
              <div className="p-2 sm:p-6 flex-1 flex flex-col">
                {viewMode === "desktop" ? (
                  <SubAdminDesktopCanvas
                    iframeRef={iframeRef}
                    previewIframeUrl={previewIframeUrl}
                    onIframeLoad={syncCustomizationWithIframe}
                  />
                ) : (
                  <SubAdminMobileCanvas
                    iframeRef={iframeRef}
                    previewIframeUrl={previewIframeUrl}
                    onIframeLoad={syncCustomizationWithIframe}
                    selectedPhone={selectedPhone}
                    selectedPhoneId={selectedPhoneId}
                    onSelectPhoneId={setSelectedPhoneId}
                    phoneProfiles={PHONE_PROFILES}
                    activeScale={activeScale}
                    totalPhoneHeight={totalPhoneHeight}
                    zoomLevel={zoomLevel}
                    onSelectZoomLevel={setZoomLevel}
                    onRefreshPreview={handleRefreshPreview}
                    onOpenQrModal={() => setIsQrModalOpen(true)}
                  />
                )}
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

        {/* Post-Save Double-Check Review Modal */}
        <SubAdminLayoutGuideModal
          isOpen={isPostSaveGuideOpen}
          onClose={() => setIsPostSaveGuideOpen(false)}
          savedMode={postSaveSavedMode}
          onSwitchViewMode={(mode) => {
            setViewMode(mode);
            setIsPostSaveGuideOpen(false);
          }}
          onOpenQrModal={() => {
            setIsPostSaveGuideOpen(false);
            setIsQrModalOpen(true);
          }}
          dontShowAgainSession={dontShowAgainSession}
          onToggleDontShowAgain={handleToggleDontShowAgain}
          isPostSaveReminder={true}
        />

        {/* Manual Layout Info Guide Modal */}
        <SubAdminLayoutGuideModal
          isOpen={isLayoutGuideOpen}
          onClose={() => setIsLayoutGuideOpen(false)}
          savedMode={viewMode}
          onSwitchViewMode={(mode) => {
            setViewMode(mode);
            setIsLayoutGuideOpen(false);
          }}
          onOpenQrModal={() => {
            setIsLayoutGuideOpen(false);
            setIsQrModalOpen(true);
          }}
          isPostSaveReminder={false}
        />
      </div>
    </SidebarProvider>
  );
};

export default SubAdminPortalPage;
