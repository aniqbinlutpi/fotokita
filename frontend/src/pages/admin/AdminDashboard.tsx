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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Camera,
  Radio,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import type { Wedding } from "@/types/wedding";
import type { AdminStats, CustomerInquiry } from "@/api/admin";

interface AdminDashboardProps {
  weddings: Wedding[];
  inquiries: CustomerInquiry[];
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

export function AdminDashboard({
  weddings,
  inquiries,
  stats,
  systemPings,
  copiedId,
  onCopyLink,
  onViewGallery,
  onNavigateToTab,
}: AdminDashboardProps) {
  const pendingInquiriesCount = inquiries.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Data summary, weddings statistics, and microservice infrastructure health.
        </p>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        <Card
          className="shadow-xs cursor-pointer hover:border-border/80 hover:bg-muted/20 transition-all"
          onClick={() => onNavigateToTab("system")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wedding Service Status
            </CardTitle>
            <Radio
              className={`size-4 ${
                systemPings.weddingService === "online"
                  ? "text-emerald-500 animate-pulse"
                  : "text-rose-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  systemPings.weddingService === "online"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-lg font-semibold uppercase text-xs">
                {systemPings.weddingService}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Port 3001 &bull; PostgreSQL Drizzle
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs cursor-pointer hover:border-border/80 hover:bg-muted/20 transition-all"
          onClick={() => onNavigateToTab("system")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Media Service Status
            </CardTitle>
            <Radio
              className={`size-4 ${
                systemPings.mediaService === "online"
                  ? "text-emerald-500 animate-pulse"
                  : "text-rose-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  systemPings.mediaService === "online"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-lg font-semibold uppercase text-xs">
                {systemPings.mediaService}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Port 3000 &bull; Cloudflare R2 Storage
            </p>
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
