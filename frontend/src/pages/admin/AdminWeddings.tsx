import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WeddingsDataTable } from "@/components/admin/WeddingsDataTable";
import type { Wedding } from "@/types/wedding";

interface AdminWeddingsProps {
  weddings: Wedding[];
  copiedId: string | null;
  onCopyLink: (slug: string, id: string) => void;
  onViewGallery: (slug: string) => void;
  onDeleteWedding: (wedding: Wedding) => void;
  onOpenCreateWedding: () => void;
}

export function AdminWeddings({
  weddings,
  copiedId,
  onCopyLink,
  onViewGallery,
  onDeleteWedding,
  onOpenCreateWedding,
}: AdminWeddingsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Weddings Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor, manage, and configure all wedding gallery registrations.
          </p>
        </div>
        <Button
          onClick={onOpenCreateWedding}
          className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Create Wedding</span>
        </Button>
      </div>

      {/* Full Weddings Table powered by TanStack Table */}
      <WeddingsDataTable
        data={weddings}
        copiedId={copiedId}
        onCopyLink={onCopyLink}
        onViewGallery={onViewGallery}
        onDelete={onDeleteWedding}
      />
    </div>
  );
}
