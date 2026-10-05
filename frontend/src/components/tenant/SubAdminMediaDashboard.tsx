import React, { useState, useMemo, useRef } from "react";
import {
  Download,
  Image as ImageIcon,
  HardDrive,
  Heart,
  Sparkles,
  RefreshCw,
  Search,
  AlertCircle,
  X,
  FileArchive,
  ExternalLink,
  Sliders,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMedia } from "@/hooks/queries/useMedia";
import { getMediaUrl } from "@/api/media";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";
import type { TenantCustomization } from "@/api/tenant";
import {
  formatBytes,
  downloadAllMediaAsZip,
  type BatchZipProgress,
} from "@/lib/mediaZip";
import { downloadPhotoboothCard } from "@/lib/photoboothCanvas";

interface SubAdminMediaDashboardProps {
  weddingId: string;
  wedding?: Wedding | null;
  customization?: TenantCustomization;
  onSwitchToEditor?: () => void;
  onOpenGuestView?: () => void;
}

export const SubAdminMediaDashboard: React.FC<SubAdminMediaDashboardProps> = ({
  weddingId,
  wedding,
  customization,
  onSwitchToEditor,
  onOpenGuestView,
}) => {
  const { data: mediaList = [], isLoading, isFetching, refetch } = useMedia(weddingId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "wishes" | "signature">("all");

  // Batch download state
  const [downloadingMode, setDownloadingMode] = useState<"raw" | "portrait" | null>(null);
  const [progress, setProgress] = useState<BatchZipProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Individual item downloading status map
  const [downloadingItemIds, setDownloadingItemIds] = useState<Record<string, "raw" | "portrait">>({});

  // Computed metrics
  const totalCount = mediaList.length;
  const totalBytes = useMemo(() => {
    return mediaList.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
  }, [mediaList]);
  const formattedTotalSize = useMemo(() => formatBytes(totalBytes), [totalBytes]);

  const wishesCount = useMemo(() => {
    return mediaList.filter((m) => Boolean(m.wishes?.trim())).length;
  }, [mediaList]);

  const signatureCount = useMemo(() => {
    return mediaList.filter((m) => Boolean(m.signature)).length;
  }, [mediaList]);

  // Couple name & date for photobooth cards
  const coupleName = useMemo(() => {
    if (customization?.partner1 && customization?.partner2) {
      return `${customization.partner1.trim()} & ${customization.partner2.trim()}`;
    }
    return wedding?.name || "The Celebration Of Love";
  }, [customization, wedding?.name]);

  const weddingDate = useMemo(() => {
    return customization?.weddingDate || wedding?.date;
  }, [customization, wedding?.date]);

  // Filtered list
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      // Type filter
      if (filterType === "wishes" && !item.wishes?.trim()) return false;
      if (filterType === "signature" && !item.signature) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = item.fromName?.toLowerCase().includes(q);
      const matchWishes = item.wishes?.toLowerCase().includes(q);
      const matchFilename = item.filename?.toLowerCase().includes(q);
      return matchName || matchWishes || matchFilename;
    });
  }, [mediaList, filterType, searchQuery]);

  // Batch download trigger
  const handleStartBatchDownload = async (mode: "raw" | "portrait") => {
    if (totalCount === 0) {
      toast.info("Tiada media untuk dimuat turun.");
      return;
    }

    if (downloadingMode) {
      toast.warning("Muat turun sedang berjalan. Sila tunggu atau batalkan sebelum memulakan yang baru.");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setDownloadingMode(mode);
    setProgress({
      current: 0,
      total: totalCount,
      percent: 0,
      stage: "fetching",
      statusText: "Menyediakan sambungan fail...",
    });

    try {
      await downloadAllMediaAsZip({
        items: mediaList,
        wedding,
        mode,
        customNames: coupleName,
        customDate: weddingDate,
        signal: abortController.signal,
        onProgress: (p) => setProgress(p),
      });

      toast.success(
        mode === "raw"
          ? "Semua foto asal (Raw) berjaya dimuat turun ke komputer anda!"
          : "Semua foto dengan Template Portrait berjaya dimuat turun!"
      );
    } catch (err: any) {
      if (abortController.signal.aborted) {
        toast.info("Muat turun telah dibatalkan.");
      } else {
        console.error("Batch download error:", err);
        toast.error("Gagal menjana fail ZIP", {
          description: err?.message || "Sila cuba sebentar lagi.",
        });
      }
    } finally {
      setDownloadingMode(null);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelBatchDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Individual single media download
  const handleDownloadSingle = async (item: MediaItem, mode: "raw" | "portrait") => {
    setDownloadingItemIds((prev) => ({ ...prev, [item.id]: mode }));
    try {
      const urlData = await getMediaUrl(item.id);
      if (!urlData?.url) {
        throw new Error("Pautan muat turun tidak ditemui.");
      }

      if (mode === "raw") {
        // Direct link download
        const a = document.createElement("a");
        a.href = urlData.url;
        a.download = item.filename || "guest-photo.jpg";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Memuat turun foto asal: ${item.filename}`);
      } else {
        // Photobooth portrait card download
        await downloadPhotoboothCard(urlData.url, wedding, item.filename, {
          coupleName,
          weddingDate,
          wishes: item.wishes,
          from: item.fromName,
          signature: item.signature,
        });
        toast.success("Foto berbingkai portrait berjaya dimuat turun!");
      }
    } catch (err: any) {
      console.error("Single download error:", err);
      toast.error("Gagal muat turun gambar", {
        description: err?.message || "Sila periksa sambungan internet.",
      });
    } finally {
      setDownloadingItemIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl sm:text-3xl font-medium tracking-tight text-foreground">
              Guest Uploads & Downloads
            </h1>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border-accent/40 text-accent font-mono shrink-0">
              Live Media
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pantau dan muat turun semua gambar yang diabadikan oleh tetamu untuk{" "}
            <span className="font-medium text-foreground">{coupleName}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 cursor-pointer gap-1.5 flex-1 sm:flex-initial"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-accent" : ""}`} />
            <span>Segarkan</span>
          </Button>

          {onSwitchToEditor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToEditor}
              className="text-xs h-8 cursor-pointer gap-1.5 flex-1 sm:flex-initial"
            >
              <Sliders className="size-3.5 text-muted-foreground" />
              <span className="hidden xs:inline">Editor Layout</span>
              <span className="xs:hidden">Editor</span>
            </Button>
          )}

          {onOpenGuestView && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenGuestView}
              className="text-xs h-8 cursor-pointer gap-1.5 w-full xs:w-auto"
            >
              <ExternalLink className="size-3.5" />
              <span>Lihat Galeri Tetamu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Photos */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Jumlah Gambar & Media
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {isLoading ? "..." : totalCount}
              </span>
              <span className="text-xs text-muted-foreground">foto dimuat naik</span>
            </div>
          </div>
          <div className="size-10 sm:size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ImageIcon className="size-4.5 sm:size-5" />
          </div>
        </div>

        {/* Total Storage Size */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Jumlah Saiz Keseluruhan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground font-mono">
                {isLoading ? "..." : formattedTotalSize}
              </span>
              <span className="text-xs text-muted-foreground">di storan S3</span>
            </div>
          </div>
          <div className="size-10 sm:size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HardDrive className="size-4.5 sm:size-5" />
          </div>
        </div>

        {/* Wishes & Signatures */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Ucapan & Tandatangan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {isLoading ? "..." : wishesCount}
              </span>
              <span className="text-xs text-muted-foreground">
                ucapan • {signatureCount} sign
              </span>
            </div>
          </div>
          <div className="size-10 sm:size-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Heart className="size-4.5 sm:size-5" />
          </div>
        </div>
      </div>

      {/* Main Bulk Download Actions Banner */}
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xs p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-border/60 pb-3.5 sm:pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileArchive className="size-5 text-accent shrink-0" />
              <h2 className="text-base sm:text-lg font-serif font-medium text-foreground">
                Pilihan Muat Turun Pukal (Download All as ZIP)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih format arkib ZIP yang anda perlukan. Semua gambar dimampatkan terus ke komputer anda.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-muted/50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border/50 self-start md:self-auto shrink-0">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">{formattedTotalSize}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground font-semibold">{totalCount} Foto</span>
          </div>
        </div>

        {/* The Two Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Option 1: Raw ZIP */}
          <div className="rounded-xl border border-border bg-sidebar-accent/25 hover:bg-sidebar-accent/40 p-3.5 sm:p-4 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Download className="size-3.5 text-accent shrink-0" />
                  Format 1: Raw Asal
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {formattedTotalSize}
                </Badge>
              </div>
              <h3 className="font-medium text-sm text-foreground">
                Download Semua Foto Asal (Raw .ZIP)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Memuat turun semua gambar resolusi asal tanpa template atau bingkai, sesuai untuk arkib fotografi peribadi.
              </p>
            </div>

            <Button
              onClick={() => handleStartBatchDownload("raw")}
              disabled={Boolean(downloadingMode) || totalCount === 0}
              className="w-full text-xs h-9 cursor-pointer gap-2"
              variant="outline"
            >
              {downloadingMode === "raw" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  <span className="truncate">Sedang Memproses Raw ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5 shrink-0" />
                  <span className="truncate">Download Raw ZIP ({totalCount} Foto)</span>
                </>
              )}
            </Button>
          </div>

          {/* Option 2: With Portrait Template ZIP */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 hover:bg-accent/10 p-3.5 sm:p-4 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent shrink-0" />
                  Format 2: Kad Photobooth
                </span>
                <Badge variant="default" className="text-[10px] bg-accent text-accent-foreground">
                  Disyorkan
                </Badge>
              </div>
              <h3 className="font-medium text-sm text-foreground">
                Download Dengan Template Portrait (.ZIP)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Setiap foto dicetak ke kad photobooth polaroid lengkap dengan nama pasangan, tarikh, ucapan, dan tandatangan tetamu.
              </p>
            </div>

            <Button
              onClick={() => handleStartBatchDownload("portrait")}
              disabled={Boolean(downloadingMode) || totalCount === 0}
              className="w-full text-xs h-9 cursor-pointer gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-xs"
            >
              {downloadingMode === "portrait" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin shrink-0" />
                  <span className="truncate">Sedang Menjana Portrait ZIP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 shrink-0" />
                  <span className="truncate">Download Portrait Template ZIP</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Progress Bar Indicator when downloading */}
        {progress && downloadingMode && (
          <div className="rounded-xl border border-accent/30 bg-background/95 p-3.5 sm:p-4 space-y-2.5 animate-in fade-in-50">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground truncate min-w-0">
                <Loader2 className="size-3.5 animate-spin text-accent shrink-0" />
                <span className="truncate">{progress.statusText}</span>
              </div>
              <div className="flex items-center justify-between xs:justify-end gap-3 shrink-0">
                <span className="font-mono text-muted-foreground text-[11px] sm:text-xs">
                  {progress.percent}% ({progress.current}/{progress.total})
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelBatchDownload}
                  className="h-6 px-2 text-[11px] text-destructive hover:text-destructive cursor-pointer hover:bg-destructive/10"
                >
                  <X className="size-3 mr-1" />
                  Batal
                </Button>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Gallery List & Filtering Header */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium text-foreground">
              Senarai Gambar Tetamu
            </h3>
            <span className="text-xs text-muted-foreground">
              ({filteredList.length} daripada {totalCount})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Filter Pills */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer text-center whitespace-nowrap ${
                  filterType === "all"
                    ? "bg-background shadow-xs font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("wishes")}
                className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer text-center whitespace-nowrap ${
                  filterType === "wishes"
                    ? "bg-background shadow-xs font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ada Ucapan ({wishesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("signature")}
                className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer text-center whitespace-nowrap ${
                  filterType === "signature"
                    ? "bg-background shadow-xs font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ada Sign ({signatureCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60 md:w-64">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari pengirim atau ucapan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-card w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center space-y-3 bg-card/30">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
            <h4 className="font-serif text-base font-medium text-foreground">
              {searchQuery ? "Tiada padanan dijumpai" : "Belum Ada Gambar Dimuat Naik"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `Tiada gambar tetamu yang sepadan dengan "${searchQuery}".`
                : "Tetamu belum memuat naik gambar lagi. Kongsi kod QR atau pautan galeri pada tetamu anda."}
            </p>
            {onOpenGuestView && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenGuestView}
                className="text-xs cursor-pointer gap-1.5"
              >
                <ExternalLink className="size-3.5" />
                <span>Buka Galeri Untuk Uji Upload</span>
              </Button>
            )}
          </div>
        ) : (
          /* Grid of Media Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredList.map((item, index) => (
              <MediaCardItem
                key={item.id}
                item={item}
                index={index}
                wedding={wedding}
                coupleName={coupleName}
                weddingDate={weddingDate}
                isDownloadingRaw={downloadingItemIds[item.id] === "raw"}
                isDownloadingPortrait={downloadingItemIds[item.id] === "portrait"}
                onDownloadRaw={() => handleDownloadSingle(item, "raw")}
                onDownloadPortrait={() => handleDownloadSingle(item, "portrait")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MediaCardItemProps {
  item: MediaItem;
  index: number;
  wedding?: Wedding | null;
  coupleName: string;
  weddingDate?: string;
  isDownloadingRaw: boolean;
  isDownloadingPortrait: boolean;
  onDownloadRaw: () => void;
  onDownloadPortrait: () => void;
}

const MediaCardItem: React.FC<MediaCardItemProps> = ({
  item,
  index,
  isDownloadingRaw,
  isDownloadingPortrait,
  onDownloadRaw,
  onDownloadPortrait,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    getMediaUrl(item.id)
      .then((data) => {
        if (isMounted) setImageUrl(data.url);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });
    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(item.createdAt).toLocaleDateString("ms-MY", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [item.createdAt]);

  const fileSize = formatBytes(item.size);

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
      {/* Thumbnail Aspect Square */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.filename || "Guest upload"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : hasError ? (
          <div className="text-center p-3 text-muted-foreground space-y-1">
            <AlertCircle className="size-5 mx-auto text-destructive/70" />
            <span className="text-[10px] block">Gagal memuat</span>
          </div>
        ) : (
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white font-medium">
            #{index + 1}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90">
            {fileSize}
          </span>
        </div>

        {/* Signature indicator */}
        {item.signature && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/90 text-white text-[9px] font-medium flex items-center gap-1 shadow-xs"
            title="Mengandungi tandatangan tetamu"
          >
            <Sparkles className="size-2.5" />
            <span>Sign</span>
          </div>
        )}
      </div>

      {/* Info & Metadata */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground truncate flex items-center gap-1">
              <User className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate">{item.fromName || "Tetamu Tanpa Nama"}</span>
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
              {formattedDate}
            </span>
          </div>

          {item.wishes ? (
            <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed bg-muted/30 p-1.5 rounded border border-border/40 font-serif">
              "{item.wishes}"
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/60 italic">Tiada ucapan teks.</p>
          )}
        </div>

        {/* Action Buttons: Raw vs Portrait */}
        <div className="pt-2 grid grid-cols-2 gap-1.5 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            onClick={onDownloadRaw}
            disabled={isDownloadingRaw || !imageUrl}
            className="h-7.5 text-[11px] px-2 cursor-pointer gap-1 truncate"
            title="Download foto asal (Raw)"
          >
            {isDownloadingRaw ? (
              <Loader2 className="size-3 animate-spin shrink-0" />
            ) : (
              <Download className="size-3 shrink-0" />
            )}
            <span className="truncate">Raw</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={onDownloadPortrait}
            disabled={isDownloadingPortrait || !imageUrl}
            className="h-7.5 text-[11px] px-2 cursor-pointer gap-1 bg-accent hover:bg-accent/90 text-accent-foreground truncate font-medium"
            title="Download dengan template photobooth portrait"
          >
            {isDownloadingPortrait ? (
              <Loader2 className="size-3 animate-spin shrink-0" />
            ) : (
              <Sparkles className="size-3 shrink-0" />
            )}
            <span className="truncate">Portrait</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
