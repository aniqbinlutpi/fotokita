import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { LandingPage } from "./pages/LandingPage";
import { WeddingGalleryPage } from "./pages/WeddingGalleryPage";
import { DemoGalleryPage } from "./pages/DemoGalleryPage";
import { SubscriberRegisterPage } from "./pages/SubscriberRegisterPage";
import { AdminControlPage } from "./pages/AdminControlPage";
import type { Wedding } from "./types/wedding";

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster />
      <Outlet />
    </>
  ),
});

// Helper for opening in new tab
const openInNewTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

// 2. Index Route (Landing or fallback query routing)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function IndexComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.searchStr || window.location.search);
    const page = urlParams.get("page");
    const slug = urlParams.get("slug");
    const weddingId = urlParams.get("weddingId");
    const plan = (urlParams.get("plan") as "standard" | "premium") || undefined;

    // Handle legacy query params (?page=admin, ?page=demo, etc.)
    if (page === "admin" || page === "adminfotokita") {
      return (
        <AdminControlPage
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/w/${s}`)}
        />
      );
    }

    if (page === "demo") {
      return (
        <DemoGalleryPage
          onOpenRegister={() => navigate({ to: "/register" } as any)}
          onNavigateToLanding={() => navigate({ to: "/" } as any)}
        />
      );
    }

    if (page === "register") {
      return (
        <SubscriberRegisterPage
          initialPlan={plan || "standard"}
          onSuccess={(wedding) => navigate({ to: "/w/$slug", params: { slug: wedding.slug } } as any)}
          onCancel={() => navigate({ to: "/" } as any)}
        />
      );
    }

    if (page === "gallery" || slug || weddingId) {
      return (
        <WeddingGalleryPage
          slug={slug || undefined}
          weddingId={weddingId || undefined}
          onOpenRegister={() => navigate({ to: "/register" } as any)}
          onNavigateToLanding={() => navigate({ to: "/" } as any)}
        />
      );
    }

    return (
      <LandingPage
        onNavigateToGallery={() => navigate({ to: "/gallery" } as any)}
        onNavigateToDemo={() => openInNewTab("/demo")}
        onNavigateToRegister={() => {
          navigate({ to: "/register" } as any);
        }}
      />
    );
  },
});

// 3. Demo Route
const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: function DemoComponent() {
    const navigate = useNavigate();
    return (
      <DemoGalleryPage
        onOpenRegister={() => navigate({ to: "/register" } as any)}
        onNavigateToLanding={() => navigate({ to: "/" } as any)}
      />
    );
  },
});

// 4. Register Route
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: function RegisterComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.searchStr || window.location.search);
    const plan = (urlParams.get("plan") as "standard" | "premium") || "standard";

    return (
      <SubscriberRegisterPage
        initialPlan={plan}
        onSuccess={(newWedding: Wedding) =>
          navigate({ to: "/w/$slug", params: { slug: newWedding.slug } } as any)
        }
        onCancel={() => navigate({ to: "/" } as any)}
      />
    );
  },
});

// 5. Admin Routes (/admin & /adminfotokita)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: function AdminComponent() {
    const navigate = useNavigate();
    return (
      <AdminControlPage
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(slug) => openInNewTab(`/w/${slug}`)}
      />
    );
  },
});

const adminFotokitaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/adminfotokita",
  component: function AdminFotokitaComponent() {
    const navigate = useNavigate();
    return (
      <AdminControlPage
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(slug) => openInNewTab(`/w/${slug}`)}
      />
    );
  },
});

// 6. Gallery Route (/gallery)
const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: function GalleryComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.searchStr || window.location.search);
    const slug = urlParams.get("slug") || undefined;
    const weddingId = urlParams.get("weddingId") || undefined;

    return (
      <WeddingGalleryPage
        slug={slug}
        weddingId={weddingId}
        onOpenRegister={() => navigate({ to: "/register" } as any)}
        onNavigateToLanding={() => navigate({ to: "/" } as any)}
      />
    );
  },
});

// 7. Dynamic Wedding Slug Route (/w/$slug)
const weddingSlugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug",
  component: function WeddingSlugComponent() {
    const navigate = useNavigate();
    const { slug } = useParams({ from: weddingSlugRoute.id });

    return (
      <WeddingGalleryPage
        slug={slug}
        onOpenRegister={() => navigate({ to: "/register" } as any)}
        onNavigateToLanding={() => navigate({ to: "/" } as any)}
      />
    );
  },
});

// 8. Create Route Tree & Router Instance
const routeTree = rootRoute.addChildren([
  indexRoute,
  demoRoute,
  registerRoute,
  adminRoute,
  adminFotokitaRoute,
  galleryRoute,
  weddingSlugRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
