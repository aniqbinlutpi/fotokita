import { useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { WeddingGalleryPage } from "./pages/WeddingGalleryPage";
import { DemoGalleryPage } from "./pages/DemoGalleryPage";
import { SubscriberRegisterPage } from "./pages/SubscriberRegisterPage";
import { AdminControlPage } from "./pages/AdminControlPage";
import { Toaster } from "@/components/ui/sonner";
import type { Wedding } from "./types/wedding";

export function App() {
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("standard");

  const [currentPage, setCurrentPage] = useState<"landing" | "demo" | "gallery" | "register" | "admin">(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    const slug = urlParams.get("slug");
    const weddingId = urlParams.get("weddingId");

    if (
      pathname === "/adminfotokita" ||
      pathname.startsWith("/adminfotokita/") ||
      page === "adminfotokita" ||
      page === "admin"
    ) {
      return "admin";
    }

    if (page === "demo") return "demo";
    if (page === "register") return "register";
    if (page === "gallery" || slug || weddingId) return "gallery";
    return "landing";
  });

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get("page");
      const slug = urlParams.get("slug");
      const weddingId = urlParams.get("weddingId");

      if (
        pathname === "/adminfotokita" ||
        pathname.startsWith("/adminfotokita/") ||
        page === "adminfotokita" ||
        page === "admin"
      ) {
        setCurrentPage("admin");
      } else if (page === "demo") {
        setCurrentPage("demo");
      } else if (page === "register") {
        setCurrentPage("register");
      } else if (page === "gallery" || slug || weddingId) {
        setCurrentPage("gallery");
      } else {
        setCurrentPage("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleRegisterSuccess = (newWedding: Wedding) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("page");
    newUrl.searchParams.set("slug", newWedding.slug);
    window.history.pushState({}, "", newUrl.toString());
    setCurrentPage("gallery");
  };

  const navigateToRegister = (plan?: "standard" | "premium") => {
    if (plan) {
      setSelectedPlan(plan);
    }
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("page", "register");
    window.history.pushState({}, "", newUrl.toString());
    setCurrentPage("register");
  };

  const navigateToDemo = () => {
    const demoUrl = new URL(window.location.origin + window.location.pathname);
    demoUrl.searchParams.set("page", "demo");
    window.open(demoUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const navigateToGallery = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("page");
    newUrl.searchParams.set("page", "gallery");
    window.history.pushState({}, "", newUrl.toString());
    setCurrentPage("gallery");
  };

  const navigateToLanding = () => {
    window.history.pushState({}, "", "/");
    setCurrentPage("landing");
  };

  if (currentPage === "admin") {
    return (
      <>
        <Toaster />
        <AdminControlPage
          onNavigateHome={navigateToLanding}
          onOpenGallery={(slug) => {
            const galleryUrl = new URL(window.location.origin);
            galleryUrl.searchParams.set("slug", slug);
            window.open(galleryUrl.toString(), "_blank", "noopener,noreferrer");
          }}
        />
      </>
    );
  }

  if (currentPage === "register") {
    return (
      <>
        <Toaster />
        <SubscriberRegisterPage
          initialPlan={selectedPlan}
          onSuccess={handleRegisterSuccess}
          onCancel={navigateToLanding}
        />
      </>
    );
  }

  if (currentPage === "demo") {
    return (
      <>
        <Toaster />
        <DemoGalleryPage
          onOpenRegister={() => navigateToRegister("standard")}
          onNavigateToLanding={navigateToLanding}
        />
      </>
    );
  }

  if (currentPage === "gallery") {
    return (
      <>
        <Toaster />
        <WeddingGalleryPage
          onOpenRegister={() => navigateToRegister("standard")}
          onNavigateToLanding={navigateToLanding}
        />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <LandingPage
        onNavigateToGallery={navigateToGallery}
        onNavigateToDemo={navigateToDemo}
        onNavigateToRegister={navigateToRegister}
      />
    </>
  );
}

export default App;
