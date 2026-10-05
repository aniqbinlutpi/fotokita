import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { Wedding } from "@/types/wedding";
import type { AdminTenantAccount } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { formatTierLabel } from "@/pages/admin/utils";

interface WeddingsDataTableProps {
  data: Wedding[];
  tenantAccounts?: Record<string, AdminTenantAccount>;
  copiedId: string | null;
  onCopyLink: (slug: string, id: string) => void;
  onViewGallery: (slug: string) => void;
  onDelete: (wedding: Wedding) => void;
  onTogglePreserveMedia?: (weddingId: string, currentVal: boolean) => Promise<void>;
}

export const WeddingsDataTable: React.FC<WeddingsDataTableProps> = ({
  data,
  tenantAccounts = {},
  copiedId,
  onCopyLink,
  onViewGallery,
  onDelete,
  onTogglePreserveMedia,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField === "name") {
        const res = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? res : -res;
      }
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const toggleSort = (field: "name" | "date") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by couple name or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {sortedData.length} of {data.length} registered weddings
        </span>
      </div>

      {/* Table */}
      <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("name")}
                  className="-ml-2 h-8 font-semibold text-xs gap-1"
                >
                  <span>Wedding / Couple</span>
                  <ArrowUpDown className="size-3" />
                </Button>
              </TableHead>
              <TableHead>URL Slug</TableHead>
              <TableHead>Subscription Plan</TableHead>
              <TableHead>Media Retention</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("date")}
                  className="-ml-2 h-8 font-semibold text-xs gap-1"
                >
                  <span>Event Date</span>
                  <ArrowUpDown className="size-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No weddings match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((wedding) => {
                const tenant = tenantAccounts[wedding.id];
                const now = Date.now();
                const isPlanExpired = tenant?.planExpiresAt
                  ? new Date(tenant.planExpiresAt).getTime() <= now
                  : false;

                return (
                  <TableRow key={wedding.id}>
                    <TableCell className="font-semibold text-sm">
                      {wedding.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/80 text-foreground">
                        /{wedding.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tenant ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-foreground">
                              {formatTierLabel(tenant.planTier)}
                            </span>
                            {tenant.status === "archived" || tenant.mediaCleanedUp ? (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-muted text-muted-foreground">
                                Archived
                              </Badge>
                            ) : isPlanExpired ? (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Active
                              </Badge>
                            )}
                          </div>
                          {tenant.planExpiresAt && (
                            <span className="text-[11px] text-muted-foreground">
                              Ends: {new Date(tenant.planExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standard</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant ? (
                        <div className="flex flex-col gap-1 items-start">
                          {tenant.preserveMedia ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onTogglePreserveMedia?.(wedding.id, true)}
                              className="h-6 gap-1 px-2 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
                              title="Auto-delete disabled (Friend/VIP). Click to revert to standard 3-day deletion."
                            >
                              <ShieldCheck className="size-3 text-amber-600 dark:text-amber-400" />
                              <span>Preserved (No Delete)</span>
                            </Button>
                          ) : tenant.mediaCleanedUp ? (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 text-muted-foreground border-muted">
                              Media Purged
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onTogglePreserveMedia?.(wedding.id, false)}
                              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-amber-600 hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer"
                              title="Auto-delete after 3 days. Click to PRESERVE FOREVER (friend/VIP)."
                            >
                              <ShieldAlert className="size-3 text-muted-foreground" />
                              <span>Auto-Purge (3d)</span>
                            </Button>
                          )}
                          {tenant.mediaExpiresAt && !tenant.mediaCleanedUp && !tenant.preserveMedia && (
                            <span className="text-[10px] text-muted-foreground">
                              Purge: {new Date(tenant.mediaExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {new Date(wedding.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {wedding.createdAt
                      ? new Date(wedding.createdAt).toLocaleDateString("en-US")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onCopyLink(wedding.slug, wedding.id)}
                        className="gap-1 h-7"
                      >
                        {copiedId === wedding.id ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onViewGallery(wedding.slug)}
                        className="gap-1 h-7 text-primary hover:text-primary"
                      >
                        <ExternalLink className="size-3" />
                        <span>Gallery</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(wedding)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Wedding"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="gap-1"
            >
              <ChevronLeft className="size-3" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
