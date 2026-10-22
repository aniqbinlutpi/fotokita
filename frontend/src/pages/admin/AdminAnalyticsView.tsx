import { useState, useEffect } from "react";
import {
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  RefreshCw,
  Sparkles,
  Globe2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { toast } from "sonner";
import {
  getAnalyticsOverview,
  seedDemoAnalytics,
  type AnalyticsOverviewResponse,
} from "@/api/admin";
import { MALAYSIA_STATES } from "@/data/malaysiaMapData";
import type { Wedding } from "@/types/wedding";

interface AdminAnalyticsViewProps {
  weddings: Wedding[];
}

export function AdminAnalyticsView({ weddings }: AdminAnalyticsViewProps) {
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "90d" | "all">("30d");
  const [selectedWedding, setSelectedWedding] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "locations" | "devices">("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [seeding, setSeeding] = useState<boolean>(false);

  const fetchAnalytics = async (range = timeRange, slug = selectedWedding) => {
    setLoading(true);
    try {
      const res = await getAnalyticsOverview(range, slug);
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      toast.error("Could not load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange, selectedWedding);
  }, [timeRange, selectedWedding]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemoAnalytics();
      toast.success("Demo analytics sessions generated!");
      await fetchAnalytics(timeRange, selectedWedding);
    } catch (err) {
      console.error("Failed to seed demo data:", err);
      toast.error("Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  };

  const summary = data?.summary;
  const chartData = data?.chartData || [];
  const topLocations = data?.topLocations || [];
  const deviceBreakdown = data?.deviceBreakdown || { mobile: 0, desktop: 0, tablet: 0 };

  const totalDeviceVisits = (deviceBreakdown.mobile + deviceBreakdown.desktop + deviceBreakdown.tablet) || 1;
  const mobilePct = Math.round((deviceBreakdown.mobile / totalDeviceVisits) * 100);
  const desktopPct = Math.round((deviceBreakdown.desktop / totalDeviceVisits) * 100);
  const tabletPct = Math.round((deviceBreakdown.tablet / totalDeviceVisits) * 100);

  // Locations breakdown: Malaysia states vs International
  const malaysiaLocations = topLocations.filter(
    (loc) => loc.countryCode === "MY" || loc.country.toLowerCase() === "malaysia"
  );
  const internationalLocations = topLocations.filter(
    (loc) => loc.countryCode !== "MY" && loc.country.toLowerCase() !== "malaysia"
  );

  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const matchState = (stateName: string, locName: string): boolean => {
    const norm1 = stateName.toLowerCase().replace(/pulau\s+/g, "").trim();
    const norm2 = locName.toLowerCase().replace(/pulau\s+/g, "").trim();
    return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
  };

  // Reference styling colors
  const ACCENT_COLOR = "#C25E3E"; // Terracotta
  const STONE_MUTED = "#D6D3D1";

  return (
    <div className="space-y-6">
      {/* Top Header / Sub-navigation Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Fotokita Analytics
            </h2>
            <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10 text-xs">
              Live Tracker
            </Badge>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Real-time visitor traffic, engagement duration, and regional heatmap.
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/60 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeSubTab === "overview"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("locations")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === "locations"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            <MapPin className="size-3.5 text-terracotta" />
            Where from
          </button>
          <button
            onClick={() => setActiveSubTab("devices")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeSubTab === "devices"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            Devices
          </button>
        </div>
      </div>

      {/* Control Bar: Time Filters & Wedding Scope */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time range pills matching screenshot */}
        <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800/80 p-1 rounded-xl text-xs font-medium">
          {(["today", "7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeRange === r
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-semibold shadow-xs"
                  : "text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-100/50"
              }`}
            >
              {r === "today"
                ? "Today"
                : r === "7d"
                ? "7 days"
                : r === "30d"
                ? "30 days"
                : r === "90d"
                ? "90 days"
                : "All time"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Wedding Filter Dropdown */}
          <select
            value={selectedWedding}
            onChange={(e) => setSelectedWedding(e.target.value)}
            className="text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-1.5 text-stone-700 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          >
            <option value="all">All visitors (Landing &amp; All Weddings)</option>
            {weddings.map((w) => (
              <option key={w.id} value={w.slug}>
                {w.name} ({w.slug})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="h-8 text-xs"
          >
            <RefreshCw className={`size-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {summary?.totalVisitors === 0 && (
            <Button
              size="sm"
              onClick={handleSeedDemo}
              disabled={seeding}
              className="h-8 text-xs bg-terracotta hover:bg-terracotta/90 text-white"
            >
              <Sparkles className="size-3.5 mr-1" />
              {seeding ? "Seeding..." : "Seed Demo Visitors"}
            </Button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-TAB 1: OVERVIEW (MATCHING USER SCREENSHOT)                       */}
      {/* =================================================================== */}
      {activeSubTab === "overview" && (
        <div className="space-y-8 bg-stone-50/70 dark:bg-stone-950/40 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          {/* Hero Section: Big Bold Typography + Slim Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Left: Giant Typography Hero */}
            <div className="lg:col-span-5 space-y-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.1]">
                {(summary?.headlineCount || 0).toLocaleString()}{" "}
                <span className="block sm:inline">visitors</span>
                <span className="block">
                  in{" "}
                  <span className="text-[#C25E3E]">
                    {summary?.headlineDays || 11} days.
                  </span>
                </span>
              </h1>
              <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 pt-1">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {(summary?.joinedThisWeek || 0).toLocaleString()}
                </span>{" "}
                visited this week. Last week:{" "}
                <span className="text-stone-600 dark:text-stone-400">
                  {(summary?.joinedLastWeek || 0).toLocaleString()}.
                </span>
              </p>

              {/* Legend matching screenshot */}
              <div className="flex items-center gap-4 text-xs text-stone-500 pt-3">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-stone-300 dark:bg-stone-700 inline-block" />
                  Past visitors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#C25E3E] inline-block" />
                  Visited this week
                </span>
              </div>
            </div>

            {/* Right: Slim Bar Chart */}
            <div className="lg:col-span-7 h-44 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#888888" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#888888" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-semibold">{item.fullDate}</p>
                              <p className="text-terracotta">
                                Visitors: <span className="text-white font-bold">{item.visitors}</span>
                              </p>
                              <p className="text-stone-400">
                                Page Views: <span className="text-stone-200">{item.pageviews}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="visitors" radius={[3, 3, 0, 0]} maxBarSize={14}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.joinedThisWeek > 0 ? ACCENT_COLOR : STONE_MUTED}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-stone-400 border border-dashed rounded-xl">
                  No visitors recorded in this range.
                </div>
              )}
            </div>
          </div>

          {/* Live Status Ticker (matching screenshot) */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-4 flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-stone-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Last event received{" "}
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {summary?.lastEventReceivedAt
                    ? new Date(summary.lastEventReceivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "just now"}
                </span>
                .
              </span>
            </div>

            <div className="text-stone-700 dark:text-stone-300">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {(summary?.activeVisitorsToday || 0).toLocaleString()} visitors
              </span>{" "}
              active today,{" "}
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {summary?.todayDurationFormatted || "0m"}
              </span>{" "}
              of interaction.{" "}
              <button
                onClick={() => setActiveSubTab("locations")}
                className="underline underline-offset-2 text-[#C25E3E] hover:text-[#C25E3E]/80 font-medium ml-1"
              >
                See them on Where from &rarr;
              </button>
            </div>
          </div>

          {/* Metric Cards Grid - 2 Rows (matching screenshot) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-2">
            {/* Metric 1: Total Time Spent */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {summary?.totalDurationFormatted || "0m"}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Time Spent
              </div>
            </div>

            {/* Metric 2: Active Days */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {summary?.activeDays || 1}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Active Days
              </div>
            </div>

            {/* Metric 3: Page Views */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.totalPageViews || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Page Views
              </div>
            </div>

            {/* Metric 4: Sessions */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.totalVisitors || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Sessions
              </div>
            </div>

            {/* Metric 5: Photos Uploaded */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.photosUploaded || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Photos Uploaded
              </div>
            </div>

            {/* Metric 6: Engagement Rate */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-[#C25E3E]">
                {summary?.engagementRate || 0}%
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Engagement Rate
              </div>
            </div>

            {/* Row 2: Secondary Insights */}
            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {summary?.averageDurationFormatted || "0s"}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Avg Duration
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {topLocations[0]?.name || "Kuala Lumpur"}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Top Region ({topLocations[0]?.percentage || 0}%)
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.wishesLeft || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Wishes Left
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {mobilePct}%
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Mobile Guests
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.signaturesCreated || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                Signatures
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {(summary?.qrScanned || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
                QR Code Scans
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: WHERE FROM (REAL MALAYSIA MAP & LOCATIONS)               */}
      {/* =================================================================== */}
      {activeSubTab === "locations" && (
        <div className="space-y-6">
          {/* Informational Callout: Localhost vs Production */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Localhost vs. Production Data:</span>{" "}
              In localhost (<code>127.0.0.1</code>), testing sessions use simulated local routing (e.g. Selangor / Perak). When deployed live on your domain with Cloudflare, Cloudflare automatically inspects real visitor cellular/broadband towers (Maxis, Unifi, Celcom, Digi) and attaches their authentic Malaysian state and city in real-time.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Real Malaysia Vector Map */}
            <div className="lg:col-span-7 bg-stone-50/70 dark:bg-stone-950/40 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <MapPin className="size-4 text-[#C25E3E]" />
                    Malaysia Visitor Density Map
                  </h3>
                  <p className="text-xs text-stone-500">
                    Official state boundaries (Peninsular, Sabah &amp; Sarawak).
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-white dark:bg-stone-900 font-medium">
                  {malaysiaLocations.length} active state{malaysiaLocations.length === 1 ? "" : "s"}
                </Badge>
              </div>

              {/* Real SVG Vector Map of Malaysia (viewBox: 0 0 1000 332) */}
              <div className="relative w-full h-[320px] sm:h-[360px] bg-stone-100/70 dark:bg-stone-900/60 rounded-xl overflow-hidden border border-stone-200/70 dark:border-stone-800/70 flex items-center justify-center p-2 sm:p-4">
                {/* Grid Background */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(#C25E3E 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <svg
                  viewBox="0 0 1000 332"
                  className="w-full h-full max-h-[340px] drop-shadow-xs select-none"
                >
                  <g id="malaysia-states">
                    {MALAYSIA_STATES.map((state) => {
                      const metric = malaysiaLocations.find((l) => matchState(state.name, l.name));
                      const hasVisitors = Boolean(metric && metric.count > 0);
                      const isHovered = hoveredState === state.name;

                      return (
                        <path
                          key={state.id}
                          id={state.id}
                          d={state.d}
                          className="transition-colors duration-200 cursor-pointer"
                          stroke={isHovered ? "#C25E3E" : hasVisitors ? "#C25E3E" : "#D6D3D1"}
                          strokeWidth={isHovered ? 1.5 : hasVisitors ? 1.2 : 0.6}
                          fill={
                            isHovered
                              ? "#C25E3E"
                              : hasVisitors
                              ? "rgba(194, 94, 62, 0.28)"
                              : "#E7E5E4"
                          }
                          onMouseEnter={() => setHoveredState(state.name)}
                          onMouseLeave={() => setHoveredState(null)}
                        >
                          <title>
                            {state.name}
                            {metric ? `: ${metric.count} visitor(s) (${metric.percentage}%)` : ": 0 visitors"}
                          </title>
                        </path>
                      );
                    })}
                  </g>

                  {/* Density Markers at State Centroids */}
                  <g id="state-markers">
                    {MALAYSIA_STATES.map((state) => {
                      const metric = malaysiaLocations.find((l) => matchState(state.name, l.name));
                      if (!metric || metric.count <= 0) return null;

                      const radius = Math.max(9, Math.min(18, metric.percentage * 0.4 + 9));

                      return (
                        <g
                          key={`marker-${state.id}`}
                          transform={`translate(${state.cx}, ${state.cy})`}
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredState(state.name)}
                          onMouseLeave={() => setHoveredState(null)}
                        >
                          {/* Pulsing ring */}
                          <circle
                            r={radius + 8}
                            fill="#C25E3E"
                            opacity="0.3"
                            className="animate-ping"
                          />
                          {/* Inner Badge */}
                          <circle
                            r={radius}
                            fill="#C25E3E"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="drop-shadow-md"
                          />
                          {/* Visitor count text */}
                          <text
                            textAnchor="middle"
                            dy="3.5"
                            fill="#ffffff"
                            fontSize={radius > 12 ? "9" : "8"}
                            fontWeight="bold"
                            pointerEvents="none"
                          >
                            {metric.count > 999 ? `${(metric.count / 1000).toFixed(1)}k` : metric.count}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Floating State Info Pill when Hovered */}
                {hoveredState && (
                  <div className="absolute bottom-3 left-3 bg-stone-900/90 text-white backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-2 pointer-events-none">
                    <span className="font-bold">{hoveredState}</span>
                    {(() => {
                      const m = malaysiaLocations.find((l) => matchState(hoveredState, l.name));
                      return m ? (
                        <span className="text-amber-300">
                          {m.count} visitor{m.count === 1 ? "" : "s"} ({m.percentage}%)
                        </span>
                      ) : (
                        <span className="text-stone-400">0 visitors</span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-1 gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#C25E3E]" />
                  Highlighted states indicate active guest attendance.
                </span>
                <span>Real 1:1 scale administrative map</span>
              </div>
            </div>

            {/* Right Column: Malaysian States Ranking + Outside Malaysia Section */}
            <div className="lg:col-span-5 space-y-6">
              {/* Malaysian States Ranked */}
              <div className="bg-stone-50/70 dark:bg-stone-950/40 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span className="text-base">🇲🇾</span>
                    Malaysian States
                  </h3>
                  <Badge variant="secondary" className="text-[11px]">
                    Domestic
                  </Badge>
                </div>

                <div className="space-y-3 pt-1">
                  {malaysiaLocations.length > 0 ? (
                    malaysiaLocations.map((loc, idx) => (
                      <div key={loc.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                            <span className="text-stone-400 font-mono text-[11px] w-4">{idx + 1}.</span>
                            {loc.name}
                            <span className="text-stone-400 font-normal">({loc.city})</span>
                          </span>
                          <span className="font-mono text-stone-600 dark:text-stone-400">
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              {loc.count.toLocaleString()}
                            </span>{" "}
                            ({loc.percentage}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C25E3E] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, loc.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-400 text-center py-6">
                      No domestic visitor data recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Outside Malaysia (International Visitors) */}
              <div className="bg-stone-50/70 dark:bg-stone-950/40 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Globe2 className="size-4 text-stone-600 dark:text-stone-400" />
                    Outside Malaysia
                  </h3>
                  <Badge variant="outline" className="text-[11px]">
                    International
                  </Badge>
                </div>
                <p className="text-xs text-stone-500">
                  Guests accessing wedding galleries from abroad.
                </p>

                <div className="space-y-2.5 pt-1">
                  {internationalLocations.length > 0 ? (
                    internationalLocations.map((loc) => (
                      <div
                        key={loc.name}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800/70 text-xs"
                      >
                        <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                          <span className="text-base">
                            {loc.countryCode === "SG"
                              ? "🇸🇬"
                              : loc.countryCode === "ID"
                              ? "🇮🇩"
                              : loc.countryCode === "BN"
                              ? "🇧🇳"
                              : loc.countryCode === "GB"
                              ? "🇬🇧"
                              : loc.countryCode === "US"
                              ? "🇺🇸"
                              : loc.countryCode === "AU"
                              ? "🇦🇺"
                              : "🌍"}
                          </span>
                          <span>{loc.country || loc.name}</span>
                          <span className="text-stone-400 font-normal">({loc.city})</span>
                        </span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                          {loc.count.toLocaleString()} visit{loc.count === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      100% Domestic · All current visitors are inside Malaysia.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: DEVICES & BROWSERS                                       */}
      {/* =================================================================== */}
      {activeSubTab === "devices" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-stone-50/70 dark:bg-stone-950/40 p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
          {/* Mobile Card */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/70 dark:border-stone-800/70 space-y-3">
            <div className="size-10 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {mobilePct}%
              </div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                Mobile Guests ({deviceBreakdown.mobile.toLocaleString()})
              </p>
            </div>
            <p className="text-xs text-stone-500">
              Most wedding guests scan QR codes on phones at tables.
            </p>
          </div>

          {/* Desktop Card */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/70 dark:border-stone-800/70 space-y-3">
            <div className="size-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Laptop className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {desktopPct}%
              </div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                Desktop Visits ({deviceBreakdown.desktop.toLocaleString()})
              </p>
            </div>
            <p className="text-xs text-stone-500">
              Couples and organizers viewing admin portal and high-res galleries.
            </p>
          </div>

          {/* Tablet Card */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/70 dark:border-stone-800/70 space-y-3">
            <div className="size-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <Tablet className="size-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {tabletPct}%
              </div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                Tablet Visits ({deviceBreakdown.tablet.toLocaleString()})
              </p>
            </div>
            <p className="text-xs text-stone-500">
              Photobooth registration stands and digital guestbook tablets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
