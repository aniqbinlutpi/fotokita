import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { WeddingsDataTable } from "@/components/admin/WeddingsDataTable";
import type { Wedding } from "@/types/wedding";
import type { AdminTenantAccount } from "@/api/admin";

interface AdminWeddingsProps {
  weddings: Wedding[];
  tenantAccounts?: Record<string, AdminTenantAccount>;
  copiedId: string | null;
  onCopyLink: (slug: string, id: string) => void;
  onViewGallery: (slug: string) => void;
  onDeleteWedding: (wedding: Wedding) => void;
  onTogglePreserveMedia?: (weddingId: string, currentVal: boolean) => Promise<void>;
  onTriggerCleanup?: () => Promise<void>;
  isCleaningUp?: boolean;
}

export function AdminWeddings({
  weddings,
  tenantAccounts,
  copiedId,
  onCopyLink,
  onViewGallery,
  onDeleteWedding,
  onTogglePreserveMedia,
  onTriggerCleanup,
  isCleaningUp,
}: AdminWeddingsProps) {
  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-clip">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Weddings Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor, manage, and configure all wedding gallery registrations.
          </p>
        </div>
        {onTriggerCleanup && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onTriggerCleanup}
              disabled={isCleaningUp}
              className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
              title="Scan and delete expired images (past 3-day grace period)"
            >
              <Trash2 className="size-4 text-muted-foreground" />
              <span>{isCleaningUp ? "Cleaning..." : "Run Retention Cleanup"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Full Weddings Table powered by TanStack Table */}
      <WeddingsDataTable
        data={weddings}
        tenantAccounts={tenantAccounts}
        copiedId={copiedId}
        onCopyLink={onCopyLink}
        onViewGallery={onViewGallery}
        onDelete={onDeleteWedding}
        onTogglePreserveMedia={onTogglePreserveMedia}
      />
    </div>
  );
}
