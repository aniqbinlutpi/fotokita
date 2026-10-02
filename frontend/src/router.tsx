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
import { AdminControlPage } from "./pages/AdminControlPage";
import { SubAdminPortalPage } from "./pages/SubAdminPortalPage";
import { SubscriberRegisterPage } from "./pages/SubscriberRegisterPage";

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
    const rawSearch = location.searchStr || window.location.search;
    const urlParams = new URLSearchParams(rawSearch);
    const page = urlParams.get("page");
    let slug = urlParams.get("slug");
    const weddingId = urlParams.get("weddingId");

    // Support unencoded slugs with '&' in query string e.g. ?slug=abc&def
    if (slug && !page && !weddingId && !urlParams.has("token")) {
      const raw = rawSearch.replace(/^\?/, "");
      if (raw.startsWith("slug=")) {
        slug = decodeURIComponent(raw.replace(/^slug=/, ""));
      }
    }

    // Handle legacy query params (?page=admin, ?page=demo, ?page=subadmin etc.)
    if (page === "admin" || page === "adminfotokita") {
      return (
        <AdminControlPage
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/?slug=${encodeURIComponent(s)}`)}
        />
      );
    }

    if (page === "subadmin" || page === "portal") {
      return (
        <SubAdminPortalPage
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/?slug=${encodeURIComponent(s)}`)}
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
      const token = urlParams.get("token") || undefined;
      return (
        <SubscriberRegisterPage
          inviteToken={token}
          onSuccess={() => navigate({ to: "/subadmin" } as any)}
          onCancel={() => navigate({ to: "/" } as any)}
        />
      );
    }

    if (page === "login") {
      return (
        <SubAdminPortalPage
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/?slug=${encodeURIComponent(s)}`)}
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
        onNavigateToSubAdmin={() => {
          navigate({ to: "/subadmin" } as any);
        }}
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

// 4. Sub-Admin Portal Route (/subadmin & /portal)
const subAdminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subadmin",
  component: function SubAdminComponent() {
    const navigate = useNavigate();
    return (
      <SubAdminPortalPage
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(slug) => openInNewTab(`/?slug=${encodeURIComponent(slug)}`)}
      />
    );
  },
});

const portalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal",
  component: function PortalComponent() {
    const navigate = useNavigate();
    return (
      <SubAdminPortalPage
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(slug) => openInNewTab(`/?slug=${encodeURIComponent(slug)}`)}
      />
    );
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: function LoginComponent() {
    const navigate = useNavigate();
    return (
      <SubAdminPortalPage
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(slug) => openInNewTab(`/?slug=${encodeURIComponent(slug)}`)}
      />
    );
  },
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: function RegisterComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.searchStr || window.location.search);
    const token = urlParams.get("token") || undefined;

    return (
      <SubscriberRegisterPage
        inviteToken={token}
        onSuccess={() => navigate({ to: "/subadmin" } as any)}
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
        onOpenGallery={(slug) => openInNewTab(`/?slug=${encodeURIComponent(slug)}`)}
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
        onOpenGallery={(slug) => openInNewTab(`/?slug=${encodeURIComponent(slug)}`)}
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
    const rawSearch = window.location.search;
    const urlParams = new URLSearchParams(rawSearch);
    let slug = urlParams.get("slug") || undefined;
    const weddingId = urlParams.get("weddingId") || undefined;

    // Support unencoded slugs with '&' in query string e.g. ?slug=abc&def
    if (slug && !weddingId && !urlParams.has("token")) {
      const raw = rawSearch.replace(/^\?/, "");
      if (raw.startsWith("slug=")) {
        slug = decodeURIComponent(raw.replace(/^slug=/, ""));
      }
    }

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
  subAdminRoute,
  portalRoute,
  loginRoute,
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
