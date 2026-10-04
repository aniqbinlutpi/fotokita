import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMediaByWeddingId, uploadMedia, deleteMedia, type UploadOptions } from "@/api/media";
import type { MediaItem } from "@/types/media";

export const mediaKeys = {
  all: ["media"] as const,
  byWedding: (weddingId: string) => [...mediaKeys.all, "wedding", weddingId] as const,
  detail: (id: string) => [...mediaKeys.all, "detail", id] as const,
};

export function useMedia(weddingId?: string | null) {
  return useQuery({
    queryKey: mediaKeys.byWedding(weddingId || ""),
    queryFn: async (): Promise<MediaItem[]> => {
      if (!weddingId) return [];
      const items = await getMediaByWeddingId(weddingId);
      return [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: Boolean(weddingId),
  });
}

export function useUploadMedia(weddingId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: UploadOptions) => uploadMedia(options),
    onSuccess: (_newMedia, variables) => {
      const targetId = variables.weddingId || weddingId;
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: mediaKeys.byWedding(targetId) });
      } else {
        queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      }
    },
  });
}

export function useDeleteMedia(weddingId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string) => deleteMedia(mediaId),
    onSuccess: (_data, mediaId) => {
      if (weddingId) {
        // Optimistically or quickly update the local cache
        queryClient.setQueryData<MediaItem[]>(mediaKeys.byWedding(weddingId), (old) => {
          if (!old) return [];
          return old.filter((item) => item.id !== mediaId);
        });
        queryClient.invalidateQueries({ queryKey: mediaKeys.byWedding(weddingId) });
      } else {
        queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      }
    },
  });
}
