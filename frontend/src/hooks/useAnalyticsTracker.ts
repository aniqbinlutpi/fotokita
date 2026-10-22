import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackAnalyticsSession, type TrackPayload } from "@/api/admin";

function getOrCreateSessionId(): string {
  const STORAGE_KEY = "fotokita_analytics_sid";
  try {
    let sid = sessionStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = "fk-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return "fk-fallback-" + Date.now();
  }
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";
  return "Other";
}

function detectOS(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "macOS";
  if (/Win/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

function extractWeddingSlugFromPath(pathname: string): string | null {
  // Matches /w/slug or /slug (ignoring known system routes)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  if (segments[0] === "w" && segments[1]) {
    return segments[1];
  }

  const reserved = ["demo", "admin", "adminfotokita", "login", "register", "portal", "subadmin", "api"];
  if (!reserved.includes(segments[0])) {
    return segments[0];
  }

  return null;
}

export function useAnalyticsTracker() {
  const location = useLocation();
  const currentPath = location.pathname;
  const lastPathnameRef = useRef<string>("");
  const activeSecondsRef = useRef<number>(0);
  const sessionIdRef = useRef<string>("");

  // Ignore admin pages so platform administration doesn't pollute analytics
  const isAdminPage = currentPath.startsWith("/admin") || currentPath.startsWith("/adminfotokita");

  useEffect(() => {
    if (isAdminPage) return;

    sessionIdRef.current = getOrCreateSessionId();
    const weddingSlug = extractWeddingSlugFromPath(currentPath);

    // Initial or route-change pageview tracking
    if (lastPathnameRef.current !== currentPath) {
      lastPathnameRef.current = currentPath;

      const payload: TrackPayload = {
        sessionId: sessionIdRef.current,
        weddingSlug,
        pagePath: currentPath,
        durationIncrement: 0,
        isNewPageview: true,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        referrer: document.referrer || "",
      };

      trackAnalyticsSession(payload);
    }
  }, [currentPath, isAdminPage]);

  // Heartbeat ticker & visibility flush
  useEffect(() => {
    if (isAdminPage) return;

    sessionIdRef.current = getOrCreateSessionId();
    const weddingSlug = extractWeddingSlugFromPath(window.location.pathname);

    // Heartbeat ticker: records time active every 15 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        activeSecondsRef.current += 15;
        trackAnalyticsSession({
          sessionId: sessionIdRef.current,
          weddingSlug,
          pagePath: window.location.pathname,
          durationIncrement: 15,
          isNewPageview: false,
          device: detectDevice(),
        });
      }
    }, 15000);

    // Final flush on unload / tab close
    const flushSessionTime = () => {
      if (activeSecondsRef.current > 0 && !window.location.pathname.startsWith("/admin")) {
        const leavePayload = JSON.stringify({
          sessionId: sessionIdRef.current,
          weddingSlug: extractWeddingSlugFromPath(window.location.pathname),
          pagePath: window.location.pathname,
          durationIncrement: 0,
          isNewPageview: false,
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([leavePayload], { type: "application/json" });
          navigator.sendBeacon("/api/admin/analytics/track", blob);
        }
      }
    };

    window.addEventListener("beforeunload", flushSessionTime);
    window.addEventListener("pagehide", flushSessionTime);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", flushSessionTime);
      window.removeEventListener("pagehide", flushSessionTime);
    };
  }, [isAdminPage]);
}
