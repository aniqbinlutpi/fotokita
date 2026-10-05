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
} from "lucide-react";
import type { CustomerInquiry } from "@/api/admin";
import { getCustomerWhatsAppDirectUrl } from "./utils";

interface AdminInquiriesProps {
  inquiries: CustomerInquiry[];
  inquiryFilter: "all" | "pending" | "contacted" | "converted";
  onFilterChange: (filter: "all" | "pending" | "contacted" | "converted") => void;
  isUpdatingInquiryId: string | null;
  onUpdateStatus: (id: string, status: "pending" | "contacted" | "converted") => void;
  onDeleteInquiry: (id: string) => void;
  onConvertInquiry: (inquiry: CustomerInquiry) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenCreateInvite: () => void;
}

export function AdminInquiries({
  inquiries,
  inquiryFilter,
  onFilterChange,
  isUpdatingInquiryId,
  onUpdateStatus,
  onDeleteInquiry,
  onConvertInquiry,
  onRefresh,
  isRefreshing,
  onOpenCreateInvite,
}: AdminInquiriesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesFilter = inquiryFilter === "all" || inq.status === inquiryFilter;
    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      inq.username.toLowerCase().includes(query) ||
      inq.phone.toLowerCase().includes(query) ||
      inq.planName.toLowerCase().includes(query)
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
            Prospective customers who initiated WhatsApp contact from the pricing plans. Review inquiries, confirm payment, and issue 24-hour invite links.
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
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
              All inquiries
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
              {inquiries.filter((i) => i.status === "pending").length}
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
              {inquiries.filter((i) => i.status === "contacted").length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Engaged WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2.5 sm:p-4">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-muted-foreground truncate">
              Converted
            </CardTitle>
            <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="p-2.5 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {inquiries.filter((i) => i.status === "converted").length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
              Link issued
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
              Customer username, WhatsApp contact number, and requested plan.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search user or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-background"
              />
            </div>

            {/* Filter Pills */}
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
                Pending ({inquiries.filter((i) => i.status === "pending").length})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "contacted" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("contacted")}
              >
                Contacted ({inquiries.filter((i) => i.status === "contacted").length})
              </Button>
              <Button
                size="sm"
                variant={inquiryFilter === "converted" ? "default" : "outline"}
                className="h-7 text-xs px-2.5 rounded-full cursor-pointer"
                onClick={() => onFilterChange("converted")}
              >
                Converted ({inquiries.filter((i) => i.status === "converted").length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden min-w-0 max-w-full">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Time Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No customer inquiries found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inq) => (
                  <TableRow key={inq.id}>
                    <TableCell className="align-top">
                      <div className="font-medium text-foreground flex items-center gap-1.5">
                        <User className="size-3.5 text-accent shrink-0" />
                        <span>{inq.username}</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        ID: {inq.id.slice(0, 10)}...
                      </div>
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
                        <div className="text-[11px] font-mono font-semibold text-muted-foreground">
                          {inq.price}
                        </div>
                      </div>
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
                        {inq.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium w-fit">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {inq.status === "contacted" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium w-fit">
                            <CheckCircle2 className="size-3" />
                            Contacted
                          </span>
                        )}
                        {inq.status === "converted" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium w-fit">
                            <Sparkles className="size-3 text-emerald-500" />
                            Converted
                          </span>
                        )}

                        {/* Quick Status Selectors */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {inq.status !== "contacted" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "contacted")}
                              className="text-[10px] text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
                            >
                              Mark Contacted
                            </button>
                          )}
                          {inq.status !== "converted" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "converted")}
                              className="text-[10px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer ml-1.5"
                            >
                              Mark Converted
                            </button>
                          )}
                          {inq.status !== "pending" && (
                            <button
                              type="button"
                              disabled={isUpdatingInquiryId === inq.id}
                              onClick={() => onUpdateStatus(inq.id, "pending")}
                              className="text-[10px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer ml-1.5"
                            >
                              Reset Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick WhatsApp Link to Customer */}
                        <a
                          href={getCustomerWhatsAppDirectUrl(inq.phone, inq.username, inq.planName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                          title="Chat with customer on WhatsApp"
                        >
                          <MessageCircle className="size-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>

                        {/* 1-Click Generate 24h Invite Pre-filled */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onConvertInquiry(inq)}
                          className="h-8 text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10 cursor-pointer"
                          title="Generate 24h registration link for this customer"
                        >
                          <Sparkles className="size-3.5" />
                          <span className="hidden sm:inline">Generate Invite</span>
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
