import { handleApiResponse, ApiRequestError } from "./client";
import type { MediaItem, MediaUrlData, ApiError } from "@/types/media";

const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_API_URL || "/api/media";

export async function getMediaByWeddingId(weddingId: string): Promise<MediaItem[]> {
  const response = await fetch(`${MEDIA_BASE_URL}?weddingId=${encodeURIComponent(weddingId)}`);
  return handleApiResponse<MediaItem[]>(response);
}

export async function getMediaById(id: string): Promise<MediaItem> {
  const response = await fetch(`${MEDIA_BASE_URL}/${encodeURIComponent(id)}`);
  return handleApiResponse<MediaItem>(response);
}

export async function getMediaUrl(id: string): Promise<MediaUrlData> {
  const response = await fetch(`${MEDIA_BASE_URL}/${encodeURIComponent(id)}/url`);
  return handleApiResponse<MediaUrlData>(response);
}

export interface UploadOptions {
  weddingId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export function uploadMedia({ weddingId, file, onProgress }: UploadOptions): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("weddingId", weddingId);
    formData.append("file", file);

    xhr.open("POST", MEDIA_BASE_URL, true);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      let responseData: { data?: MediaItem; error?: ApiError } | null = null;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        // Ignored if non-json
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (responseData?.data) {
          resolve(responseData.data);
        } else {
          resolve(responseData as unknown as MediaItem);
        }
      } else {
        const errorData: ApiError = responseData?.error || {
          code: `HTTP_${xhr.status}`,
          message: xhr.statusText || "Upload failed",
        };
        reject(new ApiRequestError(xhr.status, errorData));
      }
    };

    xhr.onerror = () => {
      reject(
        new ApiRequestError(0, {
          code: "NETWORK_ERROR",
          message: "Network error occurred while uploading media",
        })
      );
    };

    xhr.send(formData);
  });
}

export async function deleteMedia(id: string): Promise<{ id: string }> {
  const response = await fetch(`${MEDIA_BASE_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleApiResponse<{ id: string }>(response);
}
