import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Lock } from "lucide-react";
import type { Wedding } from "@/types/wedding";

interface DeleteWeddingDialogProps {
  wedding: Wedding | null;
  onClose: () => void;
  isDeleting: boolean;
  onConfirm: (password: string) => void;
}

export function DeleteWeddingDialog({
  wedding,
  onClose,
  isDeleting,
  onConfirm,
}: DeleteWeddingDialogProps) {
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset input when dialog opens or wedding changes
  useEffect(() => {
    if (wedding) {
      setAdminPassword("");
      setErrorMsg(null);
    }
  }, [wedding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setErrorMsg("Sila masukkan kata laluan admin untuk meneruskan");
      return;
    }
    setErrorMsg(null);
    onConfirm(adminPassword.trim());
  };

  return (
    <AlertDialog open={!!wedding} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete this Wedding?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-left">
              <div>
                Are you sure you want to delete{" "}
                <strong>&ldquo;{wedding?.name}&rdquo;</strong> (slug: /{wedding?.slug})?
              </div>
              <div className="text-xs text-destructive/90 bg-destructive/10 p-2.5 rounded-md border border-destructive/20 leading-relaxed">
                ⚠️ <strong>Full Purge:</strong> Tindakan ini akan memadam rekod majlis, semua foto &amp; video daripada storan Cloudflare/S3, ucapan tetamu, dan akaun login Sub-Admin secara kekal.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Admin Password Verification Field */}
          <div className="space-y-1.5 pt-1 text-left">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              <span>Sahkan dengan Kata Laluan Super Admin:</span>
            </label>
            <Input
              type="password"
              placeholder="Masukkan kata laluan login admin..."
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={isDeleting}
              className="h-9"
              autoFocus
            />
            {errorMsg && (
              <p className="text-xs text-destructive font-medium">{errorMsg}</p>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || !adminPassword.trim()}
              className="gap-1.5"
            >
              <Lock className="size-3.5" />
              <span>{isDeleting ? "Verifying & Purging..." : "Confirm & Delete All"}</span>
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
