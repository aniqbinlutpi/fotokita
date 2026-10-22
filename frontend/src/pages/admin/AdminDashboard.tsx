import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Camera,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Activity,
} from "lucide-react";
import type { Wedding } from "@/types/wedding";
import type { AdminStats, AdminInvite, AdminTenantAccount, CustomerInquiry } from "@/api/admin";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Numeric RM price for each subscription tier */
const TIER_PRICE_MAP: Record<string, number> = {
  "12h":    6,
  "1day":   10,
  "3days":  17,
  "1week":  23,
  "1month": 46,
  "1year":  189,
  standard: 10,
  premium:  46,
  vip:      189,
};

const TIER_LABEL_MAP: Record<string, string> = {
  "12h":    "12 Hours",
  "1day":   "Whole Day",
  "3days":  "3 Days",
  "1week":  "1 Week",
  "1month": "1 Month",
  "1year":  "1 Year",
  standard: "Standard",
  premium:  "Premium",
  vip:      "VIP",
};

const STANDARD_TIERS = [
  { tier: "12h", name: "12 Hours", price: 6 },
  { tier: "1day", name: "Whole Day", price: 10 },
  { tier: "3days", name: "3 Days", price: 17 },
  { tier: "1week", name: "1 Week", price: 23 },
  { tier: "1month", name: "1 Month", price: 46 },
  { tier: "1year", name: "1 Year", price: 189 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the last N calendar months as { label, fullLabel, year, month } */
function lastNMonths(n: number) {
  const months: { label: string; fullLabel: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminDashboardProps {
  weddings: Wedding[];
  inquiries: CustomerInquiry[];
  invites: AdminInvite[];
  tenantAccounts: Record<string, AdminTenantAccount>;
  stats: AdminStats | null;
  systemPings: {
    weddingService: "checking" | "online" | "offline";
    mediaService: "checking" | "online" | "offline";
    adminService: "checking" | "online" | "offline";
  };
  copiedId: string | null;
  onCopyLink: (slug: string, id: string) => void;
  onViewGallery: (slug: string) => void;
  onNavigateToTab: (tab: "overview" | "analytics" | "inquiries" | "invites" | "weddings" | "system") => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminDashboard({
  weddings,
  inquiries,
  tenantAccounts,
  stats,
  systemPings: _systemPings,
  copiedId,
  onCopyLink,
  onViewGallery,
  onNavigateToTab,
}: AdminDashboardProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<"quarterly" | "monthly">("quarterly");
  const [planMetric, setPlanMetric] = useState<"subscribers" | "revenue">("subscribers");
  const pendingInquiriesCount = inquiries.filter((i) => i.status === "pending").length;

  // -------------------------------------------------------------------------
  // Revenue — derived from tenantAccounts (authoritative paid subscriber list)
  // -------------------------------------------------------------------------
  const accounts = Object.values(tenantAccounts);
  const now = new Date();
  const currentYear = now.getFullYear();

  const totalRevenue = accounts.reduce(
    (sum, acc) => sum + (TIER_PRICE_MAP[acc.planTier] ?? 0),
    0
  );

  const monthlyRevenue = accounts
    .filter((acc) => {
      const d = new Date(acc.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, acc) => sum + (TIER_PRICE_MAP[acc.planTier] ?? 0), 0);

  const monthLabel = now.toLocaleDateString("en-MY", { month: "short", year: "numeric" });

  // -------------------------------------------------------------------------
  // Quarterly Revenue Breakdown (Q1, Q2, Q3, Q4)
  // -------------------------------------------------------------------------
  const QUARTERS = [
    { label: "Quarter 1", shortLabel: "Q1", months: [0, 1, 2], period: "Jan - Mar" },
    { label: "Quarter 2", shortLabel: "Q2", months: [3, 4, 5], period: "Apr - Jun" },
    { label: "Quarter 3", shortLabel: "Q3", months: [6, 7, 8], period: "Jul - Sep" },
    { label: "Quarter 4", shortLabel: "Q4", months: [9, 10, 11], period: "Oct - Dec" },
  ];

  const quarterlyData = QUARTERS.map((q) => {
    const revenue = accounts
      .filter((acc) => {
        const d = new Date(acc.createdAt);
        return d.getFullYear() === currentYear && q.months.includes(d.getMonth());
      })
      .reduce((sum, acc) => sum + (TIER_PRICE_MAP[acc.planTier] ?? 0), 0);

    return {
      label: q.shortLabel,
      fullLabel: `${q.label} (${q.period} ${currentYear})`,
      revenue,
    };
  });

  // -------------------------------------------------------------------------
  // 1-Year Area Chart — Monthly Revenue for the last 12 months
  // -------------------------------------------------------------------------
  const recentMonths = lastNMonths(12);

  const monthlyData = recentMonths.map(({ label, fullLabel, year, month }) => {
    const revenue = accounts
      .filter((acc) => {
        const d = new Date(acc.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, acc) => sum + (TIER_PRICE_MAP[acc.planTier] ?? 0), 0);
    return { label, fullLabel, revenue };
  });

  const revenueChartData = revenuePeriod === "quarterly" ? quarterlyData : monthlyData;

  const areaChartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // -------------------------------------------------------------------------
  // Bar Chart — Subscriptions by Plan (Count & Revenue)
  // -------------------------------------------------------------------------
  const planBarData = STANDARD_TIERS.map(({ tier, name, price }) => {
    const count = accounts.filter((acc) => acc.planTier === tier).length;
    return {
      tier,
      plan: name,
      price,
      subscribers: count,
      revenue: count * price,
    };
  });

  // Include any extra tiers present in accounts that are not in STANDARD_TIERS
  const standardSet = new Set(STANDARD_TIERS.map((t) => t.tier));
  accounts.forEach((acc) => {
    if (!standardSet.has(acc.planTier)) {
      standardSet.add(acc.planTier);
      const count = accounts.filter((a) => a.planTier === acc.planTier).length;
      const price = TIER_PRICE_MAP[acc.planTier] ?? 0;
      planBarData.push({
        tier: acc.planTier,
        plan: TIER_LABEL_MAP[acc.planTier] ?? acc.planTier,
        price,
        subscribers: count,
        revenue: count * price,
      });
    }
  });

  const planBarConfig = {
    subscribers: {
      label: "Subscribers",
      color: "hsl(var(--chart-2))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Super Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Business overview, revenue metrics, and wedding gallery analytics.
        </p>
      </div>

      {/* Real-time Visitor Insights Hero Link Banner */}
      <div
        onClick={() => onNavigateToTab("analytics")}
        className="group relative overflow-hidden rounded-xl border border-[#C25E3E]/30 bg-linear-to-r from-amber-500/10 via-[#C25E3E]/10 to-transparent p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-[#C25E3E] transition-all shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-[#C25E3E]/20 text-[#C25E3E] flex items-center justify-center shrink-0">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Live Visitor Analytics &amp; Regional Heatmap
              </h3>
              <Badge className="bg-[#C25E3E] text-white text-[10px] py-0 px-1.5 font-semibold">
                Live
              </Badge>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Observe guest traffic volume, session duration, and geographic origins across all weddings.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex text-[#C25E3E] group-hover:translate-x-1 transition-transform"
        >
          Open Analytics &rarr;
        </Button>
      </div>

      {/* Metric KPI Cards - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4 min-w-0 w-full max-w-full">
        <Card
          className="shadow-xs cursor-pointer hover:border-emerald-500/50 hover:bg-muted/20 transition-all min-w-0"
          onClick={() => onNavigateToTab("inquiries")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              <span className="sm:hidden">Inquiries</span>
              <span className="hidden sm:inline">Customer Inquiries</span>
            </CardTitle>
            <MessageSquare className="size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold">{inquiries.length}</span>
              {pendingInquiriesCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
                >
                  {pendingInquiriesCount} new
                </Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              <span className="sm:hidden">WhatsApp leads</span>
              <span className="hidden sm:inline">WhatsApp leads &amp; orders</span>
            </p>
          </CardContent>
        </Card>

        {/* MRR / Monthly Revenue Card */}
        <Card
          className="shadow-xs cursor-pointer hover:border-violet-500/50 hover:bg-muted/20 transition-all min-w-0"
          onClick={() => onNavigateToTab("weddings")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              <span className="sm:hidden">Revenue</span>
              <span className="hidden sm:inline">Revenue ({monthLabel})</span>
            </CardTitle>
            <TrendingUp className="size-3.5 sm:size-4 text-violet-500 dark:text-violet-400 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold font-mono">
                RM {monthlyRevenue}
              </span>
              {monthlyRevenue === 0 && (
                <Badge
                  variant="outline"
                  className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 text-muted-foreground border-muted-foreground/30"
                >
                  no sales
                </Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              RM {totalRevenue} total &bull; {accounts.length} subs
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all min-w-0"
          onClick={() => onNavigateToTab("weddings")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              <span className="sm:hidden">Weddings</span>
              <span className="hidden sm:inline">Total Weddings</span>
            </CardTitle>
            <Heart className="size-3.5 sm:size-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{weddings.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Active registered
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Total Media
            </CardTitle>
            <Camera className="size-3.5 sm:size-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {stats?.totalMedia ?? "—"}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Photos &amp; videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Subscription Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 w-full max-w-full">
        {/* Revenue Area Chart (Quarterly / Monthly) */}
        <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">
                  {revenuePeriod === "quarterly" ? `Quarterly Revenue (${currentYear})` : "Monthly Revenue"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {revenuePeriod === "quarterly"
                    ? `RM collected across Q1, Q2, Q3 & Q4 ${currentYear}`
                    : "RM collected per month across the last 12 months"}
                </CardDescription>
              </div>

              {/* View Switcher: Quarterly vs Monthly */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("quarterly")}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-xs",
                    revenuePeriod === "quarterly"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("monthly")}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-xs",
                    revenuePeriod === "monthly"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Monthly (1Y)
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 min-w-0 max-w-full overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-2">
              <div className="min-w-[480px] sm:min-w-full">
                <ChartContainer config={areaChartConfig} className="aspect-auto h-[200px] sm:h-[240px] w-full">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillRevenueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `RM${v}`}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
                        formatter={(value) => (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-mono font-medium text-foreground">
                              RM {Number(value).toLocaleString()}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillRevenueArea)"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: revenuePeriod === "quarterly" ? 4 : 2, fill: "var(--color-revenue)" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions by Plan Bar Chart */}
        <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Subscriptions by Plan</CardTitle>
                <CardDescription className="text-xs">
                  {accounts.length === 0
                    ? "No active subscribers yet"
                    : `${accounts.length} active subscriber${accounts.length !== 1 ? "s" : ""} across all tiers`}
                </CardDescription>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setPlanMetric("subscribers")}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-xs",
                    planMetric === "subscribers"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Subscribers
                </button>
                <button
                  type="button"
                  onClick={() => setPlanMetric("revenue")}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-xs",
                    planMetric === "revenue"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Revenue (RM)
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0 min-w-0 max-w-full overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-2">
              <div className="min-w-[480px] sm:min-w-full">
                <ChartContainer config={planBarConfig} className="aspect-auto h-[200px] sm:h-[240px] w-full">
                  <BarChart data={planBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="plan"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                      tickFormatter={(v) => (planMetric === "revenue" ? `RM${v}` : `${v}`)}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const item = payload?.[0]?.payload;
                            return item ? `${item.plan} (RM ${item.price})` : "";
                          }}
                          formatter={(_value, _name, item) => (
                            <div className="flex flex-col gap-1 w-full text-xs">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Subscribers:</span>
                                <span className="font-mono font-medium text-foreground">
                                  {item.payload.subscribers} {item.payload.subscribers === 1 ? "user" : "users"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Total Revenue:</span>
                                <span className="font-mono font-medium text-foreground">
                                  RM {item.payload.revenue.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey={planMetric}
                      fill={planMetric === "subscribers" ? "var(--color-subscribers)" : "var(--color-revenue)"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Weddings Table */}
      <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between pb-3 min-w-0">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold">
              Recent Weddings
            </CardTitle>
            <CardDescription className="text-xs">
              Latest 5 registered wedding events.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab("weddings")}
            className="text-xs h-8 px-2 cursor-pointer"
          >
            View All ({weddings.length})
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs whitespace-nowrap">Wedding Name</TableHead>
                <TableHead className="text-xs whitespace-nowrap">URL Slug</TableHead>
                <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Event Date</TableHead>
                <TableHead className="text-right text-xs whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weddings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-xs text-muted-foreground"
                  >
                    No weddings found. Create your first wedding.
                  </TableCell>
                </TableRow>
              ) : (
                weddings.slice(0, 5).map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {w.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted">
                        /{w.slug}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      {new Date(w.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onCopyLink(w.slug, w.id)}
                          title="Copy Link"
                          className="size-7 cursor-pointer"
                        >
                          {copiedId === w.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onViewGallery(w.slug)}
                          title="Open Gallery"
                          className="size-7 cursor-pointer"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
