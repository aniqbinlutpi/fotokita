import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWeddings,
  getWeddingById,
  getWeddingBySlug,
  createWedding,
  updateWedding,
  deleteWedding,
} from "@/api/wedding";
import type { Wedding, CreateWeddingInput } from "@/types/wedding";

export const weddingKeys = {
  all: ["weddings"] as const,
  lists: () => [...weddingKeys.all, "list"] as const,
  details: () => [...weddingKeys.all, "detail"] as const,
  detailById: (id: string) => [...weddingKeys.details(), "id", id] as const,
  detailBySlug: (slug: string) => [...weddingKeys.details(), "slug", slug] as const,
};

export function useWeddings() {
  return useQuery({
    queryKey: weddingKeys.lists(),
    queryFn: getWeddings,
  });
}

export function useWeddingBySlug(slug?: string | null) {
  return useQuery({
    queryKey: weddingKeys.detailBySlug(slug || ""),
    queryFn: () => getWeddingBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export function useWeddingById(id?: string | null) {
  return useQuery({
    queryKey: weddingKeys.detailById(id || ""),
    queryFn: () => getWeddingById(id!),
    enabled: Boolean(id),
  });
}

export function useActiveWedding(params?: { slug?: string | null; weddingId?: string | null }) {
  const { slug, weddingId } = params || {};

  return useQuery({
    queryKey: [...weddingKeys.all, "active", { slug: slug || null, weddingId: weddingId || null }],
    queryFn: async (): Promise<Wedding> => {
      // 1. If slug is provided, fetch by slug
      if (slug) {
        try {
          const wedding = await getWeddingBySlug(slug);
          if (wedding) return wedding;
        } catch (e) {
          console.warn("Could not find wedding from slug param", e);
        }

        // Check if tenant-service knows this slug and can resolve to weddingId
        try {
          const res = await fetch(`/api/tenant/customization/${encodeURIComponent(slug)}`);
          if (res.ok) {
            const body = (await res.json()) as any;
            if (body?.data?.weddingId) {
              const wedding = await getWeddingById(body.data.weddingId);
              if (wedding) return wedding;
            }
          }
        } catch {
          // ignore
        }
      }

      // 2. If weddingId is provided, fetch by id
      if (weddingId) {
        try {
          const wedding = await getWeddingById(weddingId);
          if (wedding) return wedding;
        } catch (e) {
          console.warn("Could not find wedding from URL param, falling back to listing", e);
        }
      }

      // If a specific slug or weddingId was requested but neither matched, do NOT hijack with another couple's gallery!
      if (slug || weddingId) {
        throw new Error(`Wedding "${slug || weddingId}" not found`);
      }

      // 3. Fallback to first existing wedding only when viewing generic demo without slug
      const weddings = await getWeddings();
      if (weddings && weddings.length > 0) {
        return weddings[0];
      }

      // 4. Create default demo wedding if none exist
      return await createWedding({
        name: "Afiq & Wieam",
        slug: "afiq-wieam",
        date: new Date("2026-12-20T02:00:00Z").toISOString(),
      });
    },
  });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWeddingInput) => createWedding(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weddingKeys.all });
    },
  });
}

export function useUpdateWedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateWeddingInput> }) =>
      updateWedding(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: weddingKeys.all });
      queryClient.setQueryData(weddingKeys.detailById(variables.id), data);
      if (data.slug) {
        queryClient.setQueryData(weddingKeys.detailBySlug(data.slug), data);
      }
    },
  });
}

export function useDeleteWedding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWedding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weddingKeys.all });
    },
  });
}
