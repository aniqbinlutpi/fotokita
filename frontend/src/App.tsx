import { useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { WeddingGalleryPage } from "./pages/WeddingGalleryPage";
import { SubscriberRegisterPage } from "./pages/SubscriberRegisterPage";
import type { Wedding } from "./types/wedding";

export function App() {
  const [selectedPlan, setSelectedPlan] = useState<"standard" | "premium">("standard");

  const [currentPage, setCurrentPage] = useState<"landing" | "gallery" | "register">(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page");
    const slug = urlParams.get("slug");
    const weddingId = urlParams.get("weddingId");

    if (page === "register") return "register";
    if (page === "gallery" || slug || weddingId) return "gallery";
    return "landing";
  });

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get("page");
      const slug = urlParams.get("slug");
      const weddingId = urlParams.get("weddingId");

      if (page === "register") {
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

  const navigateToGallery = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("page");
    newUrl.searchParams.set("page", "gallery");
    window.history.pushState({}, "", newUrl.toString());
    setCurrentPage("gallery");
  };

  const navigateToLanding = () => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("page");
    newUrl.searchParams.delete("slug");
    newUrl.searchParams.delete("weddingId");
    window.history.pushState({}, "", newUrl.toString());
    setCurrentPage("landing");
  };

  if (currentPage === "register") {
    return (
      <SubscriberRegisterPage
        initialPlan={selectedPlan}
        onSuccess={handleRegisterSuccess}
        onCancel={navigateToLanding}
      />
    );
  }

  if (currentPage === "gallery") {
    return (
      <WeddingGalleryPage
        onOpenRegister={() => navigateToRegister("standard")}
        onNavigateToLanding={navigateToLanding}
      />
    );
  }

  return (
    <LandingPage
      onNavigateToGallery={navigateToGallery}
      onNavigateToRegister={navigateToRegister}
    />
  );
}

export default App;
