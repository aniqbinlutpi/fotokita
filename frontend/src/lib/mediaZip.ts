import JSZip from "jszip";
import type { MediaItem } from "@/types/media";
import type { Wedding } from "@/types/wedding";
import { getMediaUrl, getMediaProxyUrl } from "@/api/media";
import { createPhotoboothComposite } from "./photoboothCanvas";

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export async function fetchMediaBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  // 1. Try direct fetch
  try {
    const res = await fetch(url, { mode: "cors", signal });
    if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
      return await res.blob();
    }
  } catch {
    // direct fetch failed (e.g. S3 CORS restriction)
  }

  // 2. Try proxy endpoint
  const proxyUrl = getMediaProxyUrl(url);
  const res = await fetch(proxyUrl, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch media blob: ${res.statusText}`);
  }
  return await res.blob();
}

export interface BatchZipProgress {
  current: number;
  total: number;
  percent: number;
  stage: "fetching" | "processing" | "zipping" | "completed" | "error";
  statusText: string;
}

export interface BatchDownloadOptions {
  items: MediaItem[];
  wedding?: Wedding | null;
  mode: "raw" | "portrait";
  customNames?: string;
  customDate?: string;
  onProgress?: (progress: BatchZipProgress) => void;
  signal?: AbortSignal;
}

export async function downloadAllMediaAsZip({
  items,
  wedding,
  mode,
  customNames,
  customDate,
  onProgress,
  signal,
}: BatchDownloadOptions): Promise<void> {
  if (!items || items.length === 0) {
    throw new Error("No media items to download");
  }

  const zip = new JSZip();
  const total = items.length;
  const coupleName = customNames || wedding?.name || "The Celebration Of Love";
  const weddingDate = customDate || wedding?.date;
  const baseSlug = (wedding?.slug || "fotokita-wedding").replace(/[^a-z0-9_-]/gi, "-");

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      throw new Error("Download cancelled by user");
    }

    const item = items[i]!;
    const itemNum = i + 1;
    const itemIndexStr = String(itemNum).padStart(3, "0");

    onProgress?.({
      current: itemNum,
      total,
      percent: Math.round(((i) / total) * 80),
      stage: mode === "portrait" ? "processing" : "fetching",
      statusText:
        mode === "portrait"
          ? `Jana template portrait (${itemNum}/${total})...`
          : `Muat turun foto asal (${itemNum}/${total})...`,
    });

    try {
      // 1. Get presigned URL
      const urlData = await getMediaUrl(item.id);
      if (!urlData?.url) {
        console.warn(`Skipping item ${item.id}: could not get presigned url`);
        continue;
      }

      const rawExt = item.filename.includes(".")
        ? item.filename.split(".").pop() || "jpg"
        : "jpg";
      const baseFilename = item.filename
        ? item.filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]/gi, "_")
        : `photo-${itemIndexStr}`;

      if (mode === "raw") {
        const blob = await fetchMediaBlob(urlData.url, signal);
        const zipFileName = `${itemIndexStr}_${baseFilename}.${rawExt}`;
        zip.file(zipFileName, blob);
      } else {
        // Mode portrait: generate photobooth composite card with template
        const compositeBlob = await createPhotoboothComposite(urlData.url, wedding, {
          coupleName,
          weddingDate,
          wishes: item.wishes,
          from: item.fromName,
          signature: item.signature,
        });
        const zipFileName = `${itemIndexStr}_${baseFilename}_portrait.jpg`;
        zip.file(zipFileName, compositeBlob);
      }
    } catch (err) {
      if (signal?.aborted) throw new Error("Download cancelled by user");
      console.error(`Failed to process item ${item.id} for zip:`, err);
    }
  }

  if (signal?.aborted) {
    throw new Error("Download cancelled by user");
  }

  onProgress?.({
    current: total,
    total,
    percent: 85,
    stage: "zipping",
    statusText: "Memampatkan semua gambar ke fail ZIP...",
  });

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const zipPercent = 85 + Math.round((metadata.percent / 100) * 14);
      onProgress?.({
        current: total,
        total,
        percent: Math.min(99, zipPercent),
        stage: "zipping",
        statusText: `Memampatkan arkib ZIP... (${Math.round(metadata.percent)}%)`,
      });
    }
  );

  onProgress?.({
    current: total,
    total,
    percent: 100,
    stage: "completed",
    statusText: "Muat turun selesai!",
  });

  // Trigger file download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const downloadLink = document.createElement("a");
  const timestamp = new Date().toISOString().split("T")[0];
  downloadLink.href = downloadUrl;
  downloadLink.download = `${baseSlug}-${mode === "portrait" ? "portrait-cards" : "raw-photos"}-${timestamp}.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);
}
