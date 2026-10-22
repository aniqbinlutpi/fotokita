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
import { InvitationPage } from "./pages/InvitationPage";
import { DemoGalleryPage } from "./pages/DemoGalleryPage";
import { AdminControlPage } from "./pages/AdminControlPage";
import { SubAdminPortalPage } from "./pages/SubAdminPortalPage";
import { SubscriberRegisterPage } from "./pages/SubscriberRegisterPage";
import {
  NotFoundPage,
  ServerErrorPage,
  ForbiddenPage,
  BadRequestPage,
} from "./pages/error";
import { ErrorPage } from "./pages/ErrorPage";
import { extractSlugFromSearch } from "@/lib/slug";

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster />
      <Outlet />
    </>
  ),
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: ({ error, reset }) => (
    <ServerErrorPage error={error} onRetry={reset} />
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
    const slug = extractSlugFromSearch(rawSearch);
    const weddingId = urlParams.get("weddingId");

    // Handle legacy query params (?page=admin, ?page=demo, ?page=subadmin etc.)
    if (page === "admin" || page === "adminfotokita") {
      return (
        <AdminControlPage
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
        />
      );
    }

    if (page === "subadmin" || page === "portal") {
      return (
        <SubAdminPortalPage
          slug={slug || undefined}
          weddingId={weddingId || undefined}
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
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
          slug={slug || undefined}
          weddingId={weddingId || undefined}
          onNavigateHome={() => navigate({ to: "/" } as any)}
          onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
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
    const location = useLocation();
    const rawSearch = location.searchStr || window.location.search;
    const urlParams = new URLSearchParams(rawSearch);
    const slug = extractSlugFromSearch(rawSearch);
    const weddingId = urlParams.get("weddingId") || undefined;

    return (
      <SubAdminPortalPage
        slug={slug}
        weddingId={weddingId}
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
      />
    );
  },
});

const portalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal",
  component: function PortalComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const rawSearch = location.searchStr || window.location.search;
    const urlParams = new URLSearchParams(rawSearch);
    const slug = extractSlugFromSearch(rawSearch);
    const weddingId = urlParams.get("weddingId") || undefined;

    return (
      <SubAdminPortalPage
        slug={slug}
        weddingId={weddingId}
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
      />
    );
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: function LoginComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const rawSearch = location.searchStr || window.location.search;
    const urlParams = new URLSearchParams(rawSearch);
    const slug = extractSlugFromSearch(rawSearch);
    const weddingId = urlParams.get("weddingId") || undefined;

    return (
      <SubAdminPortalPage
        slug={slug}
        weddingId={weddingId}
        onNavigateHome={() => navigate({ to: "/" } as any)}
        onLoginSuccess={() => navigate({ to: "/subadmin" } as any)}
        onOpenGallery={(s) => openInNewTab(`/${encodeURI(s)}`)}
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
        onSuccess={() => navigate({ to: "/login" } as any)}
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
        onOpenGallery={(slug) => openInNewTab(`/${encodeURI(slug)}`)}
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
        onOpenGallery={(slug) => openInNewTab(`/${encodeURI(slug)}`)}
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
    const slug = extractSlugFromSearch(rawSearch);
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

// 7b. Dynamic Wedding Root Slug Route (/$slug, e.g. /hamidah&lutpi or /hamidah-lutpi)
const rootSlugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$slug",
  component: function RootSlugComponent() {
    const navigate = useNavigate();
    const { slug } = useParams({ from: rootSlugRoute.id });

    return (
      <WeddingGalleryPage
        slug={slug}
        onOpenRegister={() => navigate({ to: "/register" } as any)}
        onNavigateToLanding={() => navigate({ to: "/" } as any)}
      />
    );
  },
});

// 7c. Digital invitation card (/$slug/kad and /w/$slug/kad)
const invitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$slug/kad",
  component: function InvitationComponent() {
    const { slug } = useParams({ from: invitationRoute.id });
    return <InvitationPage slug={slug} />;
  },
});

const invitationWSlugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/w/$slug/kad",
  component: function InvitationWComponent() {
    const { slug } = useParams({ from: invitationWSlugRoute.id });
    return <InvitationPage slug={slug} />;
  },
});

// 7d. Dedicated Error Return Pages (/400, /404, /500, /403, /error)
const badRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/400",
  component: function BadRequestComponent() {
    return <BadRequestPage />;
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/404",
  component: function NotFoundComponent() {
    return <NotFoundPage />;
  },
});

const serverErrorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/500",
  component: function ServerErrorComponent() {
    return <ServerErrorPage />;
  },
});

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/403",
  component: function ForbiddenComponent() {
    return <ForbiddenPage />;
  },
});

const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/error",
  component: function ErrorDynamicComponent() {
    const location = useLocation();
    const search = new URLSearchParams(location.searchStr || window.location.search);
    const code = Number(search.get("code")) || 500;
    const title = search.get("title") || undefined;
    const message = search.get("message") || undefined;
    const weddingSlug = search.get("slug") || undefined;

    return (
      <ErrorPage
        code={code}
        title={title}
        description={message}
        weddingSlug={weddingSlug}
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
  badRequestRoute,
  notFoundRoute,
  serverErrorRoute,
  forbiddenRoute,
  errorRoute,
  weddingSlugRoute,
  rootSlugRoute,
  invitationRoute,
  invitationWSlugRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultNotFoundComponent: () => <NotFoundPage />,
  defaultErrorComponent: ({ error, reset }) => (
    <ServerErrorPage error={error} onRetry={reset} />
  ),
});

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
