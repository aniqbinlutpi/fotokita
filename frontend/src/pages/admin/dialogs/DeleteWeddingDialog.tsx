import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Wedding } from "@/types/wedding";

interface DeleteWeddingDialogProps {
  wedding: Wedding | null;
  onClose: () => void;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteWeddingDialog({
  wedding,
  onClose,
  isDeleting,
  onConfirm,
}: DeleteWeddingDialogProps) {
  return (
    <AlertDialog open={!!wedding} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <AlertDialogTitle>Delete this Wedding?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>&ldquo;{wedding?.name}&rdquo;</strong> (slug: /{wedding?.slug})?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Yes, Delete Wedding"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
