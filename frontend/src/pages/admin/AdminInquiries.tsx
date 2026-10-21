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
  MessageSquare,
  Clock,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  UserPlus,
  User,
  Phone,
  Trash2,
  Search,
  Ticket,
  Tag,
  Send,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { CustomerInquiry, InquiryStatus, AdminInvite } from "@/api/admin";
import { getCustomerWhatsAppDirectUrl } from "./utils";
import { toast } from "sonner";

interface AdminInquiriesProps {
  inquiries: CustomerInquiry[];
  invites?: AdminInvite[];
  inquiryFilter: "all" | "pending" | "contacted" | "sent" | "registered" | "converted";
  onFilterChange: (filter: "all" | "pending" | "contacted" | "sent" | "registered" | "converted") => void;
  isUpdatingInquiryId: string | null;
  onUpdateStatus: (id: string, status: InquiryStatus) => void;
  onDeleteInquiry: (id: string) => void;
  onConvertInquiry: (inquiry: CustomerInquiry) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onCopyInviteUrl?: (token: string, id: string) => void;
  onOpenCreateInvite: () => void;
}

export function AdminInquiries({
  inquiries,
  invites,
  inquiryFilter,
  onFilterChange,
  isUpdatingInquiryId,
  onUpdateStatus,
  onDeleteInquiry,
  onConvertInquiry,
  onRefresh,
  isRefreshing,
  onCopyInviteUrl,
  onOpenCreateInvite,
}: AdminInquiriesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [offerFilter, setOfferFilter] = useState<"all" | "offered" | "standard">("all");

  // Helper to cross-reference an inquiry with tenant_invites to ensure status consistency
  const getInquiryMeta = (inq: CustomerInquiry) => {
    const normUser = inq.username.trim().toLowerCase();
    const normPhone = inq.phone.replace(/\D/g, "");

    const matchedInvite = invites?.find((inv) => {
      if (inv.registrationDetails?.username?.trim().toLowerCase() === normUser) return true;
      if (inv.clientName?.trim().toLowerCase() === normUser) return true;
      if (inv.clientPhone && inv.clientPhone.replace(/\D/g, "") === normPhone) return true;
      return false;
    });

    let effectiveStatus: InquiryStatus = inq.status;
    if (matchedInvite) {
      if (matchedInvite.status === "used" || matchedInvite.isUsed || matchedInvite.registrationDetails) {
        effectiveStatus = "registered";
      } else if (matchedInvite.status === "active" && effectiveStatus !== "registered") {
        effectiveStatus = "sent";
      }
    } else if (effectiveStatus === "converted") {
      effectiveStatus = "sent";
    }

    return {
      matchedInvite,
      effectiveStatus,
    };
  };

  const totalVouchered = inquiries.filter((i) => Boolean(i.voucherCode || i.voucherApplied)).length;
  const pendingCount = inquiries.filter((i) => getInquiryMeta(i).effectiveStatus === "pending").length;
  const contactedCount = inquiries.filter((i) => getInquiryMeta(i).effectiveStatus === "contacted").length;
  const sentCount = inquiries.filter((i) => getInquiryMeta(i).effectiveStatus === "sent").length;
  const registeredCount = inquiries.filter((i) => getInquiryMeta(i).effectiveStatus === "registered").length;

  const filteredInquiries = inquiries.filter((inq) => {
    const { effectiveStatus } = getInquiryMeta(inq);
    const matchesFilter =
      inquiryFilter === "all" ||
      effectiveStatus === inquiryFilter ||
      (inquiryFilter === "sent" && (inq.status === "sent" || inq.status === "converted"));
    if (!matchesFilter) return false;

    const hasOffer = Boolean(inq.voucherCode || inq.voucherApplied);
    if (offerFilter === "offered" && !hasOffer) return false;
    if (offerFilter === "standard" && hasOffer) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      inq.username.toLowerCase().includes(query) ||
      inq.phone.toLowerCase().includes(query) ||
      inq.planName.toLowerCase().includes(query) ||
      (inq.voucherCode && inq.voucherCode.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Customer Inquiries
          </h1>
          <p className="text-sm text-muted-foreground">
            Prospective customers who initiated WhatsApp contact from pricing plans. Track conversation status, issue 24-hour registration links, and monitor completed tenant registrations.
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
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateInvite}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>Generate Invite</span>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 min-w-0">
        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Total Inquiries
            </CardTitle>
            <MessageSquare className="size-3.5 sm:size-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{inquiries.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              All leads
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Pending Action
            </CardTitle>
            <Clock className="size-3.5 sm:size-4 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Awaiting reply
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Contacted
            </CardTitle>
            <MessageCircle className="size-3.5 sm:size-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {contactedCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Engaged WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Link Sent
            </CardTitle>
            <Send className="size-3.5 sm:size-4 text-purple-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {sentCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Invite 24h issued
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Registered
            </CardTitle>
            <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {registeredCount}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Tenant onboarded
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Vouchers
            </CardTitle>
            <Ticket className="size-3.5 sm:size-4 text-rose-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
              {totalVouchered}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {totalVouchered > 0 ? `${Math.round((totalVouchered / (inquiries.length || 1)) * 100)}% claim rate` : "No vouchers"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-xs overflow-hidden min-w-0 w-full max-w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 min-w-0">
          <div>
            <CardTitle className="text-base font-semibold">
              Inquiries Directory
            </CardTitle>
            <CardDescription>
              Customer username, WhatsApp contact number, requested plan, promotional offers, and live onboarding status.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search user, phone, voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-background"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={inquiryFilter === "all" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("all")}
              >
                All ({inquiries.length})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "pending" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("pending")}
              >
                Pending ({pendingCount})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "contacted" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("contacted")}
              >
                Contacted ({contactedCount})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "sent" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("sent")}
              >
                Link Sent ({sentCount})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "registered" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("registered")}
              >
                Registered ({registeredCount})
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Offer Sub-Filter Bar */}
        <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium mr-1">Pricing Filter:</span>
            <button
              type="button"
              onClick={() => setOfferFilter("all")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                offerFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              All Pricing ({inquiries.length})
            </button>
            <button
              type="button"
              onClick={() => setOfferFilter("offered")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                offerFilter === "offered"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              <Tag className="size-3" />
              <span>With Voucher ({totalVouchered})</span>
            </button>
            <button
              type="button"
              onClick={() => setOfferFilter("standard")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                offerFilter === "standard"
                  ? "bg-muted-foreground/30 text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Standard Price ({inquiries.length - totalVouchered})
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Showing {filteredInquiries.length} of {inquiries.length} leads
          </span>
        </div>

        <CardContent className="p-0 overflow-hidden min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Pricing & Offer</TableHead>
                <TableHead>Time Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No customer inquiries found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inq) => {
                  const { matchedInvite, effectiveStatus } = getInquiryMeta(inq);
                  const hasVoucher = Boolean(inq.voucherCode || inq.voucherApplied);

                  return (
                    <TableRow key={inq.id} className={hasVoucher ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""}>
                      <TableCell className="align-top">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-accent shrink-0" />
                          <span>{inq.username}</span>
                        </div>
                        {matchedInvite?.registrationDetails ? (
                          <div className="mt-1 pt-1 border-t border-border/50 text-[11px] space-y-0.5">
                            <div className="text-muted-foreground truncate max-w-[150px]">
                              {matchedInvite.registrationDetails.email}
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="text-muted-foreground">Gallery:</span>
                              <a
                                href={`/w/${matchedInvite.registrationDetails.weddingSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-accent hover:underline font-medium"
                              >
                                <span>/{matchedInvite.registrationDetails.weddingSlug}</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            ID: {inq.id.slice(0, 10)}...
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs font-medium text-foreground">
                            {inq.phone}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border-accent/40 text-accent bg-accent/10"
                          >
                            {inq.planName}
                          </Badge>
                          {(inq.weddingDate || inq.planStartDate) && (
                            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/50">
                              {inq.weddingDate && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-foreground">Wedding:</span> {inq.weddingDate}
                                </div>
                              )}
                              {inq.planStartDate && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-foreground">Activation:</span> {inq.planStartDate.replace("T", " ")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        {hasVoucher ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                                <Tag className="size-3" />
                                {inq.voucherCode}
                              </span>
                              {inq.discountAmount && (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  -{inq.discountAmount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono">
                              <span className="line-through text-muted-foreground text-[11px]">
                                {inq.originalPrice || inq.price}
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {inq.finalPrice || inq.price}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium">
                              Standard Price
                            </span>
                            <div className="font-mono text-xs font-semibold text-foreground">
                              {inq.price}
                            </div>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="align-top text-xs text-muted-foreground">
                        <div>
                          {new Date(inq.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {new Date(inq.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>

                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1.5">
                        {effectiveStatus === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium w-fit border border-amber-500/20">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {effectiveStatus === "contacted" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium w-fit border border-blue-500/20">
                            <CheckCircle2 className="size-3" />
                            Contacted
                          </span>
                        )}
                        {effectiveStatus === "sent" && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium w-fit border border-purple-500/20">
                              <Send className="size-3 text-purple-500" />
                              Link Sent
                            </span>
                            {matchedInvite && matchedInvite.status === "active" && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {Math.ceil(matchedInvite.remainingMinutes / 60)}h remaining
                              </div>
                            )}
                          </div>
                        )}
                        {effectiveStatus === "registered" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium w-fit border border-emerald-500/20">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            Registered
                          </span>
                        )}

                        {/* Quick Status Selectors */}
                        <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                          {effectiveStatus !== "contacted" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "contacted")}
                              className="text-[10px] text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
                            >
                              Contacted
                            </button>
                          )}
                          {effectiveStatus !== "sent" && effectiveStatus !== "registered" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "sent")}
                              className="text-[10px] text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 underline cursor-pointer ml-1"
                            >
                              Link Sent
                            </button>
                          )}
                          {effectiveStatus !== "registered" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "registered")}
                              className="text-[10px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer ml-1"
                            >
                              Registered
                            </button>
                          )}
                          {effectiveStatus !== "pending" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "pending")}
                              className="text-[10px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer ml-1"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Quick WhatsApp Link: Auto updates status to 'contacted' if pending */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (effectiveStatus === "pending") {
                              onUpdateStatus(inq.id, "contacted");
                              toast.success(`Inquiry for ${inq.username} marked as Contacted`);
                            }
                            const url = getCustomerWhatsAppDirectUrl(inq.phone, inq.username, inq.planName);
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
                          title="Chat on WhatsApp (automatically marks status as Contacted)"
                        >
                          <MessageCircle className="size-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>

                        {/* Copy invite link shortcut if active invite exists */}
                        {matchedInvite && matchedInvite.status === "active" && onCopyInviteUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCopyInviteUrl(matchedInvite.token, matchedInvite.id)}
                            className="h-8 text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                            title="Copy Active 24h Registration Link"
                          >
                            <Copy className="size-3.5" />
                            <span className="hidden md:inline">Copy Link</span>
                          </Button>
                        )}

                        {/* 1-Click Generate 24h Invite Pre-filled */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onConvertInquiry(inq)}
                          className="h-8 text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                          title={
                            effectiveStatus === "registered"
                              ? "Generate another invite link if needed"
                              : effectiveStatus === "sent"
                              ? "Re-issue 24h registration link"
                              : "Generate 24h registration link for this customer"
                          }
                        >
                          <Sparkles className="size-3.5" />
                          <span className="hidden sm:inline">
                            {effectiveStatus === "registered"
                              ? "Re-invite"
                              : effectiveStatus === "sent"
                              ? "Re-issue"
                              : "Generate Invite"}
                          </span>
                        </Button>

                        {/* Delete inquiry */}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteInquiry(inq.id)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 cursor-pointer"
                          title="Delete Inquiry"
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
    </div>
  );
}
