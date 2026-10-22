import { db, client } from "../db";
import { visitorSessions, analyticsEvents } from "../db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { resolveGeoLocation, extractClientIp, hashIp } from "../lib/geo";

export interface TrackPayload {
  sessionId: string;
  weddingSlug?: string | null;
  pagePath?: string;
  durationIncrement?: number;
  isNewPageview?: boolean;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
}

export interface TrackEventPayload {
  sessionId: string;
  weddingSlug?: string | null;
  eventName: string;
  pagePath?: string;
  metadata?: Record<string, any>;
}

export interface DailyBarMetric {
  date: string;
  fullDate: string;
  visitors: number;
  joinedThisWeek: number;
  pageviews: number;
}

export interface LocationMetric {
  name: string;
  city: string;
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
  latitude: string;
  longitude: string;
}

export interface AnalyticsOverviewResponse {
  timeRange: string;
  weddingSlug?: string | null;
  summary: {
    totalVisitors: number;
    totalPageViews: number;
    totalDurationSeconds: number;
    totalDurationFormatted: string;
    averageDurationSeconds: number;
    averageDurationFormatted: string;
    activeDays: number;
    engagementRate: number; // percentage (0 - 100)
    photosUploaded: number;
    wishesLeft: number;
    signaturesCreated: number;
    qrScanned: number;
    activeVisitorsToday: number;
    todayDurationSeconds: number;
    todayDurationFormatted: string;
    lastEventReceivedAt: string | null;
    headlineCount: number;
    headlineDays: number;
    joinedThisWeek: number;
    joinedLastWeek: number;
  };
  chartData: DailyBarMetric[];
  topLocations: LocationMetric[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function parseTimeRangeToDate(range: string): { startDate: Date; daysCount: number } {
  const now = new Date();
  let daysCount = 30;

  switch (range) {
    case "today":
      daysCount = 1;
      break;
    case "7d":
    case "7days":
      daysCount = 7;
      break;
    case "30d":
    case "30days":
      daysCount = 30;
      break;
    case "90d":
    case "90days":
      daysCount = 90;
      break;
    case "all":
      daysCount = 365;
      break;
    default:
      daysCount = 30;
  }

  const startDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
  return { startDate, daysCount };
}

export async function trackVisitorSession(payload: TrackPayload, headers: Headers) {
  const {
    sessionId,
    weddingSlug = null,
    pagePath = "/",
    durationIncrement = 0,
    isNewPageview = false,
    device = "desktop",
    browser = "Unknown",
    os = "Unknown",
    referrer = "",
  } = payload;

  const rawIp = extractClientIp(headers);
  const ipHash = hashIp(rawIp);
  const geo = resolveGeoLocation(headers, sessionId);

  // Check if session already exists
  const existing = await db
    .select()
    .from(visitorSessions)
    .where(eq(visitorSessions.sessionId, sessionId))
    .limit(1);

  const session = existing[0];
  if (session) {
    const newDuration = Math.max(0, session.durationSeconds + durationIncrement);
    const newPageviews = session.pageViewsCount + (isNewPageview ? 1 : 0);

    await db
      .update(visitorSessions)
      .set({
        durationSeconds: newDuration,
        pageViewsCount: newPageviews,
        pagePath,
        weddingSlug: weddingSlug || session.weddingSlug,
        lastSeenAt: new Date(),
      })
      .where(eq(visitorSessions.id, session.id));

    return { status: "updated", sessionId };
  } else {
    await db.insert(visitorSessions).values({
      sessionId,
      weddingSlug,
      pagePath,
      referrer,
      device,
      browser,
      os,
      ipHash,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      durationSeconds: Math.max(0, durationIncrement),
      pageViewsCount: 1,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });

    return { status: "created", sessionId };
  }
}

export async function trackAnalyticsEvent(payload: TrackEventPayload) {
  const { sessionId, weddingSlug = null, eventName, pagePath = "/", metadata = {} } = payload;

  await db.insert(analyticsEvents).values({
    sessionId,
    weddingSlug,
    eventName,
    pagePath,
    metadata,
    createdAt: new Date(),
  });

  return { success: true };
}

export async function getAnalyticsOverview(
  timeRange: string = "30d",
  weddingSlug?: string | null
): Promise<AnalyticsOverviewResponse> {
  const { startDate, daysCount } = parseTimeRangeToDate(timeRange);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Slug filter condition
  const slugFilter = weddingSlug && weddingSlug !== "all" ? weddingSlug : null;

  // 1. Fetch sessions in the selected date range
  const sessions = await db
    .select()
    .from(visitorSessions)
    .where(
      and(
        gte(visitorSessions.firstSeenAt, startDate),
        slugFilter ? eq(visitorSessions.weddingSlug, slugFilter) : sql`TRUE`
      )
    )
    .orderBy(desc(visitorSessions.lastSeenAt));

  // 2. Fetch events in date range
  const events = await db
    .select()
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        slugFilter ? eq(analyticsEvents.weddingSlug, slugFilter) : sql`TRUE`
      )
    );

