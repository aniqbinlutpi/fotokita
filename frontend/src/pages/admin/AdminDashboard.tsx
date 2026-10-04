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
  onNavigateToTab: (tab: "overview" | "inquiries" | "invites" | "weddings" | "system") => void;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Business overview, revenue metrics, and wedding gallery analytics.
        </p>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="shadow-xs cursor-pointer hover:border-emerald-500/50 hover:bg-muted/20 transition-all"
          onClick={() => onNavigateToTab("inquiries")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Inquiries
            </CardTitle>
            <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{inquiries.length}</span>
              {pendingInquiriesCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  {pendingInquiriesCount} new
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              WhatsApp leads &amp; orders
            </p>
          </CardContent>
        </Card>

        {/* MRR / Monthly Revenue Card */}
        <Card
          className="shadow-xs cursor-pointer hover:border-violet-500/50 hover:bg-muted/20 transition-all"
          onClick={() => onNavigateToTab("weddings")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue ({monthLabel})
            </CardTitle>
            <TrendingUp className="size-4 text-violet-500 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                RM {monthlyRevenue}
              </span>
              {monthlyRevenue === 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground border-muted-foreground/30"
                >
                  no sales
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              RM {totalRevenue} total &bull; {accounts.length} subscribers
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
          onClick={() => onNavigateToTab("weddings")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Weddings
            </CardTitle>
            <Heart className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weddings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active registered weddings
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Media
            </CardTitle>
            <Camera className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalMedia ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Photos &amp; videos in S3 storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Subscription Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Area Chart (Quarterly / Monthly) */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  {revenuePeriod === "quarterly" ? `Quarterly Revenue (${currentYear})` : "Monthly Revenue"}
                </CardTitle>
                <CardDescription>
                  {revenuePeriod === "quarterly"
                    ? `RM collected across Q1, Q2, Q3 & Q4 ${currentYear}`
                    : "RM collected per month across the last 12 months"}
                </CardDescription>
              </div>

              {/* View Switcher: Quarterly vs Monthly */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setRevenuePeriod("quarterly")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
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
                    "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
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
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[240px] w-full">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
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
          </CardContent>
        </Card>

        {/* Subscriptions by Plan Bar Chart */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">Subscriptions by Plan</CardTitle>
                <CardDescription>
                  {accounts.length === 0
                    ? "No active subscribers yet"
                    : `${accounts.length} active subscriber${accounts.length !== 1 ? "s" : ""} across all tiers`}
                </CardDescription>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPlanMetric("subscribers")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
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
                    "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
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
          <CardContent>
            <ChartContainer config={planBarConfig} className="h-[240px] w-full">
              <BarChart data={planBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="plan"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Weddings Table */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Recent Weddings
            </CardTitle>
            <CardDescription>
              Latest 5 registered wedding events.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab("weddings")}
            className="text-xs"
          >
            View All ({weddings.length})
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedding Name</TableHead>
                <TableHead>URL Slug</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weddings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No weddings found. Create your first wedding.
                  </TableCell>
                </TableRow>
              ) : (
                weddings.slice(0, 5).map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      {w.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                        /{w.slug}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(w.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onCopyLink(w.slug, w.id)}
                          title="Copy Link"
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
        </CardContent>
      </Card>
    </div>
  );
}
