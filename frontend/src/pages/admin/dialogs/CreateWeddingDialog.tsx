import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

interface CreateWeddingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingName: string;
  onWeddingNameChange: (name: string) => void;
  weddingSlug: string;
  onWeddingSlugChange: (slug: string) => void;
  weddingDate: string;
  onWeddingDateChange: (date: string) => void;
  slugStatus: { available?: boolean; message?: string } | null;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateWeddingDialog({
  open,
  onOpenChange,
  weddingName,
  onWeddingNameChange,
  weddingSlug,
  onWeddingSlugChange,
  weddingDate,
  onWeddingDateChange,
  slugStatus,
  isCreating,
  onSubmit,
}: CreateWeddingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Wedding</DialogTitle>
          <DialogDescription>
            Register a new wedding event into the database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Wedding / Couple Name</label>
            <Input
              placeholder="e.g. Amir & Nadia"
              value={weddingName}
              onChange={(e) => onWeddingNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Gallery URL Slug</label>
            <Input
              placeholder="amir-and-nadia"
              value={weddingSlug}
              onChange={(e) => onWeddingSlugChange(e.target.value)}
              required
            />
            {slugStatus && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  slugStatus.available ? "text-emerald-500" : "text-destructive"
                }`}
              >
                {slugStatus.available ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                <span>{slugStatus.message}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Event Date</label>
            <Input
              type="date"
              value={weddingDate}
              onChange={(e) => onWeddingDateChange(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || Boolean(slugStatus && !slugStatus.available)}
            >
              {isCreating ? "Creating..." : "Create Wedding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