  // 3. Compute visitor statistics
  const totalVisitors = sessions.length;
  let totalPageViews = 0;
  let totalDurationSeconds = 0;
  let todayVisitors = 0;
  let todayDurationSeconds = 0;
  let joinedThisWeek = 0;
  let joinedLastWeek = 0;

  const activeDatesSet = new Set<string>();
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  const regionMap = new Map<string, { count: number; city: string; country: string; countryCode: string; lat: string; lng: string }>();

  for (const s of sessions) {
    totalPageViews += s.pageViewsCount;
    totalDurationSeconds += s.durationSeconds;

    const firstSeenDate = new Date(s.firstSeenAt);
    const dateKey = firstSeenDate.toISOString().slice(0, 10);
    activeDatesSet.add(dateKey);

    if (firstSeenDate >= todayStart) {
      todayVisitors++;
      todayDurationSeconds += s.durationSeconds;
    }

    if (firstSeenDate >= oneWeekAgo) {
      joinedThisWeek++;
    } else if (firstSeenDate >= twoWeeksAgo) {
      joinedLastWeek++;
    }

    // Devices
    const dev = (s.device || "desktop").toLowerCase();
    if (dev.includes("mobile") || dev.includes("phone")) {
      deviceCounts.mobile++;
    } else if (dev.includes("tablet") || dev.includes("ipad")) {
      deviceCounts.tablet++;
    } else {
      deviceCounts.desktop++;
    }

    // Regions / Location
    const region = s.region || "Kuala Lumpur";
    const existing = regionMap.get(region) || {
      count: 0,
      city: s.city || region,
      country: s.country || "Malaysia",
      countryCode: s.countryCode || "MY",
      lat: s.latitude || "3.1390",
      lng: s.longitude || "101.6869",
    };
    existing.count++;
    regionMap.set(region, existing);
  }

  // Event counts
  let photosUploaded = 0;
  let wishesLeft = 0;
  let signaturesCreated = 0;
  let qrScanned = 0;

  for (const e of events) {
    if (e.eventName === "photo_upload") photosUploaded++;
    else if (e.eventName === "wish_submitted") wishesLeft++;
    else if (e.eventName === "signature_created") signaturesCreated++;
    else if (e.eventName === "qr_scanned") qrScanned++;
  }

  const activeDays = activeDatesSet.size || 1;
  const averageDurationSeconds = totalVisitors > 0 ? Math.round(totalDurationSeconds / totalVisitors) : 0;
  const engagementRate = totalVisitors > 0 ? Math.min(100, Math.round(((photosUploaded + wishesLeft + signaturesCreated) / totalVisitors) * 100)) : 0;

  // 4. Generate Daily Chart Bars (matching the reference photo)
  // Determine number of bars (e.g. 11 to 30 days)
  const barCount = Math.min(daysCount, 30);
  const chartData: DailyBarMetric[] = [];

  for (let i = barCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const fullDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

    // Count sessions on this day
    const daySessions = sessions.filter((s) => new Date(s.firstSeenAt).toISOString().slice(0, 10) === dateStr);
    const visitors = daySessions.length;
    const isThisWeek = d >= oneWeekAgo;
    const pageviews = daySessions.reduce((acc, s) => acc + s.pageViewsCount, 0);

    chartData.push({
      date: dayLabel,
      fullDate,
      visitors,
      joinedThisWeek: isThisWeek ? visitors : 0,
      pageviews,
    });
  }

  // 5. Sorted Locations Breakdown
  const topLocations: LocationMetric[] = Array.from(regionMap.entries())
    .map(([name, data]) => ({
      name,
      city: data.city,
      country: data.country,
      countryCode: data.countryCode,
      count: data.count,
      percentage: totalVisitors > 0 ? Math.round((data.count / totalVisitors) * 100) : 0,
      latitude: data.lat,
      longitude: data.lng,
    }))
    .sort((a, b) => b.count - a.count);

  const firstSession = sessions[0];
  const lastEvent = firstSession ? firstSession.lastSeenAt.toISOString() : null;

  return {
    timeRange,
    weddingSlug,
    summary: {
      totalVisitors,
      totalPageViews,
      totalDurationSeconds,
      totalDurationFormatted: formatDuration(totalDurationSeconds),
      averageDurationSeconds,
      averageDurationFormatted: formatDuration(averageDurationSeconds),
      activeDays,
      engagementRate,
      photosUploaded,
      wishesLeft,
      signaturesCreated,
      qrScanned,
      activeVisitorsToday: todayVisitors,
      todayDurationSeconds,
      todayDurationFormatted: formatDuration(todayDurationSeconds),
      lastEventReceivedAt: lastEvent,
      headlineCount: totalVisitors,
      headlineDays: barCount,
      joinedThisWeek,
      joinedLastWeek,
    },
    chartData,
    topLocations,
    deviceBreakdown: deviceCounts,
  };
}
