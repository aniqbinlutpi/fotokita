import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, LogIn, AlertCircle } from "lucide-react";
import { loginTenant, type TenantAccount } from "@/api/tenant";
import { toast } from "sonner";

interface SubAdminLoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tenant: TenantAccount) => void;
}

export const SubAdminLoginModal: React.FC<SubAdminLoginModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill username if tenant recently registered
  React.useEffect(() => {
    if (isOpen) {
      const activeWeddingId = localStorage.getItem("fotokita_active_wedding_id");
      const savedUser =
        localStorage.getItem("fotokita_registered_username") ||
        (activeWeddingId ? localStorage.getItem(`fotokita_subadmin_user_${activeWeddingId}`) : null) ||
        "";
      if (savedUser && !identifier) {
        setIdentifier(savedUser);
      }
      const savedPin = activeWeddingId ? localStorage.getItem(`fotokita_admin_pin_${activeWeddingId}`) : null;
      if (savedPin && !password) {
        setPassword(savedPin);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Sila masukkan email/username dan kata laluan.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await loginTenant({
        identifier: identifier.trim(),
        password: password.trim(),
      });

      toast.success("Log masuk berjaya!", {
        description: `Selamat kembali ke portal galeri ${result.tenant.weddingName}.`,
      });

      onOpenChange(false);
      onSuccess(result.tenant);
    } catch (err: any) {
      console.error("Sub-Admin login failed:", err);
      setErrorMessage(
        err?.message || "Email/username atau kata laluan tidak tepat. Sila semak semula."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier("aina1");
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6">
        <DialogHeader className="space-y-2 text-center items-center">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Lock className="size-6 text-foreground" />
          </div>
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Portal Sub-Admin Log Masuk
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            Sila masukkan username atau emel berserta kata laluan yang telah anda daftarkan.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="tenant-id" className="text-xs font-medium">
              Email atau Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="tenant-id"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. aina1 atau nama@email.com"
                className="pl-9 h-10 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="tenant-password" className="text-xs font-medium">
                Kata Laluan / PIN
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="tenant-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 h-10 text-sm"
                required
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-xs uppercase tracking-wider font-semibold shadow-md cursor-pointer"
            >
              {isLoading ? (
                <span>Sedang Memproses...</span>
              ) : (
                <>
                  <span>Log Masuk Sub-Admin</span>
                  <LogIn className="size-4 ml-1.5" />
                </>
              )}
            </Button>

            {/* Quick Demo Credentials Helper */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
              >
                Gunakan akaun demo (aina1 / password123)
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
