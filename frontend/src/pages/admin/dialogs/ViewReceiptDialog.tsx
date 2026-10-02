import { useState, useEffect } from "react";
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
  Receipt,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { AdminInvite, InviteReceiptResponse } from "@/api/admin";
import { getAdminInviteReceipt } from "@/api/admin";
import { formatTierLabel } from "../utils";

interface ViewReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invite: AdminInvite | null;
}

export function ViewReceiptDialog({
  open,
  onOpenChange,
  invite,
}: ViewReceiptDialogProps) {
  const [receipt, setReceipt] = useState<InviteReceiptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invite) {
      setIsLoading(true);
      setError(null);
      getAdminInviteReceipt(invite.id)
        .then((res) => {
          setReceipt(res);
        })
        .catch((err) => {
          console.error("Failed to load payment receipt:", err);
          setError(err?.message || "Failed to retrieve receipt evidence");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setReceipt(null);
      setError(null);
    }
  }, [open, invite]);

  if (!invite) return null;

  const isPdf =
    receipt?.receiptMimeType === "application/pdf" ||
    receipt?.receiptFilename?.toLowerCase().endsWith(".pdf") ||
    receipt?.receiptData?.startsWith("data:application/pdf");

  const handleDownload = () => {
    if (!receipt?.receiptData) return;
    const link = document.createElement("a");
    link.href = receipt.receiptData;
    link.download =
      receipt.receiptFilename ||
      `receipt-${invite.clientName || invite.token.slice(0, 8)}.${isPdf ? "pdf" : "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (!receipt?.receiptData) return;
    const newWindow = window.open();
    if (newWindow) {
      if (isPdf) {
        newWindow.location.href = receipt.receiptData;
      } else {
        newWindow.document.write(
          `<img src="${receipt.receiptData}" style="max-width:100%; height:auto; display:block; margin:auto;" />`
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
              <Receipt className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Payment Receipt Evidence
              </DialogTitle>
              <DialogDescription className="text-xs">
                Client:{" "}
                <span className="font-semibold text-foreground">
                  {invite.clientName || "Unnamed"}
                </span>{" "}
                • Plan:{" "}
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-accent/40 text-accent bg-accent/10 font-normal"
                >
                  {formatTierLabel(invite.tier)}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 min-h-[250px] flex flex-col items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-12">
              <Loader2 className="size-6 animate-spin text-accent" />
              <p className="text-xs">Loading receipt audit file...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-destructive py-12">
              <AlertCircle className="size-6" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          {!isLoading && !error && receipt?.receiptData && (
            <div className="w-full flex flex-col items-center gap-3">
              {isPdf ? (
                <div className="w-full space-y-2">
                  <iframe
                    src={receipt.receiptData}
                    className="w-full h-[55vh] rounded-lg border bg-muted/20"
                    title="Payment Receipt PDF"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="size-3.5 text-red-500" />
                      <span>{receipt.receiptFilename || "Payment Receipt PDF"}</span>
                    </span>
                    <span>PDF Document</span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-2">
                  <div className="relative max-h-[60vh] overflow-auto rounded-lg border bg-muted/10 p-2 flex items-center justify-center">
                    <img
                      src={receipt.receiptData}
                      alt="Payment Receipt"
                      className="max-h-[55vh] w-auto max-w-full object-contain rounded"
                    />
                  </div>
                  {receipt.receiptFilename && (
                    <div className="text-xs text-muted-foreground">
                      Filename: {receipt.receiptFilename}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && !receipt?.receiptData && (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No receipt evidence found on record for this link.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <div className="flex items-center gap-2 mr-auto">
            {receipt?.receiptData && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5 text-xs h-8"
                >
                  <Download className="size-3.5" />
                  <span>Download</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenNewTab}
                  className="gap-1.5 text-xs h-8"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open Full</span>
                </Button>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
