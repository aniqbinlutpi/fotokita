import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Ticket,
  Plus,
  RefreshCw,
  Search,
  Copy,
  Check,
  Trash2,
  Power,
  Users,
  Clock,
  Sparkles,
  Percent,
  DollarSign,
} from "lucide-react";
import type { AdminVoucher, VoucherRedemption } from "@/api/admin";
import { CreateVoucherDialog } from "./dialogs/CreateVoucherDialog";
import { ViewVoucherRedemptionsDialog } from "./dialogs/ViewVoucherRedemptionsDialog";
import { getAdminVoucherRedemptions } from "@/api/admin";
import { toast } from "sonner";

interface AdminVouchersProps {
  vouchers: AdminVoucher[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onCreateVoucher: (data: any) => Promise<void>;
  onToggleStatus: (id: string, isActive: boolean) => Promise<void>;
  onDeleteVoucher: (id: string) => Promise<void>;
}

export function AdminVouchers({
  vouchers,
  onRefresh,
  isRefreshing,
  onCreateVoucher,
  onToggleStatus,
  onDeleteVoucher,
}: AdminVouchersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "exhausted" | "expired" | "disabled">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Redemptions view dialog
  const [selectedVoucherForRedemptions, setSelectedVoucherForRedemptions] = useState<AdminVoucher | null>(null);
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);
  const [isRedemptionsOpen, setIsRedemptionsOpen] = useState(false);

  const totalVouchers = vouchers.length;
  const activeCount = vouchers.filter((v) => v.status === "active").length;
  const totalRedemptions = vouchers.reduce((acc, v) => acc + v.usedCount, 0);

  const filteredVouchers = vouchers.filter((v) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.code.toLowerCase().includes(q) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied voucher code ${code}`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handleOpenRedemptions = async (voucher: AdminVoucher) => {
    setSelectedVoucherForRedemptions(voucher);
    setIsRedemptionsOpen(true);
    setIsLoadingRedemptions(true);
    try {
      const data = await getAdminVoucherRedemptions(voucher.id);
      setRedemptions(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load redemptions");
    } finally {
      setIsLoadingRedemptions(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>Vouchers & Promo Codes</span>
            <Badge variant="outline" className="text-purple-600 border-purple-500/30 bg-purple-500/10 text-xs">
              Deals & Reductions
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Create fixed RM discount offers (e.g. RM5 off) or percentage-off deals, set user usage limits, and track who claimed discounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>Create Voucher</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 min-w-0">
        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Total Vouchers
            </CardTitle>
            <Ticket className="size-3.5 sm:size-4 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{totalVouchers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {activeCount} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Total Redemptions
            </CardTitle>
            <Users className="size-3.5 sm:size-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalRedemptions}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Couples claimed deals
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Active Campaigns
            </CardTitle>
            <Sparkles className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {activeCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Available for couples
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table Card */}
      <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 min-w-0">
          <div>
            <CardTitle className="text-base font-semibold">
              Vouchers Directory
            </CardTitle>
            <CardDescription>
              All promotional codes, discount values, redemption counts, and active limits.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search code or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-background"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => setStatusFilter("all")}
              >
                All ({vouchers.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => setStatusFilter("active")}
              >
                Active ({vouchers.filter((v) => v.status === "active").length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "exhausted" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => setStatusFilter("exhausted")}
              >
                Limit Reached ({vouchers.filter((v) => v.status === "exhausted").length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "disabled" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => setStatusFilter("disabled")}
              >
                Disabled ({vouchers.filter((v) => v.status === "disabled").length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher Code</TableHead>
                  <TableHead>Discount Offer</TableHead>
                  <TableHead>Usage / Redemptions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No voucher codes found. Click "Create Voucher" to set up your first promo discount.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVouchers.map((v) => {
                    const isExhausted = v.status === "exhausted";
                    const percentageUsed = v.usageLimit
                      ? Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100))
                      : null;

                    return (
                      <TableRow key={v.id}>
                        {/* Code */}
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground tracking-wider">
                              {v.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted cursor-pointer"
                              title="Copy Code"
                            >
                              {copiedCode === v.code ? (
                                <Check className="size-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          </div>
                          {v.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs truncate">
                              {v.description}
                            </p>
                          )}
                        </TableCell>

                        {/* Discount Offer */}
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1.5">
                            {v.discountType === "percentage" ? (
                              <Badge className="bg-purple-600 text-white font-sans text-xs flex items-center gap-1">
                                <Percent className="size-3" />
                                <span>{v.discountValue}% Off</span>
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600 text-white font-sans text-xs flex items-center gap-1">
                                <DollarSign className="size-3" />
                                <span>RM {v.discountValue} Off</span>
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Usage & Limits */}
                        <TableCell className="align-top">
                          <div className="space-y-1 min-w-[130px]">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-semibold text-foreground">
                                {v.usedCount} used
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                {v.usageLimit ? `/ ${v.usageLimit} max` : "(Unlimited)"}
                              </span>
                            </div>

                            {v.usageLimit && (
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isExhausted ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${percentageUsed}%` }}
                                />
                              </div>
                            )}

                            {v.usedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenRedemptions(v)}
                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                              >
                                <Users className="size-3" />
                                <span>View {v.usedCount} Customer{v.usedCount > 1 ? "s" : ""}</span>
                              </button>
                            )}
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="align-top">
                          {v.status === "active" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          )}
                          {v.status === "exhausted" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                              Limit Reached
                            </span>
                          )}
                          {v.status === "expired" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              Expired
                            </span>
                          )}
                          {v.status === "disabled" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                              Disabled
                            </span>
                          )}
                        </TableCell>

                        {/* Expiry */}
                        <TableCell className="align-top text-xs text-muted-foreground">
                          {v.expiresAt ? (
                            <div className="flex items-center gap-1 font-sans">
                              <Clock className="size-3 text-muted-foreground shrink-0" />
                              <span>{new Date(v.expiresAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/80 italic text-[11px]">No Expiration</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Toggle Status */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onToggleStatus(v.id, !v.isActive)}
                              className={`h-8 w-8 cursor-pointer ${
                                v.isActive
                                  ? "text-emerald-600 hover:text-amber-600 hover:bg-amber-500/10"
                                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
                              }`}
                              title={v.isActive ? "Deactivate Voucher" : "Activate Voucher"}
                            >
                              <Power className="size-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete voucher "${v.code}"?`)) {
                                  onDeleteVoucher(v.id);
                                }
                              }}
                              className="text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer"
                              title="Delete Voucher"
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
        </CardContent>
      </Card>

      {/* Create Voucher Dialog */}
      <CreateVoucherDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (data) => {
          setIsSubmittingCreate(true);
          try {
            await onCreateVoucher(data);
          } finally {
            setIsSubmittingCreate(false);
          }
        }}
        isSubmitting={isSubmittingCreate}
      />

      {/* View Redemptions Dialog */}
      <ViewVoucherRedemptionsDialog
        open={isRedemptionsOpen}
        onOpenChange={setIsRedemptionsOpen}
        voucher={selectedVoucherForRedemptions}
        redemptions={redemptions}
        isLoading={isLoadingRedemptions}
      />
    </div>
  );
}
