import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Ticket, User, Phone, Loader2, Sparkles, AlertCircle } from "lucide-react";
import type { AdminVoucher, VoucherRedemption } from "@/api/admin";

interface ViewVoucherRedemptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: AdminVoucher | null;
  redemptions: VoucherRedemption[];
  isLoading: boolean;
}

export function ViewVoucherRedemptionsDialog({
  open,
  onOpenChange,
  voucher,
  redemptions,
  isLoading,
}: ViewVoucherRedemptionsDialogProps) {
  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Ticket className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Voucher Redemptions:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">
                  {voucher.code}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {voucher.discountType === "percentage"
                  ? `${voucher.discountValue}% off`
                  : `RM ${voucher.discountValue} off`}{" "}
                • {voucher.usedCount} of {voucher.usageLimit ? `${voucher.usageLimit} max users` : "unlimited"} redeemed
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Loading redemptions history...</p>
            </div>
          ) : redemptions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-1">
              <AlertCircle className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">No Redemptions Yet</p>
              <p className="text-xs text-muted-foreground">
                No couples have applied voucher code <span className="font-mono">{voucher.code}</span> yet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Discount & Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((red) => (
                    <TableRow key={red.id}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3 text-accent shrink-0" />
                          <span>{red.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground shrink-0" />
                          <span>{red.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {red.planName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-muted-foreground text-[11px]">
                            {red.originalPrice}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {red.finalPrice}
                          </span>
                        </div>
                        {red.discountAmount && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Saved {red.discountAmount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        {new Date(red.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
